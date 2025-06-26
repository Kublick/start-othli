import { Hono } from "hono";
import {
  getSubscriptionFromContext,
  requireAvailableSeats,
  requireSubscription,
  subscriptionMiddleware,
} from "./hono-subscription-middleware";
import {
  acceptInvitation,
  assignSeat,
  deactivateSeat,
  getPendingInvitations,
  getSubscriptionLimits,
} from "./subscription-utils";

// Example Hono app with subscription routes
const app = new Hono();

// Apply subscription middleware to all routes that need subscription info
app.use("/api/*", subscriptionMiddleware);

// Routes that require active subscription
app.use("/api/subscription/*", requireSubscription);
app.use("/api/shared/*", requireSubscription);

// Routes that require available seats for invitations
app.use("/api/invitations/*", requireAvailableSeats);

// Get subscription status
app.get("/api/subscription/status", async (c) => {
  const userId = c.get("userId");
  const limits = await getSubscriptionLimits(userId);

  return c.json({
    success: true,
    data: limits,
  });
});

// Get subscription seats
app.get("/api/subscription/seats", async (c) => {
  const userId = c.get("userId");
  const subscription = await getSubscriptionFromContext(c);

  if (!subscription?.hasActiveSubscription) {
    return c.json({ error: "No active subscription" }, 403);
  }

  // Get seats for user's subscription
  const seats = await getSubscriptionSeats(subscription.subscriptionId);

  return c.json({
    success: true,
    data: seats,
  });
});

// Invite user to subscription
app.post("/api/invitations", async (c) => {
  const userId = c.get("userId");
  const { email, name } = await c.req.json();

  // Check if user can invite (middleware already checked this)
  const subscription = getSubscriptionFromContext(c);

  if (!subscription?.limits?.canInvite) {
    return c.json({ error: "No available seats" }, 403);
  }

  // Create invitation
  const invitation = await createInvitation(userId, email, name);

  return c.json({
    success: true,
    data: invitation,
  });
});

// Accept invitation
app.post("/api/invitations/accept", async (c) => {
  const { token } = await c.req.json();
  const userId = c.get("userId");

  const success = await acceptInvitation(token, userId);

  if (!success) {
    return c.json({ error: "Invalid or expired invitation" }, 400);
  }

  return c.json({
    success: true,
    message: "Invitation accepted successfully",
  });
});

// Get pending invitations
app.get("/api/invitations/pending", async (c) => {
  const userId = c.get("userId");
  const invitations = await getPendingInvitations(userId);

  return c.json({
    success: true,
    data: invitations,
  });
});

// Remove user from subscription (deactivate seat)
app.delete("/api/subscription/seats/:seatUserId", async (c) => {
  const userId = c.get("userId");
  const seatUserId = c.req.param("seatUserId");

  // Get user's subscription
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return c.json({ error: "No active subscription" }, 403);
  }

  const success = await deactivateSeat(subscription.id, seatUserId);

  if (!success) {
    return c.json({ error: "Failed to deactivate seat" }, 500);
  }

  return c.json({
    success: true,
    message: "Seat deactivated successfully",
  });
});

// Shared budget routes (require subscription)
app.get("/api/shared/budgets", async (c) => {
  const userId = c.get("userId");

  // User has subscription (checked by middleware)
  const sharedBudgets = await getSharedBudgets(userId);

  return c.json({
    success: true,
    data: sharedBudgets,
  });
});

// Create shared budget
app.post("/api/shared/budgets", async (c) => {
  const userId = c.get("userId");
  const { name, description } = await c.req.json();

  const sharedBudget = await createSharedBudget(userId, name, description);

  return c.json({
    success: true,
    data: sharedBudget,
  });
});

// Example helper functions (you'll implement these based on your schema)
async function getSubscriptionSeats(subscriptionId: string) {
  // Implementation using your schema
  return [];
}

async function createInvitation(
  inviterId: string,
  email: string,
  name?: string,
) {
  // Implementation using your schema
  return { id: "inv_123", email, status: "pending" };
}

async function getUserSubscription(userId: string) {
  // Implementation using your schema
  return { id: "sub_123", status: "active" };
}

async function getSharedBudgets(userId: string) {
  // Implementation using your schema
  return [];
}

async function createSharedBudget(
  userId: string,
  name: string,
  description?: string,
) {
  // Implementation using your schema
  return { id: "budget_123", name, description };
}

export default app;
