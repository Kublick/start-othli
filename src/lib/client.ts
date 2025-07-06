import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { hc } from "hono/client";
import type { AppType } from "@/server";

const apiURL = import.meta.env.VITE_BETTER_AUTH_URL;

const serverFetcher: typeof fetch = async (input, init) => {
  const request = getWebRequest();
  const headers = new Headers(request?.headers);

  return fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      Cookie: headers.get("cookie") || "",
      ...Object.fromEntries(headers),
      ...init?.headers,
    },
  });
};

const clientFetcher: typeof fetch = async (input, init) => {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
};

// Create isomorphic client using createIsomorphicFn pattern
const getClient = createIsomorphicFn()
  .client(() =>
    hc<AppType>(apiURL, {
      fetch: clientFetcher,
    }),
  )
  .server(() =>
    hc<AppType>(apiURL, {
      fetch: serverFetcher,
    }),
  );

export const client = getClient();
