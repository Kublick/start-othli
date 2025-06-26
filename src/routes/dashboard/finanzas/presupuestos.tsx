import { createFileRoute } from "@tanstack/react-router";
import { BudgetCategoriesTable } from "@/components/budget-categories-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/finanzas/presupuestos")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardLayout title="Presupuestos">
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-bold text-2xl">Gestión de Presupuestos</h2>
          <p className="text-muted-foreground">
            Administra tus presupuestos personales y compartidos, y configura
            las categorías para cada uno.
          </p>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Presupuestos Personales</TabsTrigger>
            <TabsTrigger value="shared">Presupuestos Compartidos</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <BudgetCategoriesTable budgetType="personal" />
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            <BudgetCategoriesTable budgetType="shared" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
