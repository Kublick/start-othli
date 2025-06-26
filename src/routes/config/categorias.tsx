import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  ChevronRight,
  Edit,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type Category,
  type CategoryFormData,
  useActiveCategories,
  useArchiveCategory,
  useArchivedCategories,
  useCreateCategories,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from "@/features/dashboard/api/categories";

interface SortableTableRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onInlineEditStart: (category: Category) => void;
  inlineEditingId: number | null;
  inlineEditValue: string;
  setInlineEditValue: (value: string) => void;
  handleInlineEditSave: () => void;
  handleInlineEditCancel: () => void;
  handleInlineEditKeyDown: (e: React.KeyboardEvent) => void;
  isInlineSaving: boolean;
  inlineInputRef: React.RefObject<HTMLInputElement | null>;
  isReordering: boolean;
}

// Sortable table row component
function SortableTableRow({
  category,
  onEdit,
  onInlineEditStart,
  inlineEditingId,
  inlineEditValue,
  setInlineEditValue,
  handleInlineEditSave,
  handleInlineEditCancel,
  handleInlineEditKeyDown,
  isInlineSaving,
  inlineInputRef,
  isReordering,
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <TableCell className="font-medium">
        {inlineEditingId === category.id ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inlineInputRef}
              value={inlineEditValue}
              onChange={(e) => setInlineEditValue(e.target.value)}
              onKeyDown={handleInlineEditKeyDown}
              onBlur={handleInlineEditSave}
              className="h-8 text-sm"
              disabled={isInlineSaving || isReordering}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInlineEditSave}
              disabled={isInlineSaving || isReordering}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInlineEditCancel}
              disabled={isInlineSaving || isReordering}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="-mx-2 w-full cursor-pointer rounded px-2 py-1 text-left font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onInlineEditStart(category)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onInlineEditStart(category);
              }
            }}
            title="Haz clic para editar"
            disabled={isReordering}
          >
            {category.name}
          </button>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {category.description || "Sin descripción"}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant={category.isIncome ? "default" : "secondary"}>
            {category.isIncome ? "Ingreso" : "Gasto"}
          </Badge>
          {category.excludeFromBudget && (
            <Badge variant="outline">Sin Presupuesto</Badge>
          )}
          {category.excludeFromTotals && (
            <Badge variant="outline">Sin Totales</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {category.excludeFromBudget && (
            <Badge variant="outline" className="text-xs">
              Sin Presupuesto
            </Badge>
          )}
          {category.excludeFromTotals && (
            <Badge variant="outline" className="text-xs">
              Sin Totales
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="cursor-grab rounded p-1 hover:bg-muted/50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
            {...attributes}
            {...listeners}
            disabled={isReordering}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            disabled={isReordering}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const Route = createFileRoute("/config/categorias")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    isIncome: false,
    excludeFromBudget: false,
    excludeFromTotals: false,
  });

  // React Query hooks
  const { data: activeCategories = [], isLoading: isLoadingActive } =
    useActiveCategories();
  const { data: archivedCategories = [] } = useArchivedCategories();
  const createCategoriesMutation = useCreateCategories();
  const updateCategoryMutation = useUpdateCategory();
  const archiveCategoryMutation = useArchiveCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const reorderCategoriesMutation = useReorderCategories();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Focus the inline input when editing starts
  useEffect(() => {
    if (inlineEditingId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditingId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      try {
        const oldIndex = activeCategories.findIndex(
          (cat) => cat.id === active.id,
        );
        const newIndex = activeCategories.findIndex(
          (cat) => cat.id === over?.id,
        );

        const newCategories = arrayMove(activeCategories, oldIndex, newIndex);

        // Update all categories with new sequential order values
        const updates = newCategories.map((category, index) => ({
          id: category.id,
          name: category.name,
          description: category.description || "",
          isIncome: category.isIncome,
          excludeFromBudget: category.excludeFromBudget,
          excludeFromTotals: category.excludeFromTotals,
          order: index,
        }));

        await reorderCategoriesMutation.mutateAsync({ updates });
      } catch (error) {
        console.error("Error updating category order:", error);
        // Error handling is done in the mutation
      }
    }
  };

  const handleInlineEditStart = (category: Category) => {
    setInlineEditingId(category.id);
    setInlineEditValue(category.name);
  };

  const handleInlineEditSave = async () => {
    if (!inlineEditingId || !inlineEditValue.trim()) {
      setInlineEditingId(null);
      return;
    }

    const originalCategory = activeCategories.find(
      (cat) => cat.id === inlineEditingId,
    );
    if (!originalCategory || originalCategory.name === inlineEditValue.trim()) {
      setInlineEditingId(null);
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: inlineEditingId,
        name: inlineEditValue.trim(),
        description: originalCategory.description || "",
        isIncome: originalCategory.isIncome,
        excludeFromBudget: originalCategory.excludeFromBudget,
        excludeFromTotals: originalCategory.excludeFromTotals,
        order: originalCategory.order,
      });
      setInlineEditingId(null);
    } catch (error) {
      console.error("Error updating category:", error);
      // Error handling is done in the mutation
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEditingId(null);
    setInlineEditValue("");
  };

  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInlineEditSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleInlineEditCancel();
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      isIncome: false,
      excludeFromBudget: false,
      excludeFromTotals: false,
    });
    setIsSheetOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      isIncome: category.isIncome,
      excludeFromBudget: category.excludeFromBudget,
      excludeFromTotals: category.excludeFromTotals,
    });
    setIsSheetOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          ...formData,
          order: editingCategory.order,
        });
      } else {
        // Create new category
        await createCategoriesMutation.mutateAsync({
          categories: [formData],
        });
      }

      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      // Error handling is done in the mutation
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;

    try {
      await deleteCategoryMutation.mutateAsync({ id: editingCategory.id });
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      // Error handling is done in the mutation
    }
  };

  const handleArchiveCategory = async (archive: boolean) => {
    if (!editingCategory) return;

    try {
      const now = new Date();

      await archiveCategoryMutation.mutateAsync({
        id: editingCategory.id,
        archived: archive,
        archivedOn: archive ? now.toISOString() : null,
      });
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      // Error handling is done in the mutation
    }
  };

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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Opciones</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={activeCategories.map((cat) => cat.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {activeCategories.map((category) => (
                        <SortableTableRow
                          key={category.id}
                          category={category}
                          onEdit={handleEditCategory}
                          onInlineEditStart={handleInlineEditStart}
                          inlineEditingId={inlineEditingId}
                          inlineEditValue={inlineEditValue}
                          setInlineEditValue={setInlineEditValue}
                          handleInlineEditSave={handleInlineEditSave}
                          handleInlineEditCancel={handleInlineEditCancel}
                          handleInlineEditKeyDown={handleInlineEditKeyDown}
                          isInlineSaving={updateCategoryMutation.isPending}
                          inlineInputRef={inlineInputRef}
                          isReordering={reorderCategoriesMutation.isPending}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
                {reorderCategoriesMutation.isPending && (
                  <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-primary border-b-2" />
                    Actualizando orden...
                  </div>
                )}
              </DndContext>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Archivada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "Sin descripción"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={category.isIncome ? "default" : "secondary"}
                        >
                          {category.isIncome ? "Ingreso" : "Gasto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {category.archivedOn
                          ? new Date(category.archivedOn).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Category Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                    setFormData({ ...formData, name: e.target.value })
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
                    setFormData({ ...formData, description: e.target.value })
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
                      setFormData({ ...formData, isIncome: checked as boolean })
                    }
                  />
                  <Label htmlFor="isIncome">Es una categoría de ingreso</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeFromBudget"
                    checked={formData.excludeFromBudget}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        excludeFromBudget: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="excludeFromBudget">
                    Excluir de presupuestos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeFromTotals"
                    checked={formData.excludeFromTotals}
                    onCheckedChange={(checked) =>
                      setFormData({
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
                          onClick={() => handleArchiveCategory(false)}
                          className="w-full justify-start"
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Restaurar Categoría
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleArchiveCategory(true)}
                          className="w-full justify-start"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archivar Categoría
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={handleDeleteCategory}
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
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? "Actualizar" : "Crear"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
