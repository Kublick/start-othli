import { useState } from "react";
import { toast } from "sonner";
import type {
  Category,
  CategoryFormData,
} from "@/features/dashboard/api/categories";
import {
  useActiveCategories,
  useArchiveCategory,
  useArchivedCategories,
  useCreateCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/dashboard/api/categories";

export function useCategoryManagement() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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

  return {
    // State
    isSheetOpen,
    editingCategory,
    formData,
    activeCategories,
    archivedCategories,
    isLoadingActive,

    // Mutations
    createCategoriesMutation,
    updateCategoryMutation,
    archiveCategoryMutation,
    deleteCategoryMutation,

    // Actions
    setIsSheetOpen,
    setFormData,
    handleCreateCategory,
    handleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleArchiveCategory,
  };
}
