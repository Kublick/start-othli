import type { Context, Next } from "hono";
import { getSubscriptionLimits } from "./subscription-utils";

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  canAccessFeature: boolean;
  subscriptionId?: string;
  limits?: {
    maxSeats: number;
    currentSeats: number;
    availableSeats: number;
    canInvite: boolean;
  };
}

// Extend Hono context to include our custom variables
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    subscription: SubscriptionCheckResult;
  }
}

/**
 * Hono middleware to check subscription access
 */
export async function subscriptionMiddleware(c: Context, next: Next) {
  try {
    // Get user ID from context (assuming it's set by auth middleware)
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const subscriptionCheck = await checkSubscriptionAccess(userId);

    // Store subscription info in context for route handlers
    c.set("subscription", subscriptionCheck);

    await next();
  } catch (error) {
    console.error("Subscription middleware error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

/**
 * Hono middleware to require active subscription
 */
export async function requireSubscription(c: Context, next: Next) {
  try {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const subscriptionCheck = await checkSubscriptionAccess(userId);

    if (!subscriptionCheck.hasActiveSubscription) {
      return c.json(
        {
          error: "Subscription required",
          message: "Please subscribe to access this feature",
        },
        403,
      );
    }

    c.set("subscription", subscriptionCheck);
    await next();
  } catch (error) {
    console.error("Require subscription middleware error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

/**
 * Hono middleware to require available seats for invitations
 */
export async function requireAvailableSeats(c: Context, next: Next) {
  try {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const subscriptionCheck = await checkSubscriptionAccess(userId);

    if (!subscriptionCheck.hasActiveSubscription) {
      return c.json(
        {
          error: "Subscription required",
          message: "Please subscribe to invite users",
        },
        403,
      );
    }

    if (!subscriptionCheck.limits?.canInvite) {
      return c.json(
        {
          error: "No available seats",
          message:
            "No available seats. Please upgrade your plan or remove inactive users.",
        },
        403,
      );
    }

    c.set("subscription", subscriptionCheck);
    await next();
  } catch (error) {
    console.error("Require available seats middleware error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

/**
 * Check if user has active subscription and can access features
 */
export async function checkSubscriptionAccess(
  userId: string,
): Promise<SubscriptionCheckResult> {
  try {
    const limits = await getSubscriptionLimits(userId);

    if (!limits) {
      return {
        hasActiveSubscription: false,
        canAccessFeature: false,
      };
    }

    return {
      hasActiveSubscription: true,
      canAccessFeature: true,
      subscriptionId: limits.subscriptionId,
      limits,
    };
  } catch (error) {
    console.error("Error checking subscription access:", error);
    return {
      hasActiveSubscription: false,
      canAccessFeature: false,
    };
  }
}

/**
 * Check if user can access shared budget features
 */
export async function canAccessSharedFeatures(
  userId: string,
): Promise<boolean> {
  const subscriptionCheck = await checkSubscriptionAccess(userId);
  return subscriptionCheck.hasActiveSubscription;
}

/**
 * Get subscription status for UI display
 */
export function getSubscriptionStatusText(
  limits: SubscriptionCheckResult["limits"],
) {
  if (!limits) {
    return "No active subscription";
  }

  if (limits.availableSeats === 0) {
    return "All seats occupied";
  }

  return `${limits.currentSeats}/${limits.maxSeats} seats used`;
}

/**
 * Helper to get subscription info from Hono context
 */
export function getSubscriptionFromContext(
  c: Context,
): SubscriptionCheckResult | null {
  return c.get("subscription") || null;
}
