import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

const getRequestHeaders = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const headers = new Headers(request?.headers);

    return Object.fromEntries(headers);
  },
);

export const headers = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getRequestHeaders());
