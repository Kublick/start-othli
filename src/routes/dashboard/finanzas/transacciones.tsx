import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/dashboard/finanzas/transacciones")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardLayout title="Transacciones">
      <div className="rounded-lg border bg-card p-8">
        <h2 className="mb-4 font-bold text-2xl">Transacciones</h2>
        <p className="text-muted-foreground">
          Lleva el control de tus transacciones financieras.
        </p>
      </div>
    </DashboardLayout>
  );
}
