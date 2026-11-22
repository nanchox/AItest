import { NextResponse } from "next/server";
import { checkPassword, makeSessionCookie } from "@/lib/auth";
import { handle, noStore, readJson } from "@/lib/api";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  if (!checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401, headers: noStore });
  }
  const c = makeSessionCookie();
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(c.name, c.value, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: c.maxAge,
  });
  return res;
});
