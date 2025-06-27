import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Category } from "@/features/dashboard/api/categories";
import type { Transaction } from "@/features/dashboard/api/transactions";

interface Props {
  id: string;
  transactions: Transaction[];
  category: Category | null;
}

const TransactionsDialog = ({ transactions, category }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Search className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Transacciones - {category?.name || "Categoría"}
          </DialogTitle>
          <DialogDescription>
            {transactions.length} transacciones encontradas
          </DialogDescription>
        </DialogHeader>

        {open && <TransactionsTableContent transactions={transactions} />}

        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button type="button" variant="default">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function TransactionsTableContent({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return "MX$0.00";
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-h-[60vh] overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left font-medium">Fecha</th>
            <th className="p-3 text-left font-medium">Descripción</th>
            <th className="p-3 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                No hay transacciones para mostrar
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b">
                <td className="p-3">{formatDate(transaction.date)}</td>
                <td className="p-3">
                  {transaction.description || "Sin descripción"}
                </td>
                <td className="p-3 text-right">
                  {formatCurrency(Number.parseFloat(transaction.amount))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionsDialog;
