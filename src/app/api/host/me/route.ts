import { isHostRequest } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const GET = handle(async (req: Request) => json({ host: isHostRequest(req) }));
