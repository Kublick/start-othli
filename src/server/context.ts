import type { Env } from "hono";
import type { auth } from "./auth";

export type Context = Env & {
  user: (typeof auth.$Infer)["Session"]["user"] | null;
  session: (typeof auth.$Infer)["Session"] | null;
};
