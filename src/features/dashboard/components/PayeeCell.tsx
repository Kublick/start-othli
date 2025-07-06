import type { UseMutationResult } from "@tanstack/react-query";

import { PayeeCombobox } from "@/components/ui/payee-combobox";
import type { Payee } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const PayeeCell = ({
  transaction,
  payees,
  createPayee,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  payees: Payee[];
  createPayee: (name: string) => Promise<number | undefined>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) => {
  const handleChange = async (payeeId: number | undefined) => {
    if (payeeId === transaction.payeeId) return;
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
        categoryId: transaction.categoryId ?? undefined,
        payeeId,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating payee:", error);
    }
  };

  const handleCreatePayee = async (
    name: string,
  ): Promise<number | undefined> => {
    try {
      const createdPayeeId = await createPayee(name);
      return createdPayeeId;
    } catch (error) {
      console.error("Error creating payee:", error);
      return undefined;
    }
  };

  return (
    <PayeeCombobox
      value={transaction.payeeId ?? undefined}
      payees={payees}
      onChange={handleChange}
      onCreatePayee={handleCreatePayee}
      placeholder="Sin beneficiario"
      className="w-full"
    />
  );
};

export default PayeeCell;
