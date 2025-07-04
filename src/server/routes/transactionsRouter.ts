import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { transaction, transactionHistory } from "@/db/schema";
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
        !transactionData.description ||
        typeof transactionData.description !== "string"
      ) {
        return c.json(
          {
            error: "Se requiere una descripción válida para la transacción",
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
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          currency: transactionData.currency || "USD",
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
        currency: transactionData.currency || "USD",
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

      if (!id || !description || typeof description !== "string") {
        return c.json(
          {
            error:
              "Se requiere un ID y descripción válidos para la transacción",
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

      if (!type || !["income", "expense", "transfer"].includes(type)) {
        return c.json(
          {
            error: "Se requiere un tipo válido para la transacción",
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
          description,
          amount,
          type,
          currency: currency || "USD",
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
