"use client";
import { useParams } from "next/navigation";
import { PlayerApp } from "@/components/player/PlayerApp";
import { normalizeCode } from "@/lib/code";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  return <PlayerApp code={normalizeCode(params.code ?? "")} />;
}
