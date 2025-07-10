import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import {
  categories,
  payees,
  transaction,
  transactionHistory,
} from "@/db/schema";
import type { Context } from "../context";

// Helper function to record transaction history
const recordTransactionHistory = async (
  transactionId: string,
  userId: string,
  action: "created" | "updated" | "deleted",
  details: Record<string, unknown>,
) => {
  await db.insert(transactionHistory).values({
    transactionId,
    userId,
    action,
    details,
    timestamp: new Date(),
  });
};

// Helper function to clean amount values
const cleanAmount = (amount: string): string => {
  // Remove commas and any currency symbols, keep only digits and decimal point
  return amount.replace(/[^\d.-]/g, "");
};

// Helper function to parse and validate dates
const parseDate = (dateStr: string): Date => {
  // Try different date formats
  const dateFormats = [
    "YYYY-MM-DD", // ISO format
    "DD/MM/YYYY", // European format
    "MM/DD/YYYY", // US format
    "DD-MM-YYYY", // European with dashes
    "MM-DD-YYYY", // US with dashes
  ];

  // First try direct parsing
  const directDate = new Date(dateStr);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  // Try parsing with different formats
  for (const format of dateFormats) {
    let parsedDate: Date | null = null;

    if (format === "YYYY-MM-DD") {
      // Handle ISO format
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = Number.parseInt(parts[2], 10);
        parsedDate = new Date(year, month, day);
      }
    } else if (format === "DD/MM/YYYY" || format === "DD-MM-YYYY") {
      // Handle European format
      const separator = format.includes("/") ? "/" : "-";
      const parts = dateStr.split(separator);
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = Number.parseInt(parts[2], 10);
        parsedDate = new Date(year, month, day);
      }
    } else if (format === "MM/DD/YYYY" || format === "MM-DD-YYYY") {
      // Handle US format
      const separator = format.includes("/") ? "/" : "-";
      const parts = dateStr.split(separator);
      if (parts.length === 3) {
        const month = Number.parseInt(parts[0], 10) - 1; // Month is 0-indexed
        const day = Number.parseInt(parts[1], 10);
        const year = Number.parseInt(parts[2], 10);
        parsedDate = new Date(year, month, day);
      }
    }

    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  throw new Error(
    `Invalid date format: ${dateStr}. Expected formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY`,
  );
};

// Zod schema for bulk import
const BulkImportTransactionSchema = z.object({
  payee: z.string().optional(),
  amount: z.string().min(1),
  date: z.string().min(1),
  category: z.string().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  userAccountId: z.string().min(1),
  notes: z.string().optional(),
  currency: z.string().optional(),
  isTransfer: z.boolean().optional(),
  transferAccountId: z.string().optional(),
  description: z.string().optional(),
});
const BulkImportSchema = z.object({
  transactions: z.array(BulkImportTransactionSchema).min(1),
});

