import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { categories, categorySelectSchema } from "@/db/schema";
import type { Context } from "../context";
import { loggedIn } from "../middleware/logged-in";

export const categoriesRouter = new Hono<{ Variables: Context }>()
  .get("/", loggedIn, async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const req = await db.query.categories.findMany({
      where: eq(categories.userId, user.id),
    });

    const result = categorySelectSchema.array().parse(req);

    return c.json({
      categories: result,
    });
  })
  .post("/", loggedIn, async (c) => {
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

      // Check if the request is for bulk creation (has 'categories' array)
      if (body.categories && Array.isArray(body.categories)) {
        // Bulk category creation
        const categoryData = body.categories;

        if (!Array.isArray(categoryData) || categoryData.length === 0) {
          return c.json(
            {
              error: "Se requiere un array de categorías válido",
            },
            400,
          );
        }

        // Validate each category
        for (const category of categoryData) {
          if (!category.name || typeof category.name !== "string") {
            return c.json(
              {
                error: "Cada categoría debe tener un nombre válido",
              },
              400,
            );
          }
        }

        const createdCategories = await db
          .insert(categories)
          .values(
            categoryData.map((category) => ({
              name: category.name,
              description: category.description || null,
              isIncome: category.isIncome || false,
              excludeFromBudget: category.excludeFromBudget || false,
              excludeFromTotals: category.excludeFromTotals || false,
              archived: false,
              isGroup: false,
              order: 0,
              userId: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          )
          .returning();

        return c.json({
          success: true,
          message: `${createdCategories.length} categorías creadas exitosamente`,
          categories: createdCategories,
        });
      }
      // Single category creation
      const categoryData = body;

      if (!categoryData.name || typeof categoryData.name !== "string") {
        return c.json(
          {
            error: "Se requiere un nombre válido para la categoría",
          },
          400,
        );
      }

      const [createdCategory] = await db
        .insert(categories)
        .values({
          name: categoryData.name,
          description: categoryData.description || null,
          isIncome: categoryData.isIncome || false,
          excludeFromBudget: categoryData.excludeFromBudget || false,
          excludeFromTotals: categoryData.excludeFromTotals || false,
          archived: false,
          isGroup: false,
          order: 0,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({
        success: true,
        message: "Categoría creada exitosamente",
        category: createdCategory,
      });
    } catch (error) {
      console.error("Error creating categories:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
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
      const {
        id,
        name,
        description,
        isIncome,
        excludeFromBudget,
        excludeFromTotals,
        order,
      } = body;

      if (!id || !name || typeof name !== "string") {
        return c.json(
          {
            error: "Se requiere un ID y nombre válidos para la categoría",
          },
          400,
        );
      }

      // Check if category belongs to user
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.userId, user.id)),
      });

      if (!existingCategory) {
        return c.json(
          {
            error: "Categoría no encontrada",
          },
          404,
        );
      }

      const [updatedCategory] = await db
        .update(categories)
        .set({
          name,
          description: description || null,
          isIncome: isIncome || false,
          excludeFromBudget: excludeFromBudget || false,
          excludeFromTotals: excludeFromTotals || false,
          order: order !== undefined ? order : existingCategory.order,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
        .returning();

      return c.json({
        success: true,
        message: "Categoría actualizada exitosamente",
        category: updatedCategory,
      });
    } catch (error) {
      console.error("Error updating category:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
  .delete("/", loggedIn, async (c) => {
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
            error: "Se requiere un ID válido para la categoría",
          },
          400,
        );
      }

      // Check if category belongs to user
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.userId, user.id)),
      });

      if (!existingCategory) {
        return c.json(
          {
            error: "Categoría no encontrada",
          },
          404,
        );
      }

      await db
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

      return c.json({
        success: true,
        message: "Categoría eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting category:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  })
  .patch("/", loggedIn, async (c) => {
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
      const { id, archived, archivedOn } = body;

      if (!id) {
        return c.json(
          {
            error: "Se requiere un ID válido para la categoría",
          },
          400,
        );
      }

      // Check if category belongs to user
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.userId, user.id)),
      });

      if (!existingCategory) {
        return c.json(
          {
            error: "Categoría no encontrada",
          },
          404,
        );
      }

      const [updatedCategory] = await db
        .update(categories)
        .set({
          archived:
            archived !== undefined ? archived : existingCategory.archived,
          archivedOn:
            archivedOn !== undefined ? archivedOn : existingCategory.archivedOn,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
        .returning();

      return c.json({
        success: true,
        message: "Categoría actualizada exitosamente",
        category: updatedCategory,
      });
    } catch (error) {
      console.error("Error updating category:", error);

      return c.json(
        {
          error: "Error interno del servidor",
        },
        500,
      );
    }
  });
