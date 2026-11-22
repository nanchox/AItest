"use client";
import { useParams } from "next/navigation";
import { HostApp } from "@/components/host/HostApp";
import { normalizeCode } from "@/lib/code";

export default function HostGamePage() {
  const params = useParams<{ code: string }>();
  return <HostApp code={normalizeCode(params.code ?? "")} />;
}