// Router for managing transactions
const transactionsRouter = new Hono<{ Variables: Context }>()
  .get("/", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const {
        startDate,
        endDate,
        accountId,
        categoryId,
        search,
        page = "1",
        limit = "20",
      } = c.req.query();

      // Parse pagination parameters
      const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 20),
      );
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [eq(transaction.userId, user.id)];

      if (startDate) {
        conditions.push(gte(transaction.date, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(transaction.date, new Date(endDate)));
      }

      if (accountId) {
        conditions.push(eq(transaction.userAccountId, accountId));
      }

      if (categoryId) {
        conditions.push(
          eq(transaction.categoryId, Number.parseInt(categoryId, 10)),
        );
      }

      if (search) {
        conditions.push(like(transaction.description, `%${search}%`));
      }

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(transaction)
        .where(and(...conditions));

      // Get paginated transactions
      const transactions = await db
        .select()
        .from(transaction)
        .where(and(...conditions))
        .orderBy(desc(transaction.date))
        .limit(limitNum)
        .offset(offset);

      return c.json({
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(totalCount[0]?.count || 0),
          totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .post("/", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = await c.req.json();
      const transactionData = body.transaction;

      if (
        transactionData.description !== undefined &&
        typeof transactionData.description !== "string"
      ) {
        return c.json(
          {
            error: "La descripción debe ser una cadena de texto válida",
          },
          400,
        );
      }

      if (
        !transactionData.amount ||
        typeof transactionData.amount !== "string"
      ) {
        return c.json(
          {
            error: "Se requiere un monto válido para la transacción",
          },
          400,
        );
      }

      if (
        !transactionData.userAccountId ||
        typeof transactionData.userAccountId !== "string"
      ) {
        return c.json(
          {
            error: "Se requiere una cuenta válida para la transacción",
          },
          400,
        );
      }

      const transactionId = `txn_${nanoid(8)}`;

      const [createdTransaction] = await db
        .insert(transaction)
        .values({
          id: transactionId,
          description: transactionData.description || null,
          amount: transactionData.amount,
          currency: transactionData.currency || "MXN",
          date: new Date(transactionData.date),
          notes: transactionData.notes || null,
          userId: user.id,
          userAccountId: transactionData.userAccountId,
          categoryId: transactionData.categoryId || null,
          payeeId: transactionData.payeeId || null,
          isTransfer: transactionData.isTransfer || false,
          transferAccountId: transactionData.transferAccountId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Record transaction history
      await recordTransactionHistory(transactionId, user.id, "created", {
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        currency: transactionData.currency || "MXN",
        date: transactionData.date,
        userAccountId: transactionData.userAccountId,
        categoryId: transactionData.categoryId,
        payeeId: transactionData.payeeId,
      });

      return c.json({
        success: true,
        message: "Transacción creada exitosamente",
        transaction: createdTransaction,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      return c.json({ error: "Error interno del servidor" }, 500);
    }
  })
  .post(
    "/bulk-import",
    zValidator("json", BulkImportSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          { error: "Datos inválidos", details: result.error },
          400,
        );
      }
    }),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const { transactions } = c.req.valid("json");
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return c.json(
          { error: "Se requiere un array de transacciones válido" },
          400,
        );
      }

      // 1. Pre-fetch all categories and payees for the user
      const [allCategories, allPayees] = await Promise.all([
        db.query.categories.findMany({ where: eq(categories.userId, user.id) }),
        db.query.payees.findMany({ where: eq(payees.userId, user.id) }),
      ]);
      const categoryMap = new Map(
        allCategories.map((c) => [c.name.trim().toLowerCase(), c.id]),
      );
      const payeeMap = new Map(
        allPayees.map((p) => [p.name.trim().toLowerCase(), p.id]),
      );

      // 2. Prepare new categories/payees to create
      const newCategories = new Set<string>();
      const newPayees = new Set<string>();
      for (const tx of transactions) {
        if (tx.category && !categoryMap.has(tx.category.trim().toLowerCase())) {
          newCategories.add(tx.category.trim());
        }
        if (tx.payee && !payeeMap.has(tx.payee.trim().toLowerCase())) {
          newPayees.add(tx.payee.trim());
        }
      }

      // 3. Bulk create new categories/payees if needed
      if (newCategories.size > 0) {
        const created = await db
          .insert(categories)
          .values(
            Array.from(newCategories).map((name) => ({
              name,
              description: null,
              isIncome: false,
              excludeFromBudget: false,
              excludeFromTotals: false,
              archived: false,
              isGroup: false,
              order: 0,
              userId: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          )
          .returning();
        for (const cat of created) {
          categoryMap.set(cat.name.trim().toLowerCase(), cat.id);
        }
      }
      if (newPayees.size > 0) {
        const created = await db
          .insert(payees)
          .values(
            Array.from(newPayees).map((name) => ({
              name,
              userId: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          )
          .returning();
        for (const p of created) {
          payeeMap.set(p.name.trim().toLowerCase(), p.id);
        }
      }

      // 4. Prepare all transaction rows for bulk insert
      const now = new Date();
      const txRows = [];
      for (const tx of transactions) {
        const transactionId = `txn_${nanoid(8)}`;
        const categoryId = tx.category
          ? categoryMap.get(tx.category.trim().toLowerCase())
          : null;
        const payeeId = tx.payee
          ? payeeMap.get(tx.payee.trim().toLowerCase())
          : null;
        const parsedDate = parseDate(tx.date);

        txRows.push({
          id: transactionId,
          type: tx.type || "",
          description: tx.description || null,
          amount: cleanAmount(tx.amount),
          currency: tx.currency || "MXN",
          date: parsedDate,
          notes: tx.notes || null,
          userId: user.id,
          userAccountId: tx.userAccountId,
          categoryId,
          payeeId,
          isTransfer: tx.isTransfer || false,
          transferAccountId: tx.transferAccountId || null,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 6. Bulk insert all transactions in a single DB call
      const createdTransactions = await db
        .insert(transaction)
        .values(txRows)
        .returning();

      // 7. Optionally, record transaction history in bulk (can be optimized further)
      await Promise.all(
        createdTransactions.map((tx) =>
          recordTransactionHistory(tx.id, user.id, "created", {
            description: tx.description,
            amount: tx.amount,
            currency: tx.currency,
            date: tx.date,
            userAccountId: tx.userAccountId,
            categoryId: tx.categoryId,
            payeeId: tx.payeeId,
          }),
        ),
      );

      return c.json({
        success: true,
        message: `${createdTransactions.length} transacciones importadas exitosamente`,
        transactions: createdTransactions,
      });
    },
  )
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
        description,
        amount,
        type,
        currency,
        date,
        notes,
        userAccountId,
        categoryId,
        payeeId,
        isTransfer,
        transferAccountId,
      } = body;

      if (!id) {
        return c.json(
          {
            error: "Se requiere un ID válido para la transacción",
          },
          400,
        );
      }
      if (!amount || typeof amount !== "string") {
        return c.json(
          {
            error: "Se requiere un monto válido para la transacción",
          },
          400,
        );
      }

      if (!date || typeof date !== "string") {
        return c.json(
          {
            error: "Se requiere una fecha válida para la transacción",
          },
          400,
        );
      }

      if (!userAccountId || typeof userAccountId !== "string") {
        return c.json(
          {
            error: "Se requiere una cuenta válida para la transacción",
          },
          400,
        );
      }

      // Check if transaction belongs to user
      const existingTransaction = await db.query.transaction.findFirst({
        where: eq(transaction.id, id),
      });

      if (!existingTransaction || existingTransaction.userId !== user.id) {
        return c.json(
          {
            error: "Transacción no encontrada",
          },
          404,
        );
      }

      // Record changes for history
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      if (existingTransaction.description !== description) {
        changes.description = {
          from: existingTransaction.description ?? "",
          to: description ?? "",
        };
      }
      if (existingTransaction.amount !== amount) {
        changes.amount = {
          from: existingTransaction.amount ?? "",
          to: amount ?? "",
        };
      }

      if (
        existingTransaction.date.toISOString() !== new Date(date).toISOString()
      ) {
        changes.date = {
          from: existingTransaction.date?.toISOString() ?? "",
          to: new Date(date).toISOString() ?? "",
        };
      }
      if (existingTransaction.userAccountId !== userAccountId) {
        changes.userAccountId = {
          from: existingTransaction.userAccountId ?? "",
          to: userAccountId ?? "",
        };
      }
      if (existingTransaction.categoryId !== (categoryId || null)) {
        changes.categoryId = {
          from: existingTransaction.categoryId ?? "",
          to: categoryId ?? "",
        };
      }
      if (existingTransaction.payeeId !== (payeeId || null)) {
        changes.payeeId = {
          from: existingTransaction.payeeId ?? "",
          to: payeeId ?? "",
        };
      }

      const [updatedTransaction] = await db
        .update(transaction)
        .set({
          description: description || null,
          amount,
          currency: currency || "MXN",
          date: new Date(date),
          notes: notes || null,
          userAccountId,
          categoryId: categoryId || null,
          payeeId: payeeId || null,
          isTransfer: isTransfer || false,
          transferAccountId: transferAccountId || null,
          updatedAt: new Date(),
        })
        .where(eq(transaction.id, id))
        .returning();

      // Record transaction history if there were changes
      if (Object.keys(changes).length > 0) {
        await recordTransactionHistory(id, user.id, "updated", {
          changes,
          previousValues: {
            description: existingTransaction.description,
            amount: existingTransaction.amount,
            date: existingTransaction.date,
            userAccountId: existingTransaction.userAccountId,
            categoryId: existingTransaction.categoryId,
            payeeId: existingTransaction.payeeId,
          },
          newValues: {
            description,
            amount,
            type,
            date: new Date(date),
            userAccountId,
            categoryId: categoryId || null,
            payeeId: payeeId || null,
          },
        });
      }

      return c.json({
        success: true,
        message: "Transacción actualizada exitosamente",
        transaction: updatedTransaction,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);

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
            error: "Se requiere un ID válido para la transacción",
          },
          400,
        );
      }

      // Check if transaction belongs to user
      const existingTransaction = await db.query.transaction.findFirst({
        where: eq(transaction.id, id),
      });

      if (!existingTransaction || existingTransaction.userId !== user.id) {
        return c.json(
          {
            error: "Transacción no encontrada",
          },
          404,
        );
      }

      // Record transaction history before deletion
      await recordTransactionHistory(id, user.id, "deleted", {
        description: existingTransaction.description,
        amount: existingTransaction.amount,
        currency: existingTransaction.currency,
        date: existingTransaction.date,
        userAccountId: existingTransaction.userAccountId,
        categoryId: existingTransaction.categoryId,
        payeeId: existingTransaction.payeeId,
      });

      await db.delete(transaction).where(eq(transaction.id, id));

      return c.json({
        success: true,
        message: "Transacción eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
  .get("/history/:transactionId", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transactionId = c.req.param("transactionId");

      if (!transactionId) {
        return c.json({ error: "Transaction ID is required" }, 400);
      }

      // Verify the transaction belongs to the user
      const existingTransaction = await db.query.transaction.findFirst({
        where: eq(transaction.id, transactionId),
      });

      if (!existingTransaction || existingTransaction.userId !== user.id) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      // Get transaction history
      const history = await db
        .select()
        .from(transactionHistory)
        .where(eq(transactionHistory.transactionId, transactionId))
        .orderBy(desc(transactionHistory.timestamp));

      return c.json({
        success: true,
        history,
      });
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default transactionsRouter;
