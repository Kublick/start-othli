import { stripe } from "@better-auth/stripe";
import { betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import dotenv from "dotenv";
import { Resend } from "resend";
import { toast } from "sonner";
import Stripe from "stripe";
import { clientEnv, env } from "@/env";
import { db } from "../db";
import * as schema from "../db/schema";
import EmailConfirmation from "./email/ConfirmEmail";
import PasswordReset from "./email/PasswordReset";

dotenv.config();


const resend = new Resend(
  env.RESEND_API_KEY,
);

const stripeClient = new Stripe(
  env.STRIPE_SECRET_KEY ?? ""
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create a trial subscription automatically after user creation
          // This ensures every new user gets a 30-day trial immediately upon signup
          // instead of waiting for them to visit the dashboard
          const trialStart = new Date();
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial

          try {
            await db.insert(schema.subscription).values({
              id: `sub_trial_${user.id}`,
              plan: "mes", // Use the plan name from your Stripe configuration
              referenceId: user.id,
              status: "active",
              trialStart,
              trialEnd,
            });
            console.log(`Trial subscription created for user ${user.id}`);
          } catch (error) {
            console.error("Error creating trial subscription:", error);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, token }) => {
      const confirmationUrl = `${clientEnv.VITE_BETTER_AUTH_URL}/auth/reset?token=${token}`;
      const { error } = await resend.emails.send({
        from: "info@aumentapacientes.com",
        to: user.email,
        subject: "Reinicie tu contraseña",
        react: <PasswordReset name={user.name} url={confirmationUrl} />,
      });

      if (error) {
        console.error(error);
        toast.error(
          "Error al enviar el correo de reinicio de contraseña, intente mas tarde",
        );
      }
    },
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({
      user,
      token,
    }: {
      user: User;
      token: string;
    }) => {
      console.log("sendVerificationEmail", user, token);
      const confirmationUrl = `${clientEnv.VITE_BETTER_AUTH_URL}/auth/verify?token=${token}`;
      const { error } = await resend.emails.send({
        from: "info@aumentapacientes.com",
        to: user.email,
        subject: "Verifica tu correo electronico",
        text: "Verifica tu correo electronico",
        react: (
          <EmailConfirmation
            name={user.name}
            confirmationUrl={confirmationUrl}
          />
        ),
      });
      if (error) {
        console.error(error);
        toast.error(
          "Error al enviar el correo de verificación, intente mas tarde",
        );
      }
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: [clientEnv.VITE_BETTER_AUTH_URL],
  plugins: [
    openAPI(),
    admin(),
    reactStartCookies(),
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "mes",
            priceId: "price_1RluwY6ctRl877po6SqvJBD1",
            freeTrial: {
              days: 30,
            },
          },
        ],
      },
    }),
  ],
});
