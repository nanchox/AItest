import { NextResponse } from "next/server";
import { HOST_COOKIE } from "@/lib/auth";
import { handle, noStore } from "@/lib/api";

export const POST = handle(async () => {
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(HOST_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
