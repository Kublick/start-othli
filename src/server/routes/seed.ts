import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { subscriptionPlan } from "@/db/schema";
import type { Context } from "../context";

export const seedRouter = new Hono<{ Variables: Context }>().get(
  "/",
  async (c) => {
    try {
      // Check if the couples_basic plan already exists
      const existingPlan = await db
        .select()
        .from(subscriptionPlan)
        .where(eq(subscriptionPlan.name, "couples_basic"))
        .limit(1);

      if (existingPlan.length === 0) {
        // Insert the default couples_basic plan
        await db.insert(subscriptionPlan).values({
          id: "couples_basic_plan",
          name: "couples_basic",
          displayName: "Couples Basic",
          description:
            "Perfect for couples managing shared finances. Includes 2 seats for you and your partner.",
          price: "9.99",
          currency: "MXN",
          billingInterval: "monthly",
          maxSeats: 2,
          features: [
            "Personal and shared budgets",
            "Individual categories and accounts",
            "Transaction tracking",
            "Expense splitting",
            "Recurring transactions",
            "Basic reporting",
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("✅ Couples Basic subscription plan seeded successfully");
      } else {
        console.log("ℹ️  Couples Basic subscription plan already exists");
      }

      return c.json({
        message: "Done",
      });
    } catch (error) {
      console.error("❌ Error seeding subscription plans:", error);
      throw error;
    }
  },
);
