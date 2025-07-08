import type React from "react";
import { useState } from "react";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";
import { cn } from "@/lib/utils";

const EditableAmount = ({
  transaction,
  onUpdate,
}: {
  transaction: Transaction;
  onUpdate: (data: UpdateTransactionData) => void;
}) => {
  const [value, setValue] = useState(transaction.amount);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== transaction.amount) {
      onUpdate({
        ...transaction,
        amount: value,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
        description: transaction.description ?? undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setValue(transaction.amount);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          aria-label={
            Number(value) < 0 ? "Cambiar a positivo" : "Cambiar a negativo"
          }
          className={cn(
            "-translate-y-1/2 absolute top-1/2 left-1 z-10 flex h-6 w-6 items-center justify-center rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400",
            Number(value) < 0 ? "bg-red-600" : "bg-green-600",
          )}
          tabIndex={0}
          onClick={() => {
            if (!Number.isNaN(Number(value)) && value !== "") {
              const newValue = String(Number(value) * -1);
              setValue(newValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!Number.isNaN(Number(value)) && value !== "") {
                const newValue = String(Number(value) * -1);
                setValue(newValue);
              }
            }
          }}
        >
          {Number(value) < 0 ? "-" : "+"}
        </button>
        <input
          className="w-full rounded border py-1 pr-2 pl-8 text-right text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded p-1 text-right hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {Number(value).toLocaleString("es-MX", {
        style: "currency",
        currency: transaction.currency || "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </button>
  );
};

export default EditableAmount;
