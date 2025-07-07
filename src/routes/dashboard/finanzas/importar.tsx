import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useImportStore } from "@/store/import-store";

export const Route = createFileRoute("/dashboard/finanzas/importar")({
  component: RouteComponent,
});

const FIELD_OPTIONS = [
  { value: "ignore", label: "Ignorar" },
  { value: "date", label: "Fecha" },
  { value: "payee", label: "Beneficiario" },
  { value: "amount", label: "Monto" },
  { value: "category", label: "Categoría" },
];

type ImportState = {
  rows: Record<string, string>[];
  headers: string[];
  accountId: string;
};

type MappedRow = {
  payee: string;
  amount: string;
  date: string;
  category?: string;
  type: "income" | "expense";
};

function RouteComponent() {
  const location = useLocation();
  const { setImportData, rows, headers, mapping, setMapping, accountId } =
    useImportStore();

  useEffect(() => {
    const state = (location.state || {}) as Partial<ImportState>;
    if (state.rows && state.headers) {
      setImportData({
        rows: state.rows,
        headers: state.headers,
        accountId: state.accountId || "",
      });
    }
    // eslint-disable-next-line
  }, [location.state, setImportData]);

  return (
    <div className="w-full p-8">
      <h1 className="mb-6 font-bold text-2xl">Importar transacciones</h1>
      <p className="">
        Identifica las columans se requiere como minimo Fecha, Beneficiario y
        Monto
      </p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h: string) => (
                <TableHead key={h} className="px-2 py-1 pb-4">
                  <Select
                    value={mapping[h]}
                    onValueChange={(val: string) => setMapping(h, val)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 20).map((row: Record<string, string>, i: number) => (
              <TableRow key={`row-${i}-${Object.values(row).join("-")}`}>
                {headers.map((h: string) => (
                  <TableCell key={h} className="px-2 py-2">
                    {row[h]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          onClick={async () => {
            // 1. Map and validate
            const mappedRows: MappedRow[] = rows.map(
              (row: Record<string, string>) => {
                const amountKey = Object.keys(mapping).find(
                  (k) => mapping[k] === "amount",
                );
                const payeeKey = Object.keys(mapping).find(
                  (k) => mapping[k] === "payee",
                );
                const dateKey = Object.keys(mapping).find(
                  (k) => mapping[k] === "date",
                );
                const categoryKey = Object.keys(mapping).find(
                  (k) => mapping[k] === "category",
                );

                if (!amountKey || !payeeKey || !dateKey) {
                  throw new Error("Missing required field mappings");
                }

                const amountStr = row[amountKey];
                const amountNum = Number(amountStr);

                return {
                  payee: row[payeeKey],
                  amount: amountStr,
                  date: row[dateKey],
                  category: categoryKey ? row[categoryKey] : undefined,
                  type: amountNum < 0 ? "expense" : "income",
                };
              },
            );
            const isValid = mappedRows.every(
              (row) => row.payee && row.amount && row.date,
            );
            if (!isValid) {
              toast.error("Faltan campos requeridos en algunas filas");
              return;
            }
            // 2. Send to backend
            try {
              const res = await fetch("/api/transactions/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions: mappedRows, accountId }),
              });
              if (res.ok) {
                toast.success("Transacciones importadas correctamente");
              } else {
                toast.error("Error al importar transacciones");
              }
            } catch (err) {
              console.log(err);
              toast.error("Error de red al importar transacciones");
            }
          }}
        >
          Importar
        </Button>
      </div>
    </div>
  );
}
