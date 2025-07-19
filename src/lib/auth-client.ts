import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

// import { clientEnv } from "@/env";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
  credentials: "include",
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});

export const { signIn, signUp, useSession, getSession } = authClient;
