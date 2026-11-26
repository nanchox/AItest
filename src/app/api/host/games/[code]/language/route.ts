import { hostState, HttpError, loadGame, setLanguage } from "@/lib/game";
import { isLang } from "@/lib/i18n";
import { handle, json, readJson, requireHost, type Ctx } from "@/lib/api";

export const POST = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const { lang } = await readJson(req);
  if (!isLang(lang)) throw new HttpError(400, "bad_lang");
  const game = await setLanguage(await loadGame((await params).code), lang);
  return json(await hostState(game));
});
