import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Context } from "../context";

export const loggedIn = createMiddleware<{ Variables: Context }>(
  async (c, next) => {
    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session) {
      throw new HTTPException(401, { message: "Usuario no autorizado" });
    }

    await next();
  },
);
