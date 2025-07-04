import { Clock, Edit, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import {
  formatAmount,
  formatDateTime,
  useTransactionHistory,
} from "@/features/dashboard/api/transactions";

interface TransactionHistoryProps {
  transactionId: string;
  transactionDescription: string;
  accounts?: Account[];
  categories?: Category[];
  payees?: Payee[];
}

const getActionIcon = (action: "created" | "updated" | "deleted") => {
  switch (action) {
    case "created":
      return <Plus className="h-4 w-4 text-green-600" />;
    case "updated":
      return <Edit className="h-4 w-4 text-blue-600" />;
    case "deleted":
      return <Trash2 className="h-4 w-4 text-red-600" />;
  }
};

const getActionLabel = (action: "created" | "updated" | "deleted") => {
  switch (action) {
    case "created":
      return "Creada";
    case "updated":
      return "Actualizada";
    case "deleted":
      return "Eliminada";
  }
};

const getActionColor = (action: "created" | "updated" | "deleted") => {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-800";
    case "updated":
      return "bg-blue-100 text-blue-800";
    case "deleted":
      return "bg-red-100 text-red-800";
  }
};

function getFieldLabel(field: string): string {
  switch (field) {
    case "description":
      return "Descripción";
    case "amount":
      return "Monto";
    case "type":
      return "Tipo";
    case "date":
      return "Fecha";
    case "userAccountId":
      return "Cuenta";
    case "categoryId":
      return "Categoría";
    case "payeeId":
      return "Beneficiario";
    default:
      return field;
  }
}

function getFieldValue(
  field: string,
  value: unknown,
  accounts: Account[],
  categories: Category[],
  payees: Payee[],
): string {
  console.log(JSON.stringify({ field, value, accounts, categories, payees }));
  console.log(accounts.map((a) => a.id));
  console.log(categories.map((c) => c.id));
  console.log(payees.map((p) => p.id));

  if (value === null || value === undefined) return "Sin valor";
  if (field === "amount") return formatAmount(String(value));
  if (field === "date")
    return new Date(String(value)).toLocaleDateString("es-ES");
  if (field === "type") {
    const typeLabels: Record<string, string> = {
      income: "Ingreso",
      expense: "Gasto",
      transfer: "Transferencia",
    };
    return typeLabels[String(value)] || String(value);
  }
  if (field === "userAccountId") {
    const acc = accounts.find((a) => String(a.id) === String(value));
    return acc ? acc.name : String(value);
  }
  if (field === "categoryId") {
    const cat = categories.find((c) => String(c.id) === String(value));
    return cat ? cat.name : String(value);
  }
  if (field === "payeeId") {
    const payee = payees.find((p) => String(p.id) === String(value));
    return payee ? payee.name : String(value);
  }
  return String(value);
}

export function TransactionHistory({
  transactionId,

  accounts = [],
  categories = [],
  payees = [],
}: TransactionHistoryProps) {
  const { data, isLoading, error } = useTransactionHistory(transactionId);
  const history = data?.history || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No se pudo cargar el historial de cambios.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <h3 className="font-medium">Historial de Cambios</h3>
      </div>
      {history.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No hay historial de cambios disponible.
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <Card
                key={entry.id}
                className="w-full border-l-4 border-l-blue-500"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <Badge className={getActionColor(entry.action)}>
                        {getActionLabel(entry.action)}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {entry.action === "created" && entry.details && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">
                        Transacción creada con los siguientes datos:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(entry.details).map(([field, value]) =>
                          value && field !== "changes" ? (
                            <div key={field}>
                              <span className="font-medium">
                                {getFieldLabel(field)}:
                              </span>{" "}
                              {getFieldValue(
                                field,
                                value,
                                accounts,
                                categories,
                                payees,
                              )}
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                  )}
                  {entry.action === "updated" &&
                    entry.details &&
                    entry.details.changes && (
                      <div className="space-y-3">
                        <p className="font-medium text-sm">
                          Cambios realizados:
                        </p>
                        <div className="space-y-2">
                          {Object.entries(entry.details.changes).map(
                            ([field, change]) => (
                              <div
                                key={field}
                                className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm"
                              >
                                <span className="font-medium capitalize">
                                  {getFieldLabel(field)}:
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground line-through">
                                    {getFieldValue(
                                      field,
                                      change.from,
                                      accounts,
                                      categories,
                                      payees,
                                    )}
                                  </span>
                                  <span>→</span>
                                  <span className="font-medium">
                                    {getFieldValue(
                                      field,
                                      change.to,
                                      accounts,
                                      categories,
                                      payees,
                                    )}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  {entry.action === "deleted" && entry.details && (
                    <div className="space-y-2">
                      <p className="font-medium text-red-600 text-sm">
                        Transacción eliminada
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(entry.details).map(([field, value]) =>
                          value && field !== "changes" ? (
                            <div key={field}>
                              <span className="font-medium">
                                {getFieldLabel(field)}:
                              </span>{" "}
                              {getFieldValue(
                                field,
                                value,
                                accounts,
                                categories,
                                payees,
                              )}
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                {index < history.length - 1 && <Separator />}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
