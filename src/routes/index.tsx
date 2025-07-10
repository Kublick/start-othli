import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        throw redirect({ to: "/dashboard/overview" });
      }
    } catch (error) {
      console.log(error);
    }
    throw redirect({ to: "/auth/login" });
  },
  component: App,
});

function App() {
  return <div className="text-center">Cooking something</div>;
}
