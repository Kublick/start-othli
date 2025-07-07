import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
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

// Helper function to find or create category
const findOrCreateCategory = async (
  categoryName: string | undefined,
  userId: string,
) => {
  if (!categoryName || categoryName.trim() === "") {
    // Return null for no category
    return null;
  }

  const trimmedName = categoryName.trim();

  // First try to find existing category
  const existingCategory = await db.query.categories.findFirst({
    where: and(eq(categories.name, trimmedName), eq(categories.userId, userId)),
  });

  if (existingCategory) {
    return existingCategory.id;
  }

  // Create new category if it doesn't exist
  const [newCategory] = await db
    .insert(categories)
    .values({
      name: trimmedName,
      description: null,
      isIncome: false,
      excludeFromBudget: false,
      excludeFromTotals: false,
      archived: false,
      isGroup: false,
      order: 0,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCategory.id;
};

// Helper function to find or create payee
const findOrCreatePayee = async (
  payeeName: string | undefined,
  userId: string,
) => {
  if (!payeeName || payeeName.trim() === "") {
    // Return null for no payee
    return null;
  }

  const trimmedName = payeeName.trim();

  // First try to find existing payee
  const existingPayee = await db.query.payees.findFirst({
    where: and(eq(payees.name, trimmedName), eq(payees.userId, userId)),
  });

  if (existingPayee) {
    return existingPayee.id;
  }

  // Create new payee if it doesn't exist
  const [newPayee] = await db
    .insert(payees)
    .values({
      name: trimmedName,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newPayee.id;
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

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  throw new Error(
    `Invalid date format: ${dateStr}. Expected formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY`,
  );
};

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
        type,
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

      if (type) {
        conditions.push(
          eq(transaction.type, type as "income" | "expense" | "transfer"),
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
        !transactionData.type ||
        !["income", "expense", "transfer"].includes(transactionData.type)
      ) {
        return c.json(
          {
            error: "Se requiere un tipo válido para la transacción",
          },
          400,
        );
      }

      if (!transactionData.date || typeof transactionData.date !== "string") {
        return c.json(
          {
            error: "Se requiere una fecha válida para la transacción",
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

      const transactionId = `txn_${user.id}_${Date.now()}_${Math.random()}`;

      const [createdTransaction] = await db
        .insert(transaction)
        .values({
          id: transactionId,
          description: transactionData.description || null,
          amount: transactionData.amount,
          type: transactionData.type,
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
  .post("/bulk-import", async (c) => {
    try {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const body = await c.req.json();
      const { transactions } = body;
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return c.json(
          { error: "Se requiere un array de transacciones válido" },
          400,
        );
      }
      // Validate all transactions first (no accountType or type required)
      for (const [i, transactionData] of transactions.entries()) {
        if (
          transactionData.description !== undefined &&
          typeof transactionData.description !== "string"
        ) {
          return c.json(
            {
              error: `La descripción debe ser una cadena de texto válida (índice ${i})`,
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
              error: `Se requiere un monto válido para la transacción (índice ${i})`,
            },
            400,
          );
        }
        if (!transactionData.date || typeof transactionData.date !== "string") {
          return c.json(
            {
              error: `Se requiere una fecha válida para la transacción (índice ${i})`,
            },
            400,
          );
        }
      }
      // All valid, insert all
      const now = new Date();
      const createdTransactions = [];
      for (const [i, transactionData] of transactions.entries()) {
        try {
          const transactionId = `txn_${user.id}_${Date.now()}_${Math.random()}`;

          // Handle category lookup/creation
          const categoryId = await findOrCreateCategory(
            transactionData.category,
            user.id,
          );

          // Handle payee lookup/creation
          const payeeId = await findOrCreatePayee(
            transactionData.payee,
            user.id,
          );

          // Parse and validate date
          const parsedDate = parseDate(transactionData.date);

          const [createdTransaction] = await db
            .insert(transaction)
            .values({
              id: transactionId,
              type: transactionData.type || "",
              description: transactionData.description || null,
              amount: cleanAmount(transactionData.amount),
              currency: transactionData.currency || "MXN",
              date: parsedDate,
              notes: transactionData.notes || null,
              userId: user.id,
              userAccountId: transactionData.userAccountId,
              categoryId: categoryId,
              payeeId: payeeId,
              isTransfer: transactionData.isTransfer || false,
              transferAccountId: transactionData.transferAccountId || null,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          await recordTransactionHistory(transactionId, user.id, "created", {
            description: transactionData.description,
            amount: transactionData.amount,
            currency: transactionData.currency || "MXN",
            date: transactionData.date,
            userAccountId: transactionData.userAccountId,
            categoryId: categoryId,
            payeeId: payeeId,
          });
          createdTransactions.push(createdTransaction);
        } catch (error) {
          console.error(`Error processing transaction at index ${i}:`, error);
          return c.json(
            {
              error: `Error processing transaction at index ${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            400,
          );
        }
      }
      return c.json({
        success: true,
        message: `${createdTransactions.length} transacciones importadas exitosamente`,
        transactions: createdTransactions,
      });
    } catch (error) {
      console.error("Error en la importación masiva de transacciones:", error);
      return c.json({ error: "Error interno del servidor" }, 500);
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

      if (description !== undefined && typeof description !== "string") {
        return c.json(
          {
            error: "La descripción debe ser una cadena de texto válida",
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
      if (existingTransaction.type !== type) {
        changes.type = {
          from: existingTransaction.type ?? "",
          to: type ?? "",
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
          type,
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
            type: existingTransaction.type,
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
        type: existingTransaction.type,
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
