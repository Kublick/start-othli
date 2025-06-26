import { redirect } from "@tanstack/react-router";
import { getSubscriptionLimits } from "./subscription-utils";

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  canAccessFeature: boolean;
  limits?: {
    maxSeats: number;
    currentSeats: number;
    availableSeats: number;
    canInvite: boolean;
  };
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
 * Middleware to redirect users without active subscription
 */
export async function requireActiveSubscription(userId: string) {
  const subscriptionCheck = await checkSubscriptionAccess(userId);

  if (!subscriptionCheck.hasActiveSubscription) {
    throw redirect({
      to: "/",
    });
  }

  return subscriptionCheck;
}

/**
 * Middleware to check if user can invite someone (has available seats)
 */
export async function requireAvailableSeats(userId: string) {
  const subscriptionCheck = await checkSubscriptionAccess(userId);

  if (!subscriptionCheck.hasActiveSubscription) {
    throw redirect({
      to: "/",
    });
  }

  if (!subscriptionCheck.limits?.canInvite) {
    throw redirect({
      to: "/dashboard/overview",
    });
  }

  return subscriptionCheck;
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
