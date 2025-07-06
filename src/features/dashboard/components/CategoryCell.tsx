import type { UseMutationResult } from "@tanstack/react-query";

import { CategoryCombobox } from "@/components/ui/category-combobox";
import type { Category } from "@/features/dashboard/api/categories";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const CategoryCell = ({
  transaction,
  categories,
  createCategory,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  categories: Category[];
  createCategory: (name: string) => Promise<number | undefined>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) => {
  const handleChange = async (categoryId: number | undefined) => {
    if (categoryId === transaction.categoryId) return;
    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        currency: transaction.currency,
        date: transaction.date,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleCreateCategory = async (
    name: string,
  ): Promise<number | undefined> => {
    try {
      const createdCategoryId = await createCategory(name);
      return createdCategoryId;
    } catch (error) {
      console.error("Error creating category:", error);
      return undefined;
    }
  };

  return (
    <CategoryCombobox
      value={transaction.categoryId ?? undefined}
      categories={categories}
      onChange={handleChange}
      onCreateCategory={handleCreateCategory}
      placeholder="Sin categoría"
      className="w-full"
    />
  );
};

export default CategoryCell;
