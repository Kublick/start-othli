import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUserID } from "@/lib/auth-server-func";
import DashboardLayout from "../../components/layout/dashboard-layout";

export const Route = createFileRoute("/dashboard/overview")({
  beforeLoad: async () => {
    const userID = await getUserID();
    return { userID };
  },
  loader: async ({ context }) => {
    if (!context.userID) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardLayout title="Resumen">
      <div className="rounded-lg border bg-card p-8">
        <h2 className="mb-4 font-bold text-2xl">Bienvenido a Ometomi</h2>
        <p className="text-muted-foreground">
          Tu dashboard de finanzas personales. Aquí podrás ver un resumen de tu
          situación financiera.
        </p>
      </div>
    </DashboardLayout>
  );
}
