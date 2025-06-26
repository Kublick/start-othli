import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  subscriptionPlan,
  subscriptionSeat,
  userInvitation,
  userSubscription,
} from "../db/schema";

export interface SubscriptionLimits {
  maxSeats: number;
  currentSeats: number;
  availableSeats: number;
  canInvite: boolean;
  subscriptionId: string;
}

export interface SeatInfo {
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: Date;
  isActive: boolean;
}

/**
 * Get subscription limits for a user
 */
export async function getSubscriptionLimits(
  userId: string,
): Promise<SubscriptionLimits | null> {
  try {
    // Get user's active subscription
    const subscription = await db
      .select({
        id: userSubscription.id,
        planId: userSubscription.planId,
        status: userSubscription.status,
      })
      .from(userSubscription)
      .where(
        and(
          eq(userSubscription.userId, userId),
          eq(userSubscription.status, "active"),
        ),
      )
      .limit(1);

    if (subscription.length === 0) {
      return null; // No active subscription
    }

    // Get plan details
    const plan = await db
      .select({
        maxSeats: subscriptionPlan.maxSeats,
      })
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, subscription[0].planId))
      .limit(1);

    if (plan.length === 0) {
      return null;
    }

    // Count active seats
    const activeSeats = await db
      .select({ count: count() })
      .from(subscriptionSeat)
      .where(
        and(
          eq(subscriptionSeat.subscriptionId, subscription[0].id),
          eq(subscriptionSeat.isActive, true),
        ),
      );

    const currentSeats = Number(activeSeats[0]?.count || 0);
    const maxSeats = plan[0].maxSeats;
    const availableSeats = maxSeats - currentSeats;

    return {
      maxSeats,
      currentSeats,
      availableSeats,
      canInvite: availableSeats > 0,
      subscriptionId: subscription[0].id,
    };
  } catch (error) {
    console.error("Error getting subscription limits:", error);
    return null;
  }
}

/**
 * Get active seats for a subscription
 */
export async function getSubscriptionSeats(
  subscriptionId: string,
): Promise<SeatInfo[]> {
  try {
    const seats = await db
      .select({
        userId: subscriptionSeat.userId,
        assignedAt: subscriptionSeat.assignedAt,
        isActive: subscriptionSeat.isActive,
      })
      .from(subscriptionSeat)
      .where(eq(subscriptionSeat.subscriptionId, subscriptionId));

    // Get user details for each seat
    const seatInfo: SeatInfo[] = [];
    for (const seat of seats) {
      const user = await db
        .select({
          name: sql<string>`user.name`,
          email: sql<string>`user.email`,
        })
        .from(sql`user`)
        .where(sql`user.id = ${seat.userId}`)
        .limit(1);

      if (user.length > 0) {
        seatInfo.push({
          userId: seat.userId,
          userName: user[0].name,
          userEmail: user[0].email,
          assignedAt: seat.assignedAt,
          isActive: seat.isActive,
        });
      }
    }

    return seatInfo;
  } catch (error) {
    console.error("Error getting subscription seats:", error);
    return [];
  }
}

/**
 * Assign a seat to a user
 */
export async function assignSeat(
  subscriptionId: string,
  userId: string,
): Promise<boolean> {
  try {
    // Check if seat is already assigned
    const existingSeat = await db
      .select()
      .from(subscriptionSeat)
      .where(
        and(
          eq(subscriptionSeat.subscriptionId, subscriptionId),
          eq(subscriptionSeat.userId, userId),
        ),
      )
      .limit(1);

    if (existingSeat.length > 0) {
      // Reactivate existing seat
      await db
        .update(subscriptionSeat)
        .set({
          isActive: true,
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionSeat.id, existingSeat[0].id));
    } else {
      // Create new seat
      await db.insert(subscriptionSeat).values({
        id: `seat_${subscriptionId}_${userId}`,
        subscriptionId,
        userId,
        isActive: true,
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error assigning seat:", error);
    return false;
  }
}

/**
 * Deactivate a seat
 */
export async function deactivateSeat(
  subscriptionId: string,
  userId: string,
): Promise<boolean> {
  try {
    await db
      .update(subscriptionSeat)
      .set({
        isActive: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptionSeat.subscriptionId, subscriptionId),
          eq(subscriptionSeat.userId, userId),
        ),
      );

    return true;
  } catch (error) {
    console.error("Error deactivating seat:", error);
    return false;
  }
}

/**
 * Check if user can invite someone (has available seats)
 */
export async function canInviteUser(userId: string): Promise<boolean> {
  const limits = await getSubscriptionLimits(userId);
  return limits?.canInvite || false;
}

/**
 * Get pending invitations for a user
 */
export async function getPendingInvitations(userId: string) {
  try {
    return await db
      .select()
      .from(userInvitation)
      .where(
        and(
          eq(userInvitation.inviterId, userId),
          eq(userInvitation.status, "pending"),
        ),
      );
  } catch (error) {
    console.error("Error getting pending invitations:", error);
    return [];
  }
}

/**
 * Accept invitation and assign seat
 */
export async function acceptInvitation(
  token: string,
  userId: string,
): Promise<boolean> {
  try {
    // Find the invitation
    const invitation = await db
      .select()
      .from(userInvitation)
      .where(
        and(
          eq(userInvitation.token, token),
          eq(userInvitation.status, "pending"),
        ),
      )
      .limit(1);

    if (invitation.length === 0) {
      return false;
    }

    // Get inviter's subscription
    const subscription = await db
      .select()
      .from(userSubscription)
      .where(
        and(
          eq(userSubscription.userId, invitation[0].inviterId),
          eq(userSubscription.status, "active"),
        ),
      )
      .limit(1);

    if (subscription.length === 0) {
      return false;
    }

    // Check if there are available seats
    const limits = await getSubscriptionLimits(invitation[0].inviterId);
    if (!limits?.canInvite) {
      return false;
    }

    // Assign seat
    const seatAssigned = await assignSeat(subscription[0].id, userId);
    if (!seatAssigned) {
      return false;
    }

    // Update invitation status
    await db
      .update(userInvitation)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userInvitation.id, invitation[0].id));

    return true;
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return false;
  }
}
