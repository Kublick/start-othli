import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck, CircleX, Home } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const TokenSchema = z.object({
  token: z.string(),
});

interface VerifyRouteData {
  code?: CODE_TYPE;
  success: boolean;
  status?: boolean;
  error?: string;
  errorStatus?: number;
  statusText?: string;
}

type CODE_TYPE = "TOKEN_EXPIRED" | "TOKEN_INVALID";

export const Route = createFileRoute("/auth/verify")({
  validateSearch: TokenSchema,
  beforeLoad: async ({ search }): Promise<VerifyRouteData> => {
    try {
      const { data, error } = await authClient.verifyEmail({
        query: {
          token: search.token,
        },
      });

      if (error) {
        console.log(error);
        return {
          code: error.code as CODE_TYPE,
          success: false,
          error: error.message,
          errorStatus: error.status,
        };
      }

      return {
        success: data !== undefined,
        status: data?.status,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
      };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { success, code } = Route.useRouteContext();

  if (success) {
    return (
      <div className="mx-auto flex h-screen flex-col items-center justify-center">
        <Card className="mx-4 max-w-2xl md:mx-0">
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-4">
              <CircleCheck className="text-bold text-green-500 " size={36} />
              <p className="text-2xl text-muted-foreground">
                Tu cuenta ha sido veificada
              </p>
            </div>
            <p className="text-muted-foreground">
              Ahora puedes iniciar sesion y comenzar a usar Ometomi
            </p>
            <Button>
              <Link to="/auth/login">Inicia sesion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="mx-auto flex h-screen flex-col items-center justify-center">
        <Card className="mx-4 max-w-2xl md:mx-0">
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-4">
              <CircleX className="text-bold text-red-500 " size={36} />
              <p className="text-2xl text-muted-foreground">
                Ocurrio un error al verificar tu cuenta
              </p>
            </div>
            <p>
              {code === "TOKEN_EXPIRED" && " Expiro el codigo de acceso"}
              {code === "TOKEN_INVALID" && " Revise su correo de verificacion"}
            </p>
            <Button>
              <Link to="/">
                <Home />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
