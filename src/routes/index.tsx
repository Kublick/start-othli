import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Check if user is authenticated by verifying session
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        throw redirect({ to: "/dashboard/overview" });
      }
    } catch (error) {
      console.log(error);
      // If session check fails, continue to index page
    }
  },
  component: App,
});

function App() {
  return <div className="text-center">Cooking something</div>;
}
