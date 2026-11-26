// Plays a full game against a running server with simulated players and checks the rules.
// Usage: BASE=http://localhost:3000 HOST_PASSWORD=admin BOTS=30 node scripts/simulate.mjs
const BASE = process.env.BASE ?? "http://localhost:3000";
const PASSWORD = process.env.HOST_PASSWORD ?? "admin";
const BOTS = Number(process.env.BOTS ?? 30);
const FULL_TIMER = process.env.FULL_TIMER === "1"; // wait for the real 20 s on question 1

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ✓", msg);
  else { failures++; console.log("  ✗ FAIL:", msg); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let cookie = "";
async function call(path, { method, body, headers = {}, host = false, raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(host ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, res };
}

const AVATARS = ["fox", "panda", "lion", "tiger", "koala", "frog", "monkey", "owl", "penguin", "octopus", "unicorn", "turtle", "dolphin", "giraffe", "bee", "trex"];

console.log("== Host login");
let r = await call("/api/host/login", { body: { password: "wrong" } });
ok(r.status === 401, "wrong password is rejected");
r = await call("/api/host/login", { body: { password: PASSWORD } });
ok(r.status === 200, "correct password accepted");
cookie = r.res.headers.get("set-cookie").split(";")[0];
r = await call("/api/host/games", { method: "GET" });
ok(r.status === 401, "host API without cookie is rejected");

console.log("== Create game");
r = await call("/api/host/games", { body: { title: "Simulation", lang: "es" }, host: true });
ok(r.status === 200 && /^[A-Z0-9]{5}$/.test(r.data.code), `game created with 5-char code (${r.data.code})`);
const code = r.data.code;
const host = (path, body) => call(`/api/host/games/${code}${path}`, { body, host: true });
const hostState = async () => (await call(`/api/host/games/${code}/state`, { host: true })).data;
ok((await hostState()).lang === "es", "game was created in Spanish");

console.log("== Joining");
const bots = [];
await Promise.all(Array.from({ length: BOTS }, async (_, i) => {
  const res = await call("/api/join", { body: { code, name: `Bot${i + 1}`, avatar: AVATARS[i % 16] } });
  if (res.status === 200) bots.push({ ...res.data, i, accuracy: 0.3 + 0.6 * ((i % 10) / 9), streakTest: i === 0 });
}));
ok(bots.length === BOTS, `${BOTS} players joined`);
r = await call("/api/join", { body: { code, name: "bot1", avatar: "fox" } });
ok(r.status === 409 && r.data.code === "name_taken", "duplicate name (case-insensitive) is rejected with an error code");
r = await call("/api/join", { body: { code, name: "Nobody", avatar: "dragon" } });
ok(r.status === 400, "invalid avatar is rejected");
r = await call("/api/join", { body: { code, name: "x".repeat(40), avatar: "fox" } });
ok(r.status === 400, "name longer than 16 chars is rejected");
r = await call("/api/join", { body: { code: "ZZZZZ", name: "Ghost", avatar: "fox" } });
ok(r.status === 404, "unknown game code gives 404");
let hs = await hostState();
ok(hs.phase === "lobby" && hs.players.length === BOTS, "host lobby lists all players");

const playerState = async (b) =>
  (await call(`/api/game/${code}/state?playerId=${b.playerId}`, { headers: { "x-player-token": b.token } })).data;
const answer = (b, q, choice, token = b.token) =>
  call("/api/answer", { body: { code, playerId: b.playerId, questionIndex: q, choice }, headers: { "x-player-token": token } });

console.log("== Game flow");
r = await host("/advance", { action: "open" });
ok(r.data.phase === "lobby", "out-of-order action is a no-op");
r = await host("/advance", { action: "start" });
ok(r.data.phase === "question" && r.data.qIndex === 0, "start -> question 1");
const early = await answer(bots[0], 0, 0);
ok(early.status === 409, "answering before the host opens answers is rejected");

const seen = { leaderboards: [] };
const expectLeaderboardAfter = new Set([1, 3, 5, 7]);
for (let q = 0; q < 10; q++) {
  console.log(`-- Question ${q + 1}`);
  r = await host("/advance", { action: "open" });
  ok(r.data.phase === "answering" && r.data.endsAt > r.data.serverNow, "open -> answering with a timer");
  const type = r.data.question.type;
  const nOpts = r.data.question.options.length;
  ok(r.data.correctIndex === undefined && r.data.explanation === undefined, "host state does not leak the answer while answering");

  const ps = await playerState(bots[0]);
  if (q === 0) {
    ok(ps.lang === "es" && ps.question.options.includes("Un chatbot que entiende el lenguaje natural"), "phones receive the options in Spanish");
    ok((await hostState()).question.text.startsWith("¿Cuál de los siguientes"), "host receives the question text in Spanish");
    const bad = await host("/language", { lang: "fr" });
    ok(bad.status === 400 && bad.data.code === "bad_lang", "unknown language is rejected");
    const sw = await host("/language", { lang: "en" });
    ok(sw.data.lang === "en" && sw.data.question.text.startsWith("Which of the following"), "host can switch to English mid-question");
    const psEn = await playerState(bots[0]);
    ok(psEn.lang === "en" && psEn.question.options.includes("A chatbot that understands natural language"), "phones follow the switch to English");
    const noauth = await call(`/api/host/games/${code}/language`, { body: { lang: "es" } });
    ok(noauth.status === 401, "changing language requires host login");
    await host("/language", { lang: "es" });
  }
  ok(ps.question?.options?.length === nOpts && ps.result === undefined && !JSON.stringify(ps).includes("correctIndex"), "player state has options but no correct answer");

  // Bots answer with random delays; remember choices to verify scoring later.
  const choices = new Map();
  await Promise.all(bots.map(async (b) => {
    await sleep(Math.random() * 600);
    const choice = Math.floor(Math.random() * nOpts);
    const res = await answer(b, q, choice);
    if (res.status === 200) choices.set(b.playerId, choice);
    else ok(false, `bot answer failed: ${res.status} ${res.data.error}`);
  }));
  ok(choices.size === BOTS, "all players answered");
  const dup = await answer(bots[1], q, 0);
  ok(dup.status === 409, "second answer from same player is rejected");
  const bad = await answer(bots[2], q + 1, 0);
  ok(bad.status === 409, "answer for a different question index is rejected");
  const forged = await answer(bots[3], q, 0, "not-the-token");
  ok(forged.status === 401, "wrong token is rejected");
  hs = await hostState();
  ok(hs.answered === BOTS, `host sees ${hs.answered}/${BOTS} answered`);

  if (q === 0 && FULL_TIMER) {
    const wait = hs.endsAt - Date.now() + 900;
    console.log(`  … waiting ${Math.round(wait / 1000)} s for the real timer`);
    await sleep(wait);
    const late = await answer({ ...bots[0] }, 0, 0);
    ok(late.status === 409, "answer after the timer is rejected");
  }

  r = await host("/advance", { action: "reveal" });
  const rv = r.data;
  ok(rv.phase === "reveal" && Number.isInteger(rv.correctIndex) && rv.explanation, "reveal shows correct answer + explanation");
  if (q === 0) ok(rv.explanation.startsWith("La IA es software"), "reveal explanation is in Spanish");
  ok(rv.distribution.reduce((a, b) => a + b, 0) === BOTS, "distribution sums to the number of players");
  const again = await host("/advance", { action: "reveal" });
  ok(again.data.phase === "reveal", "double reveal is idempotent");

  let correctCount = 0;
  for (const b of bots.slice(0, 8)) {
    const s = await playerState(b);
    const chose = choices.get(b.playerId);
    const isCorrect = chose === rv.correctIndex;
    correctCount += isCorrect ? 1 : 0;
    const pts = s.result.points;
    if (isCorrect) ok(s.result.isCorrect && pts >= 500 && pts <= 1500, `bot ${b.i + 1}: correct, ${pts} pts in range`);
    else ok(!s.result.isCorrect && pts === 0, `bot ${b.i + 1}: wrong, 0 pts`);
  }

  r = await host("/advance", { action: "next" });
  if (q === 9) {
    ok(r.data.phase === "podium", "after question 10 -> podium (no leaderboard)");
  } else if (expectLeaderboardAfter.has(q)) {
    ok(r.data.phase === "leaderboard", `leaderboard shown after question ${q + 1}`);
    ok(r.data.leaderboard.length === Math.min(5, BOTS), "leaderboard has the top 5");
    const sc = r.data.leaderboard.map((x) => x.score);
    ok(sc.every((v, i) => i === 0 || sc[i - 1] >= v), "leaderboard is sorted by score");
    seen.leaderboards.push(q + 1);
    const mine = await playerState(bots[5]);
    ok(mine.me.rank >= 1 && typeof mine.me.score === "number", "player sees own rank/score on leaderboard");
    r = await host("/advance", { action: "next" });
    ok(r.data.phase === "question" && r.data.qIndex === q + 1, "leaderboard -> next question");
  } else {
    ok(r.data.phase === "question" && r.data.qIndex === q + 1, `no leaderboard after question ${q + 1}`);
  }
}
ok(seen.leaderboards.join() === "2,4,6,8", "leaderboards only after questions 2,4,6,8");

console.log("== Podium & export");
hs = await hostState();
ok(hs.phase === "podium" && hs.standings.length === BOTS, "podium has full standings");
ok(hs.standings[0].rank === 1 && hs.standings[0].score >= hs.standings[1].score, "winner has the highest score");
ok(hs.snapshot && ["AI Curious", "AI Practitioner", "AI Builder"].includes(hs.snapshot.profile), `team snapshot present (${hs.snapshot?.overallPct}% → ${hs.snapshot?.profile})`);
ok(hs.snapshot.byLevel.length === 4 && hs.snapshot.perQuestion.length === 10, "snapshot has 4 levels (incl. Bonus) and 10 questions");
const fin = await playerState(bots[0]);
ok(fin.top3?.length === 3 && fin.me.correct !== undefined, "player final screen has top 3 + own stats");
const csvRes = await call(`/api/host/games/${code}/export?round=1`, { host: true, raw: true });
const csv = await csvRes.text();
ok(csvRes.status === 200 && csv.split("\r\n").filter(Boolean).length === BOTS + 1, "CSV has header + one row per player");
ok(csvRes.headers.get("content-disposition")?.includes(code), "CSV filename includes the code");
const sum = await (await call(`/api/host/games/${code}/export?round=1&kind=summary`, { host: true, raw: true })).text();
ok(sum.includes("overall") && sum.includes("topic"), "summary CSV generated");
const noauth = await call(`/api/host/games/${code}/export`, { raw: true });
ok(noauth.status === 401, "export requires host login");

console.log("== Restart");
r = await host("/restart", { mode: "same_players" });
ok(r.status === 200 && r.data.round === 2, "restart (same players) -> round 2");
hs = await hostState();
ok(hs.phase === "lobby" && hs.players.length === BOTS, "players kept in lobby");
const p2 = await playerState(bots[0]);
ok(p2.me && p2.phase === "lobby", "player still recognised after restart");
const oldCsv = await (await call(`/api/host/games/${code}/export?round=1`, { host: true, raw: true })).text();
ok(oldCsv.split("\r\n").filter(Boolean).length === BOTS + 1, "round 1 results still exportable after restart");
await host("/start".replace("/start", "/advance"), { action: "start" });
hs = await hostState();
ok(hs.phase === "question" && hs.round === 2, "round 2 can be played");
r = await host("/restart", { mode: "fresh" });
hs = await hostState();
ok(hs.phase === "lobby" && hs.players.length === 0, "restart (fresh) empties the lobby");
const gone = await playerState(bots[0]);
ok(gone.me === null, "old player credentials no longer valid after fresh restart");
const oldCsv2 = await (await call(`/api/host/games/${code}/export?round=1`, { host: true, raw: true })).text();
ok(oldCsv2.split("\r\n").filter(Boolean).length === BOTS + 1, "round 1 still exportable after fresh restart");

console.log("== Kick & archive");
const j = await call("/api/join", { body: { code, name: "Kickme", avatar: "owl" } });
await host("/kick", { playerId: j.data.playerId });
ok((await playerState(j.data)).me === null, "kicked player is removed");
await host("/archive", {});
const list = await call("/api/host/games", { host: true });
ok(!list.data.games.some((g) => g.code === code), "archived game disappears from the list");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
