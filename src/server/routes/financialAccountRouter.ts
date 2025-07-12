import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { userAccount } from "@/db/schema";
import type { Context } from "../context";

// Map setup wizard account types to database enum values
const accountTypeMapping: Record<
  string,
  "efectivo" | "debito" | "credito" | "inversion"
> = {
  checking: "debito",
  savings: "debito",
  credit: "credito",
  investment: "inversion",
  cash: "efectivo",
  efectivo: "efectivo",
  debito: "debito",
  credito: "credito",
  inversion: "inversion",
};

// Router for managing user's financial accounts (checking, savings, credit, etc.)
const financialAccountRouter = new Hono<{ Variables: Context }>()
  .post("/", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = await c.req.json();

      // Check if the request is for bulk creation (has 'accounts' array)
      if (body.accounts && Array.isArray(body.accounts)) {
        // Bulk account creation (for setup wizard)
        const accountData = body.accounts;

        if (!Array.isArray(accountData) || accountData.length === 0) {
          return c.json(
            {
              error: "Se requiere un array de cuentas válido",
            },
            400,
          );
        }

        // Validate each account
        for (const account of accountData) {
          if (!account.name || typeof account.name !== "string") {
            return c.json(
              {
                error: "Cada cuenta debe tener un nombre válido",
              },
              400,
            );
          }
          if (!account.type || typeof account.type !== "string") {
            return c.json(
              {
                error: "Cada cuenta debe tener un tipo válido",
              },
              400,
            );
          }

          // Check if account type is valid
          if (!accountTypeMapping[account.type]) {
            return c.json(
              {
                error: `Tipo de cuenta inválido: ${account.type}`,
              },
              400,
            );
          }
        }

        const createdAccounts = await db
          .insert(userAccount)
          .values(
            accountData.map((account) => ({
              id: `acc_${nanoid(6)}`,
              name: account.name,
              type: accountTypeMapping[account.type],
              balance: account.balance || "0.00",
              currency: account.currency || "MXN",
              institutionName: account.institutionName || null,
              isActive: true,
              userId: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          )
          .returning();

        return c.json({
          success: true,
          message: `${createdAccounts.length} cuentas creadas exitosamente`,
          accounts: createdAccounts,
        });
      }
      // Single account creation
      const accountData = body;

      if (!accountData.name || typeof accountData.name !== "string") {
        return c.json(
          {
            error: "Se requiere un nombre válido para la cuenta",
          },
          400,
        );
      }
      if (!accountData.type || typeof accountData.type !== "string") {
        return c.json(
          {
            error: "Se requiere un tipo válido para la cuenta",
          },
          400,
        );
      }

      // Check if account type is valid
      if (!accountTypeMapping[accountData.type]) {
        return c.json(
          {
            error: `Tipo de cuenta inválido: ${accountData.type}`,
          },
          400,
        );
      }

      const [createdAccount] = await db
        .insert(userAccount)
        .values({
          id: `acc_${nanoid(6)}`,
          name: accountData.name,
          type: accountTypeMapping[accountData.type],
          balance: accountData.balance || "0.00",
          currency: accountData.currency || "MXN",
          institutionName: accountData.institutionName || null,
          isActive: true,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({
        success: true,
        message: "Cuenta creada exitosamente",
        account: createdAccount,
      });
    } catch (error) {
      console.error("Error creating accounts:", error);
      return c.json({ error: "Error interno del servidor" }, 500);
    }
  })
  .get("/", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const financialAccounts = await db
        .select()
        .from(userAccount)
        .where(eq(userAccount.userId, user.id));

      return c.json({ userAccounts: financialAccounts });
    } catch (error) {
      console.error("Error fetching financial accounts:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .put("/", async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    try {
      const body = await c.req.json();
      const {
        id,
        name,
        type,
        balance,
        currency,
        institutionName,
        excludeTransactions,
      } = body;

      if (!id || !name || typeof name !== "string") {
        return c.json(
          {
            error: "Se requiere un ID y nombre válidos para la cuenta",
          },
          400,
        );
      }

      if (!type || !accountTypeMapping[type]) {
        return c.json(
          {
            error: "Se requiere un tipo válido para la cuenta",
          },
          400,
        );
      }

      // Check if account belongs to user
      const existingAccount = await db.query.userAccount.findFirst({
        where: eq(userAccount.id, id),
      });

      if (!existingAccount || existingAccount.userId !== user.id) {
        return c.json(
          {
            error: "Cuenta no encontrada",
          },
          404,
        );
      }

      const [updatedAccount] = await db
        .update(userAccount)
        .set({
          name,
          type: accountTypeMapping[type],
          balance: balance || "0.00",
          currency: currency || "MXN",
          institutionName: institutionName || null,
          excludeTransactions: excludeTransactions || false,
          updatedAt: new Date(),
        })
        .where(eq(userAccount.id, id))
        .returning();

      return c.json({
        success: true,
        message: "Cuenta actualizada exitosamente",
        account: updatedAccount,
      });
    } catch (error) {
      console.error("Error updating account:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
  .delete("/", async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    try {
      const body = await c.req.json();
      const { id } = body;

      if (!id) {
        return c.json(
          {
            error: "Se requiere un ID válido para la cuenta",
          },
          400,
        );
      }

      // Check if account belongs to user
      const existingAccount = await db.query.userAccount.findFirst({
        where: eq(userAccount.id, id),
      });

      if (!existingAccount || existingAccount.userId !== user.id) {
        return c.json(
          {
            error: "Cuenta no encontrada",
          },
          404,
        );
      }

      await db.delete(userAccount).where(eq(userAccount.id, id));

      return c.json({
        success: true,
        message: "Cuenta eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting account:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
  .patch("/", async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    try {
      const body = await c.req.json();
      const { id, closedOn } = body;

      if (!id) {
        return c.json(
          {
            error: "Se requiere un ID válido para la cuenta",
          },
          400,
        );
      }

      // Check if account belongs to user
      const existingAccount = await db.query.userAccount.findFirst({
        where: eq(userAccount.id, id),
      });

      if (!existingAccount || existingAccount.userId !== user.id) {
        return c.json(
          {
            error: "Cuenta no encontrada",
          },
          404,
        );
      }

      const [updatedAccount] = await db
        .update(userAccount)
        .set({
          closedOn:
            closedOn !== undefined
              ? closedOn
                ? new Date(closedOn)
                : null
              : existingAccount.closedOn,
          updatedAt: new Date(),
        })
        .where(eq(userAccount.id, id))
        .returning();

      return c.json({
        success: true,
        message: "Cuenta actualizada exitosamente",
        account: updatedAccount,
      });
    } catch (error) {
      console.error("Error updating account:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  });

export default financialAccountRouter;
