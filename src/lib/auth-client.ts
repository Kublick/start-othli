import { createAuthClient } from "better-auth/react";
// import { clientEnv } from "@/env";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
  credentials: "include",
});

export const { signIn, signUp, useSession } = authClient;
