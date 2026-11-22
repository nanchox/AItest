import { exportCsv, loadGame } from "@/lib/game";
import { handle, requireHost, type Ctx } from "@/lib/api";

export const GET = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const game = await loadGame((await params).code);
  const url = new URL(req.url);
  const r = Number(url.searchParams.get("round"));
  const round = Number.isInteger(r) && r >= 1 && r <= game.round ? r : game.round;
  const kind = url.searchParams.get("kind") === "summary" ? "summary" : "results";
  const { filename, body } = await exportCsv(game, round, kind);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
