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
import { Check, ChevronRight, Edit, GripVertical, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Category,
  useReorderCategories,
  useUpdateCategory,
} from "@/features/dashboard/api/categories";

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  isArchived?: boolean;
}

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
  isArchived?: boolean;
}

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
  isArchived = false,
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

  if (isArchived) {
    return (
      <TableRow>
        <TableCell className="w-48 font-medium text-muted-foreground">
          {category.name}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {category.description || "Sin descripción"}
        </TableCell>
        <TableCell className="w-24 text-center">
          <Badge variant={category.isIncome ? "default" : "secondary"}>
            {category.isIncome ? "Ingreso" : "Gasto"}
          </Badge>
        </TableCell>
        <TableCell className="text-center text-muted-foreground">
          {category.archivedOn
            ? new Date(category.archivedOn).toLocaleDateString()
            : "N/A"}
        </TableCell>
        <TableCell className="text-right">
          <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <TableCell className="w-48 font-medium">
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
      <TableCell className="text-center">
        {category.description || "Sin descripción"}
      </TableCell>
      <TableCell className="w-24 text-center">
        <Badge variant={category.isIncome ? "default" : "secondary"}>
          {category.isIncome ? "Ingreso" : "Gasto"}
        </Badge>
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

export function CategoryTable({
  categories,
  onEdit,
  isArchived = false,
}: CategoryTableProps) {
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const updateCategoryMutation = useUpdateCategory();
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
    if (isArchived) return;

    const { active, over } = event;

    if (active.id !== over?.id) {
      try {
        const oldIndex = categories.findIndex((cat) => cat.id === active.id);
        const newIndex = categories.findIndex((cat) => cat.id === over?.id);

        const newCategories = arrayMove(categories, oldIndex, newIndex);

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

    const originalCategory = categories.find(
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

  if (isArchived) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-24 text-center">Tipo</TableHead>
            <TableHead className="text-center">Archivada</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <SortableTableRow
              key={category.id}
              category={category}
              onEdit={onEdit}
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
              isArchived={true}
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Nombre</TableHead>
            <TableHead className="text-center">Descripción</TableHead>
            <TableHead className="w-24 text-center">Tipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext
            items={categories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category) => (
              <SortableTableRow
                key={category.id}
                category={category}
                onEdit={onEdit}
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
  );
}
