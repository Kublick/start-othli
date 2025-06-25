import { createFileRoute } from "@tanstack/react-router";

import { client } from "@/lib/client";
import DashboardLayout from "../../components/layout/dashboard-layout";

export const Route = createFileRoute("/config/categorias")({
  component: RouteComponent,
  loader: async () => {
    const response = await client.api.categories.$get();
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    return response.json();
  },
});

function RouteComponent() {
  return (
    <DashboardLayout title="Categorías">
      <div className="rounded-lg border bg-card p-8">
        <h2 className="mb-4 font-bold text-2xl">Gestión de Categorías</h2>
        <p className="text-muted-foreground">
          Aquí podrás gestionar las categorías para tus transacciones
          financieras.
        </p>
      </div>
    </DashboardLayout>
  );
}
