import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategorySheet } from "@/features/dashboard/components/CategorySheet";
import { CategoryTable } from "@/features/dashboard/components/CategoryTable";
import { useCategoryManagement } from "@/features/dashboard/hooks/useCategoryManagement";

export const Route = createFileRoute("/config/categorias")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    isSheetOpen,
    editingCategory,
    formData,
    activeCategories,
    archivedCategories,
    isLoadingActive,
    setIsSheetOpen,
    setFormData,
    handleCreateCategory,
    handleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleArchiveCategory,
  } = useCategoryManagement();

  if (isLoadingActive) {
    return (
      <DashboardLayout title="Categorías">
        <div className="space-y-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Categorías">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl">Gestión de Categorías</h2>
            <p className="text-muted-foreground">
              Administra las categorías para tus transacciones financieras
            </p>
          </div>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>

        {/* Active Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías Activas</CardTitle>
            <CardDescription>
              Categorías que puedes usar en tus transacciones y presupuestos.
              Arrastra para reordenar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCategories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  No tienes categorías configuradas
                </p>
                <Button onClick={handleCreateCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Categoría
                </Button>
              </div>
            ) : (
              <CategoryTable
                categories={activeCategories}
                onEdit={handleEditCategory}
              />
            )}
          </CardContent>
        </Card>

        {/* Archived Categories */}
        {archivedCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Categorías Archivadas</CardTitle>
              <CardDescription>
                Categorías que han sido archivadas y no se usan activamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryTable
                categories={archivedCategories}
                onEdit={handleEditCategory}
                isArchived={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Category Sheet */}
        <CategorySheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          editingCategory={editingCategory}
          formData={formData}
          onFormDataChange={setFormData}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onArchive={handleArchiveCategory}
          isSaving={false}
        />
      </div>
    </DashboardLayout>
  );
}
