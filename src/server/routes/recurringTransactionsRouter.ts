import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { recurringTransaction } from "@/db/schema";
import type { Context } from "../context";

// Zod schema for recurring transaction
const RecurringTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["debito", "credito", "inversion"]),
  currency: z.string().default("MXN"),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  userAccountId: z.string().min(1, "Account is required"),
  categoryId: z.number().optional(),
  payeeId: z.number().optional(),
});

const UpdateRecurringTransactionSchema = RecurringTransactionSchema.extend({
  id: z.string().min(1, "ID is required"),
  isActive: z.boolean().optional(),
});

const recurringTransactionsRouter = new Hono<{ Variables: Context }>()
  .get("/", async (c) => {
    try {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const recurringTransactions = await db
        .select()
        .from(recurringTransaction)
        .where(eq(recurringTransaction.userId, user.id))
        .orderBy(desc(recurringTransaction.createdAt));

      return c.json({
        success: true,
        recurringTransactions,
      });
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .post(
    "/",
    zValidator("json", RecurringTransactionSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: "Invalid data", details: result.error }, 400);
      }
    }),
    async (c) => {
      try {
        const user = c.get("user");
        if (!user?.id) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const data = c.req.valid("json");
        const recurringTransactionId = nanoid();

        const [createdRecurringTransaction] = await db
          .insert(recurringTransaction)
          .values({
            id: recurringTransactionId,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            isActive: true,
            userId: user.id,
            userAccountId: data.userAccountId,
            categoryId: data.categoryId || null,
            payeeId: data.payeeId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return c.json({
          success: true,
          message: "Recurring transaction created successfully",
          recurringTransaction: createdRecurringTransaction,
        });
      } catch (error) {
        console.error("Error creating recurring transaction:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  )
  .put(
    "/",
    zValidator("json", UpdateRecurringTransactionSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: "Invalid data", details: result.error }, 400);
      }
    }),
    async (c) => {
      try {
        const user = c.get("user");
        if (!user?.id) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const data = c.req.valid("json");

        // Check if recurring transaction belongs to user
        const existingRecurringTransaction =
          await db.query.recurringTransaction.findFirst({
            where: eq(recurringTransaction.id, data.id),
          });

        if (
          !existingRecurringTransaction ||
          existingRecurringTransaction.userId !== user.id
        ) {
          return c.json({ error: "Recurring transaction not found" }, 404);
        }

        const [updatedRecurringTransaction] = await db
          .update(recurringTransaction)
          .set({
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            isActive: data.isActive ?? true,
            userAccountId: data.userAccountId,
            categoryId: data.categoryId || null,
            payeeId: data.payeeId || null,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransaction.id, data.id))
          .returning();

        return c.json({
          success: true,
          message: "Recurring transaction updated successfully",
          recurringTransaction: updatedRecurringTransaction,
        });
      } catch (error) {
        console.error("Error updating recurring transaction:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  )
  .delete("/", async (c) => {
    try {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = await c.req.json();
      const { id } = body;

      if (!id) {
        return c.json({ error: "ID is required" }, 400);
      }

      // Check if recurring transaction belongs to user
      const existingRecurringTransaction =
        await db.query.recurringTransaction.findFirst({
          where: eq(recurringTransaction.id, id),
        });

      if (
        !existingRecurringTransaction ||
        existingRecurringTransaction.userId !== user.id
      ) {
        return c.json({ error: "Recurring transaction not found" }, 404);
      }

      await db
        .delete(recurringTransaction)
        .where(eq(recurringTransaction.id, id));

      return c.json({
        success: true,
        message: "Recurring transaction deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default recurringTransactionsRouter;
