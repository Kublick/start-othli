import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { user } from "@/db/schema";
import type { Context } from "../context";

export const setupRouter = new Hono<{ Variables: Context }>()
  .post("/complete", async (c) => {
    try {
      const currentUser = c.get("user");

      if (!currentUser?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Update user's setup completion status
      const [updatedUser] = await db
        .update(user)
        .set({
          setupCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Setup marked as complete",
        user: {
          id: updatedUser.id,
          setupCompleted: updatedUser.setupCompleted,
        },
      });
    } catch (error) {
      console.error("Error marking setup complete:", error);
      return c.json({ error: "Error interno del servidor" }, 500);
    }
  })
  .get("/status", async (c) => {
    try {
      const currentUser = c.get("user");

      if (!currentUser?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get user's setup completion status
      const userData = await db
        .select({ setupCompleted: user.setupCompleted })
        .from(user)
        .where(eq(user.id, currentUser.id))
        .limit(1);

      if (userData.length === 0) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        setupCompleted: userData[0].setupCompleted,
      });
    } catch (error) {
      console.error("Error getting setup status:", error);
      return c.json({ error: "Error interno del servidor" }, 500);
    }
  });
