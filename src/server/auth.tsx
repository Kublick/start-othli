import { betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import { Resend } from "resend";
import { toast } from "sonner";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { clientEnv, env } from "@/env";
import EmailConfirmation from "./email/ConfirmEmail";
import PasswordReset from "./email/PasswordReset";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
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
  plugins: [openAPI(), reactStartCookies()],
});
