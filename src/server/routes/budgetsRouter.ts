import { zValidator } from "@hono/zod-validator";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { budget, budgetCategory, categories } from "@/db/schema";
import type { Context } from "../context";
import { loggedIn } from "../middleware/logged-in";

// Validation schemas
const getBudgetsQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
});

const updateBudgetBodySchema = z.object({
  categoryId: z.number().int().positive("Se requiere un categoryId válido"),
  amount: z.number().min(0, "Se requiere un monto válido mayor o igual a 0"),
});

const updateBudgetQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
});

// Helper function to validate and parse year/month
const validateYearMonth = (yearParam?: string, monthParam?: string) => {
  if (yearParam && monthParam) {
    const year = Number.parseInt(yearParam, 10);
    const month = Number.parseInt(monthParam, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
      throw new Error("Año y mes inválidos");
    }

    return { year, month };
  }

  // Default to current month if no parameters provided
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

export const budgetsRouter = new Hono<{ Variables: Context }>()
  .get("/", loggedIn, zValidator("query", getBudgetsQuerySchema), async (c) => {
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
      const { year: yearParam, month: monthParam } = c.req.valid("query");
      const { year, month } = validateYearMonth(yearParam, monthParam);

      const currentBudget = await db.query.budget.findFirst({
        where: and(
          eq(budget.userId, user.id),
          eq(budget.type, "personal"),
          sql`EXTRACT(YEAR FROM ${budget.startDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${budget.startDate}) = ${month}`,
        ),
      });

      if (!currentBudget) {
        return c.json({
          budgets: {},
        });
      }

      // Get budget categories for this budget
      const budgetCategories = await db
        .select({
          categoryId: budgetCategory.categoryId,
          plannedAmount: budgetCategory.plannedAmount,
          spentAmount: budgetCategory.spentAmount,
        })
        .from(budgetCategory)
        .where(eq(budgetCategory.budgetId, currentBudget.id));

      // Convert to Record<categoryId, plannedAmount>
      const budgets: Record<number, number> = {};
      budgetCategories.forEach((bc) => {
        budgets[bc.categoryId] = Number(bc.plannedAmount);
      });

      return c.json({
        budgets,
      });
    } catch (error) {
      console.error("Error fetching budgets:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Error interno del servidor",
        },
        500,
      );
    }
  })
  .post(
    "/",
    loggedIn,
    zValidator("query", updateBudgetQuerySchema),
    zValidator("json", updateBudgetBodySchema),
    async (c) => {
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
        const { categoryId, amount } = c.req.valid("json");
        const { year: yearParam, month: monthParam } = c.req.valid("query");
        const { year, month } = validateYearMonth(yearParam, monthParam);

        // Check if category belongs to user
        const category = await db.query.categories.findFirst({
          where: and(
            eq(categories.id, categoryId),
            eq(categories.userId, user.id),
          ),
        });

        if (!category) {
          return c.json(
            {
              error: "Categoría no encontrada",
            },
            404,
          );
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        let currentBudget = await db.query.budget.findFirst({
          where: and(
            eq(budget.userId, user.id),
            eq(budget.type, "personal"),
            sql`EXTRACT(YEAR FROM ${budget.startDate}) = ${year}`,
            sql`EXTRACT(MONTH FROM ${budget.startDate}) = ${month}`,
          ),
        });

        if (!currentBudget) {
          // Create new budget for the specified month
          const budgetId = nanoid();
          [currentBudget] = await db
            .insert(budget)
            .values({
              id: budgetId,
              name: `Presupuesto ${month}/${year}`,
              description: `Presupuesto personal para ${month}/${year}`,
              type: "personal",
              amount: "0.00",
              currency: "MXN",
              startDate,
              endDate,
              isActive: true,
              userId: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
        }

        // Check if budget category already exists
        const existingBudgetCategory = await db.query.budgetCategory.findFirst({
          where: and(
            eq(budgetCategory.budgetId, currentBudget.id),
            eq(budgetCategory.categoryId, categoryId),
          ),
        });

        if (existingBudgetCategory) {
          // Update existing budget category
          await db
            .update(budgetCategory)
            .set({
              plannedAmount: amount.toString(),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(budgetCategory.budgetId, currentBudget.id),
                eq(budgetCategory.categoryId, categoryId),
              ),
            );
        } else {
          // Create new budget category
          await db.insert(budgetCategory).values({
            id: nanoid(),
            budgetId: currentBudget.id,
            categoryId,
            plannedAmount: amount.toString(),
            spentAmount: "0.00",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return c.json({
          success: true,
          message: "Presupuesto actualizado exitosamente",
        });
      } catch (error) {
        console.error("Error updating budget:", error);
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Error interno del servidor",
          },
          500,
        );
      }
    },
  )
  .put("/", loggedIn, async (c) => {
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
      const { categoryId, amount } = body;

      if (!categoryId || typeof categoryId !== "number") {
        return c.json(
          {
            error: "Se requiere un categoryId válido",
          },
          400,
        );
      }

      if (typeof amount !== "number" || amount < 0) {
        return c.json(
          {
            error: "Se requiere un monto válido mayor o igual a 0",
          },
          400,
        );
      }

      // Check if category belongs to user
      const category = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, categoryId),
          eq(categories.userId, user.id),
        ),
      });

      if (!category) {
        return c.json(
          {
            error: "Categoría no encontrada",
          },
          404,
        );
      }

      // Get current month's budget
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const currentBudget = await db.query.budget.findFirst({
        where: and(
          eq(budget.userId, user.id),
          eq(budget.type, "personal"),
          sql`EXTRACT(YEAR FROM ${budget.startDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${budget.startDate}) = ${month}`,
        ),
      });

      if (!currentBudget) {
        return c.json(
          {
            error: "Presupuesto no encontrado",
          },
          404,
        );
      }

      // Update budget category
      await db
        .update(budgetCategory)
        .set({
          plannedAmount: amount.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(budgetCategory.budgetId, currentBudget.id),
            eq(budgetCategory.categoryId, categoryId),
          ),
        );

      return c.json({
        success: true,
        message: "Presupuesto actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error updating budget:", error);
      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  });
