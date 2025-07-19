import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/subscripcion/pago")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Agregar método de pago
          </CardTitle>
          <CardDescription>
            Actualiza tu suscripción para continuar usando todas las funciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Tu período de prueba está por finalizar. Para continuar utilizando
            todas las funciones de la aplicación, es necesario agregar un método
            de pago.
          </p>
          <p>
            Próximamente implementaremos la integración con Stripe para procesar
            pagos de forma segura.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link to="/dashboard/overview">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <Button disabled>
            <CreditCard className="mr-2 h-4 w-4" />
            Próximamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
