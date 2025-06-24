import type { Session, User } from "better-auth";
import type { Env } from "hono";

export type Context = Env & {
  user: User | null;
  session: Session | null;
};
