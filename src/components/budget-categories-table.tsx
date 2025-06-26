import {
  DollarSign,
  Edit,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/client";

interface Category {
  id: number;
  name: string;
  description: string | null;
  isIncome: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
  archived: boolean;
  archivedOn: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  isGroup: boolean;
  groupId: number | null;
  order: number;
  groupCategoryName: string | null;
  userId: string;
}

interface BudgetCategory {
  id: string;
  categoryId: number;
  categoryName: string;
  plannedAmount: string;
  spentAmount: string;
  remainingAmount: string;
  percentageUsed: number;
}

interface Budget {
  id: string;
  name: string;
  type: "personal" | "shared";
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface BudgetCategoriesTableProps {
  budgetId?: string;
  budgetType?: "personal" | "shared";
  onBudgetChange?: (budget: Budget) => void;
}

export function BudgetCategoriesTable({
  budgetId,
  budgetType = "personal",
  onBudgetChange,
}: BudgetCategoriesTableProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesResponse = await client.api.categories.$get();
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar las categorías");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetSelect = (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setSelectedBudget(budget);
      onBudgetChange?.(budget);
    }
  };

  const handleAddCategory = () => {
    if (!selectedBudget) {
      toast.error("Selecciona un presupuesto primero");
      return;
    }
    toast.info("Funcionalidad de agregar categoría en desarrollo");
  };

  const handleEditCategory = (category: BudgetCategory) => {
    toast.info("Funcionalidad de editar categoría en desarrollo");
  };

  const handleDeleteCategory = async (categoryId: string) => {
    toast.info("Funcionalidad de eliminar categoría en desarrollo");
  };

  const getStatusColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return "destructive";
    if (percentageUsed >= 80) return "secondary";
    return "default";
  };

  const getStatusIcon = (percentageUsed: number) => {
    if (percentageUsed >= 100) return <TrendingDown className="h-4 w-4" />;
    if (percentageUsed >= 80) return <TrendingUp className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando categorías del presupuesto...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Presupuesto {budgetType === "personal" ? "Personal" : "Compartido"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="budget-select">Seleccionar Presupuesto</Label>
              <Select
                value={selectedBudget?.id || ""}
                onValueChange={handleBudgetSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.name} - {budget.currency} {budget.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddCategory} disabled={!selectedBudget}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories Table */}
      {selectedBudget && (
        <Card>
          <CardHeader>
            <CardTitle>Categorías del Presupuesto</CardTitle>
            <p className="text-muted-foreground text-sm">
              Presupuesto: {selectedBudget.name} - {selectedBudget.currency}{" "}
              {selectedBudget.amount}
            </p>
          </CardHeader>
          <CardContent>
            {budgetCategories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  No hay categorías configuradas en este presupuesto
                </p>
                <Button onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Categoría
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Presupuestado</TableHead>
                    <TableHead className="text-right">Gastado</TableHead>
                    <TableHead className="text-right">Restante</TableHead>
                    <TableHead className="text-center">Progreso</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.categoryName}
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedBudget.currency} {category.plannedAmount}
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedBudget.currency} {category.spentAmount}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            category.remainingAmount.startsWith("-")
                              ? "text-destructive"
                              : ""
                          }
                        >
                          {selectedBudget.currency} {category.remainingAmount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={category.percentageUsed}
                            className="flex-1"
                          />
                          <span className="text-muted-foreground text-xs">
                            {category.percentageUsed.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusColor(category.percentageUsed)}
                        >
                          {getStatusIcon(category.percentageUsed)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
