# AI Quiz Live · Workshop DT DS León

Real-time, Kahoot-style quiz about AI (10 questions, 20 s each). Players join from their phones with a 5-character
code; the host presents from a laptop/projector. Built with Next.js 16 + Supabase, deployed on Vercel.
See [`PLAN.md`](PLAN.md) for the design.

## Run locally (no Supabase needed)

```bash
npm install
npm run dev          # http://localhost:3000
```

Without Supabase credentials the dev server uses an in-memory store and polling (host password: `admin`).
Host screen: `/host`. Players: `/`.

```bash
npm test                                   # unit tests (scoring)
npm run build && USE_MEMORY_STORE=1 npm start -- -p 3100
BASE=http://localhost:3100 BOTS=45 node scripts/simulate.mjs   # full game with simulated players
```

## Deploy (Vercel + Supabase)

1. **Supabase** → New project → SQL Editor → run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
2. Copy from *Project Settings → API*: Project URL, `anon` key and `service_role` key.
3. **Vercel** → Import this repo → add the environment variables from [`.env.example`](.env.example):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PASSWORD`, `SESSION_SECRET` (long random string) and `NEXT_PUBLIC_SITE_URL` (your `https://….vercel.app`, used in the QR).
4. Deploy, open `/host`, log in, **Create game**. Project the lobby: it shows the QR and the code.

`SUPABASE_SERVICE_ROLE_KEY` is only used on the server. All tables have RLS enabled with no policies, so browsers can't read or write them.

## How it works

- Phases: `lobby → question → answering → reveal → (leaderboard every 2 questions) → … → podium`.
- The **server** owns the clock and scoring. Correct answers live in `src/data/questions.ts` (server-only) and are sent to phones only at the reveal.
- Points: `round(1000 × (1 − elapsed/limit / 2))` (1000 → 500) plus a streak bonus (+100 per consecutive correct answer, max +500). Ties: more correct answers, then less total time.
- Live updates: the server publishes a Supabase Realtime *broadcast* on every change; clients refetch. Clients also poll every 1.5–3 s as a safety net.
- Host keys: `Space` = next step, `F` = fullscreen. The host screen reveals automatically when time is up or everyone answered.

## Editing the questions

Edit [`src/data/questions.ts`](src/data/questions.ts): `type` is `"multiple"` (4 options) or `"truefalse"` (`["True", "False"]`), `correct` is the option index.

## Troubleshooting

- *A player closed the tab and can't rejoin with the same name:* remove them from the lobby (hover → ×) or ask them to use another name.
- *Join blocked ("already in progress"):* players can join in the lobby and during question 1. Use **Restart** to open a new round.
