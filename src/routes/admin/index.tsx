import { createFileRoute, redirect } from "@tanstack/react-router";
import { getIsAdmin } from "@/lib/auth-server-func";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const isAdmin = await getIsAdmin();
    return { isAdmin };
  },
  loader: async ({ context }) => {
    if (!context.isAdmin) {
      throw redirect({ to: "/dashboard/overview" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/admin/"!</div>;
}
