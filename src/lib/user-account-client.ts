import { client } from "./client";

export async function getFinancialAccounts() {
  try {
    const res = await client.api["financial-accounts"].$get();

    if (res.ok) {
      return await res.json();
    }

    throw new Error("No se pudo obtener las cuentas financieras");
  } catch (error) {
    console.error("Error al obtener las cuentas financieras:", error);
    throw error;
  }
}
