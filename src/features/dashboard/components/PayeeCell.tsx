import type { UseMutationResult } from "@tanstack/react-query";

import type { Payee } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const PayeeCell = ({
  transaction,
  payees,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  refetchPayees: () => Promise<{ data?: Payee[] }>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) => {
  const handleChange = async (newValue: string) => {
    if (newValue === transaction.payeeId?.toString()) return;
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
        payeeId: newValue ? Number.parseInt(newValue, 10) : undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating payee:", error);
    }
  };

  return (
    <select
      className="w-full rounded border px-2 py-1 text-sm"
      value={transaction.payeeId?.toString() || ""}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="">Sin beneficiario</option>
      {payees.map((payee) => (
        <option key={payee.id} value={payee.id}>
          {payee.name}
        </option>
      ))}
    </select>
  );
};

export default PayeeCell;
