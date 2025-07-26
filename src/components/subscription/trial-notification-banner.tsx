import { Link } from "@tanstack/react-router";
import { AlertCircle, CreditCard, X } from "lucide-react";
import { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!trialEndDate) return null;

  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(trialEndDate);

  // Determine if we should use red styling (less than 5 days or expired)
  const isUrgent = daysRemaining < 5;
  
  // Color classes based on urgency
  const alertClasses = isUrgent 
    ? "mb-4 border-red-200 bg-red-50" 
    : "mb-4 border-amber-200 bg-amber-50";
  
  const iconClasses = isUrgent 
    ? "h-5 w-5 text-red-600" 
    : "h-5 w-5 text-amber-600";
  
  const titleClasses = isUrgent 
    ? "text-red-800" 
    : "text-amber-800";
  
  const textClasses = isUrgent 
    ? "text-red-700" 
    : "text-amber-700";

  if (isCollapsed) {
    return (
      <div className="mb-4 flex items-center justify-start">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-gray-100"
          aria-label="Mostrar notificación de período de prueba"
        >
          <AlertCircle className={iconClasses} />
          <span className={`text-sm font-medium ${titleClasses}`}>
            Período de prueba
          </span>
        </button>
      </div>
    );
  }

  return (
    <Alert className={alertClasses}>
      <AlertCircle className={iconClasses} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className={titleClasses}>
            Período de prueba activo
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={textClasses}>
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
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="ml-2 rounded-md p-1 transition-colors hover:bg-black/5"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
}
