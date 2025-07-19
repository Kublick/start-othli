import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { subscription } from "@/db/schema";
import type { Context } from "../context";

export const subscriptionRouter = new Hono<{ Variables: Context }>()
  .get("/trial-status", async (c) => {
    console.log("checking trial");
    try {
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Get user's subscription
      const userSubscription = await db
        .select({
          id: subscription.id,
          status: subscription.status,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
        })
        .from(subscription)
        .where(
          and(
            eq(subscription.referenceId, user.id),
            eq(subscription.status, "active"),
          ),
        )
        .limit(1);

      console.log(userSubscription);

      if (userSubscription.length === 0) {
        // If no subscription exists, return no active subscription
        // This should not happen normally since we create a trial subscription on signup
        // But we handle it gracefully in case of database issues
        return c.json({
          hasActiveSubscription: false,
          isOnTrial: false,
          trialStart: null,
          trialEnd: null,
        });
      }

      // Return existing subscription info
      const sub = userSubscription[0];
      console.log("🚀 ~ .get ~ sub:", sub);
      return c.json({
        hasActiveSubscription: sub.status === "active",
        isOnTrial: !!sub.trialEnd,
        trialStart: sub.trialStart?.toISOString() || null,
        trialEnd: sub.trialEnd?.toISOString() || null,
      });
    } catch (error) {
      console.error("Error getting trial status:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .get("/payment", async (c) => {
    try {
      const userId = c.get("userId");

      // This would typically redirect to your Stripe checkout or customer portal
      // For now, we'll just return a message
      return c.json({
        message: "Payment page not implemented yet",
        userId,
      });
    } catch (error) {
      console.error("Error accessing payment page:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });
