import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { hc } from "hono/client";
// import { clientEnv } from "@/env";
import type { AppType } from "@/server";

export const getRequestHeaders = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const headers = new Headers(request?.headers);

    return Object.fromEntries(headers);
  },
);

export const client = hc<AppType>(import.meta.env.VITE_BETTER_AUTH_URL, {
  fetch: (async (input, init) => {
    const heeaderObj = await getRequestHeaders();

    return fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        Cookie: heeaderObj.cookie,
      },
    });
  }) satisfies typeof fetch,
});
