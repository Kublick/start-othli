import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUserID } from "@/lib/auth-server-func";

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: async () => {
    const userID = await getUserID();
    return { userID };
  },
  loader: async ({ context }) => {
    if (context.userID) {
      throw redirect({ to: "/dashboard/overview" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/auth/signup"!</div>;
}
