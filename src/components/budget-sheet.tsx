import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUpdateBudget } from "@/features/dashboard/api/budgets";
import { useActiveCategories } from "@/features/dashboard/api/categories";

interface BudgetSheetProps {
  trigger?: React.ReactNode;
  categoryId?: number;
  initialAmount?: number;
  onSuccess?: () => void;
}

export function BudgetSheet({
  trigger,
  categoryId,
  initialAmount = 0,
  onSuccess,
}: BudgetSheetProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(initialAmount.toString());
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(categoryId);

  const { data: categories = [] } = useActiveCategories();
  const updateBudgetMutation = useUpdateBudget();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount < 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    try {
      await updateBudgetMutation.mutateAsync({
        categoryId: selectedCategoryId,
        amount: numAmount,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setAmount(cleanValue);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button variant="outline">Agregar Presupuesto</Button>}
      </SheetTrigger>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Configurar Presupuesto</SheetTitle>
          <SheetDescription>
            Establece el monto presupuestado para esta categoría.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={selectedCategoryId?.toString()}
                onValueChange={(value) => setSelectedCategoryId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Presupuestado (MXN)</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="text-right"
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateBudgetMutation.isPending}>
              {updateBudgetMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
