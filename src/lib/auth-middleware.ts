import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { getSession } from "./auth-client";

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { data: session } = await getSession({
      fetchOptions: {
        headers: getHeaders() as HeadersInit,
      },
    });

    console.log("🚀 ~ session:", session);
    return await next({
      context: {
        user: {
          id: session?.user?.id,
          name: session?.user?.name,
          image: session?.user?.image,
        },
        session: session,
      },
    });
  },
);
