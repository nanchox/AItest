"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "@/components/ui/LangToggle";
import { api, errMsg, useDocumentLang, useUiLang } from "@/lib/client";
import { isValidCode, normalizeCode } from "@/lib/code";
import { makeT } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useUiLang();
  const t = useMemo(() => makeT(lang), [lang]);
  useDocumentLang(lang);
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
    if (!isValidCode(c)) return setError(t("home.codeLen"));
    setBusy(true);
    setError("");
    try {
      await api(`/api/game/${c}/state`);
      router.push(`/play/${c}`);
    } catch (err) {
      setError(errMsg(t, err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 py-10">
      <LangToggle lang={lang} onChange={setLang} className="absolute right-4 top-4" />
      <div className="animate-float text-7xl" aria-hidden>🧠</div>
      <Brand />
      <form onSubmit={submit} className="w-full animate-rise space-y-4">
        <label htmlFor="code" className="block text-center text-lg font-bold text-brand-200">{t("home.enterCode")}</label>
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
          {busy ? t("home.checking") : t("home.enter")}
        </Button>
      </form>
    </main>
  );
}
