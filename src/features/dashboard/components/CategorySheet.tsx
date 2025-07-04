import { AlertTriangle, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  Category,
  CategoryFormData,
} from "@/features/dashboard/api/categories";

interface CategorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  formData: CategoryFormData;
  onFormDataChange: (data: CategoryFormData) => void;
  onSave: () => void;
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  isSaving: boolean;
}

export function CategorySheet({
  isOpen,
  onOpenChange,
  editingCategory,
  formData,
  onFormDataChange,
  onSave,
  onDelete,
  onArchive,
  isSaving,
}: CategorySheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
          </SheetTitle>
          <SheetDescription>
            {editingCategory
              ? "Modifica los detalles de la categoría"
              : "Crea una nueva categoría para tus transacciones"}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 px-4 py-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Comida, Transporte, Entretenimiento"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              placeholder="Descripción opcional de la categoría"
              rows={3}
            />
          </div>
          <Separator />
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isIncome"
                checked={formData.isIncome}
                onCheckedChange={(checked) =>
                  onFormDataChange({
                    ...formData,
                    isIncome: checked as boolean,
                  })
                }
              />
              <Label htmlFor="isIncome">Es una categoría de ingreso</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeFromBudget"
                checked={formData.excludeFromBudget}
                onCheckedChange={(checked) =>
                  onFormDataChange({
                    ...formData,
                    excludeFromBudget: checked as boolean,
                  })
                }
              />
              <Label htmlFor="excludeFromBudget">Excluir de presupuestos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeFromTotals"
                checked={formData.excludeFromTotals}
                onCheckedChange={(checked) =>
                  onFormDataChange({
                    ...formData,
                    excludeFromTotals: checked as boolean,
                  })
                }
              />
              <Label htmlFor="excludeFromTotals">Excluir de totales</Label>
            </div>
          </div>

          {/* Danger Zone for editing existing categories */}
          {editingCategory && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <h4 className="font-medium">Zona de Peligro</h4>
                </div>
                <div className="space-y-3">
                  {editingCategory.archived ? (
                    <Button
                      variant="outline"
                      onClick={() => onArchive(false)}
                      className="w-full justify-start"
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Restaurar Categoría
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => onArchive(true)}
                      className="w-full justify-start"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archivar Categoría
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={onDelete}
                    className="w-full justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Categoría
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {editingCategory ? "Actualizar" : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
