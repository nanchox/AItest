"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client";
import { isValidCode, normalizeCode } from "@/lib/code";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The QR code opens /?code=XXXXX: skip straight to the join screen.
  useEffect(() => {
    const c = normalizeCode(new URLSearchParams(window.location.search).get("code") ?? "");
    if (isValidCode(c)) router.replace(`/play/${c}`);
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!isValidCode(c)) return setError("The code has 5 letters or numbers.");
    setBusy(true);
    setError("");
    try {
      await api(`/api/game/${c}/state`);
      router.push(`/play/${c}`);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "We can't find that game. Check the code." : "Connection problem. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="animate-float text-7xl" aria-hidden>🧠</div>
      <Brand />
      <form onSubmit={submit} className="w-full animate-rise space-y-4">
        <label htmlFor="code" className="block text-center text-lg font-bold text-brand-200">Enter the game code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="K7P2X"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={5}
          className="w-full rounded-2xl bg-white px-4 py-5 text-center text-4xl font-black uppercase tracking-[0.35em] text-brand-900 placeholder:text-brand-200 focus:outline-none focus:ring-4 focus:ring-brand-200"
        />
        {error && <p role="alert" className="text-center font-semibold text-amber-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.length < 5}>
          {busy ? "Checking…" : "Enter"}
        </Button>
      </form>
    </main>
  );
}
