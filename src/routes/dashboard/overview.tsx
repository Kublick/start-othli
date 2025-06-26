import { createFileRoute, redirect } from "@tanstack/react-router";
import { SetupWizard } from "@/components/setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetupStatus } from "@/hooks/use-setup-status";
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
  const { isComplete, isLoading } = useSetupStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <div className="mx-auto w-full max-w-2xl space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return <SetupWizard />;
  }

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
