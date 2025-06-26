import { and, desc, eq, gte, like, lte } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { transaction } from "@/db/schema";
import type { Context } from "../context";

// Router for managing transactions
const transactionsRouter = new Hono<{ Variables: Context }>()
  .get("/", async (c) => {
    try {
      const user = c.get("user");

      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { startDate, endDate, accountId, categoryId, type, search } =
        c.req.query();

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
          eq(transaction.categoryId, Number.parseInt(categoryId)),
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

      const transactions = await db
        .select()
        .from(transaction)
        .where(and(...conditions))
        .orderBy(desc(transaction.date));

      return c.json({ transactions });
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

      const [createdTransaction] = await db
        .insert(transaction)
        .values({
          id: `txn_${user.id}_${Date.now()}_${Math.random()}`,
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
  });

export default transactionsRouter;
