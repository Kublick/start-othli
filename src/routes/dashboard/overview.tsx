import { createFileRoute, redirect } from "@tanstack/react-router";
import { SetupWizard } from "@/components/setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSummary } from "@/features/dashboard/api/summary";
import { OverviewDashboard } from "@/features/dashboard/components/OverviewDashboard";
import { useSession } from "@/hooks/use-session";
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

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function RouteComponent() {
  const { isComplete, isLoading } = useSetupStatus();
  const { start, end } = getCurrentMonthRange();
  const {
    data,
    isLoading: isSummaryLoading,
    error,
  } = useSummary({ start, end });
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuario";

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
      {isSummaryLoading ? (
        <div className="rounded-lg border bg-card p-8">
          <Skeleton className="mb-4 h-8 w-1/2" />
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-card p-8 text-red-600">
          Error al cargar el resumen financiero.
        </div>
      ) : data ? (
        <OverviewDashboard userName={userName} />
      ) : null}
    </DashboardLayout>
  );
}
