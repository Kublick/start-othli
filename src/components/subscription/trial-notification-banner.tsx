import { Link } from "@tanstack/react-router";
import { AlertCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TrialNotificationBannerProps {
  trialEndDate: Date | null;
  daysRemaining: number;
}

export function TrialNotificationBanner({
  trialEndDate,
  daysRemaining,
}: TrialNotificationBannerProps) {
  if (!trialEndDate) return null;

  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(trialEndDate);

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Período de prueba activo
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-amber-700">
          {daysRemaining > 0 ? (
            <>
              Tu período de prueba termina en{" "}
              <strong>{daysRemaining} días</strong> ({formattedDate}). Agrega un
              método de pago para continuar usando todas las funciones.
            </>
          ) : (
            <>
              Tu período de prueba ha <strong>terminado</strong>. Agrega un
              método de pago para continuar usando todas las funciones.
            </>
          )}
        </div>
        <Button asChild size="sm" className="mt-2 sm:mt-0">
          <Link to="/subscripcion/pago">
            <CreditCard className="mr-2 h-4 w-4" />
            Agregar método de pago
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
