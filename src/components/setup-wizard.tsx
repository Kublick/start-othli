import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES } from "@/constants/categories";
import { setupClient } from "@/lib/setup-client";

type WizardStep = "welcome" | "categories" | "accounts" | "complete";

interface SetupWizardProps {
  onComplete?: () => void;
}

export function SetupWizard({ onComplete = () => {} }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [accounts, setAccounts] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      balance: string;
      institutionName?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleAddAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        id: `account-${Date.now()}-${Math.random()}`,
        name: "",
        type: "checking",
        balance: "0.00",
        institutionName: "",
      },
    ]);
  };

  const handleUpdateAccount = (id: string, field: string, value: string) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, [field]: value } : account,
      ),
    );
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  const handleSaveCategories = async () => {
    setIsLoading(true);
    try {
      // Map selected category IDs to category data
      const categoryData = selectedCategories.map((categoryId) => {
        const category = CATEGORIES.find((c) => c.id === categoryId);
        return {
          name: category?.name || "",
          description: undefined,
          isIncome: false,
          excludeFromBudget: false,
          excludeFromTotals: false,
        };
      });

      await setupClient.saveCategories(categoryData);
      toast.success("Categorías guardadas exitosamente");
      setCurrentStep("accounts");
    } catch (error) {
      console.error("Error saving categories:", error);
      toast.error("Error al guardar las categorías");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAccounts = async () => {
    setIsLoading(true);
    try {
      // Map accounts to the proper format
      const accountData = accounts.map((account) => ({
        name: account.name,
        type: account.type,
        balance: account.balance,
        institutionName: account.institutionName,
        currency: "MXN", // Default currency
      }));

      await setupClient.saveAccounts(accountData);
      toast.success("Cuentas guardadas exitosamente");
      setCurrentStep("complete");
    } catch (error) {
      console.error("Error saving accounts:", error);
      toast.error("Error al guardar las cuentas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await setupClient.markSetupComplete();
      toast.success("¡Configuración completada!");
      onComplete();
    } catch (error) {
      console.error("Error completing setup:", error);
      toast.error("Error al completar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-3xl">
          ¡Bienvenido a Ometomi!
        </CardTitle>
        <CardDescription className="text-lg">
          Vamos a configurar tu cuenta para que puedas empezar a gestionar tus
          finanzas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            En los siguientes pasos te ayudaremos a:
          </p>
          <ul className="mx-auto max-w-md space-y-2 text-left">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Seleccionar las categorías que usas para tus gastos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Crear tus primeras cuentas bancarias
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Configurar tu primer presupuesto mensual
            </li>
          </ul>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => setCurrentStep("categories")}
            size="lg"
            className="px-8"
          >
            Comenzar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCategoriesStep = () => (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Selecciona tus categorías</CardTitle>
        <CardDescription>
          Elige las categorías que mejor describen tus gastos. Puedes agregar
          más después.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className="flex w-full cursor-pointer items-center space-x-2 rounded-lg border p-3 text-left hover:bg-muted/50"
              onClick={() => handleCategoryToggle(category.id)}
            >
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label className="flex-1 cursor-pointer">{category.name}</Label>
            </button>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("welcome")}>
            Atrás
          </Button>
          <Button
            onClick={handleSaveCategories}
            disabled={selectedCategories.length === 0 || isLoading}
          >
            {isLoading ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAccountsStep = () => (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configura tus cuentas</CardTitle>
        <CardDescription>
          Agrega tus cuentas bancarias para empezar a registrar transacciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {accounts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              No tienes cuentas configuradas aún
            </p>
            <Button onClick={handleAddAccount}>Agregar Primera Cuenta</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Cuenta {accounts.findIndex((a) => a.id === account.id) + 1}
                  </h4>
                  {accounts.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAccount(account.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${account.id}`}>
                      Nombre de la cuenta
                    </Label>
                    <Input
                      id={`name-${account.id}`}
                      value={account.name}
                      onChange={(e) =>
                        handleUpdateAccount(account.id, "name", e.target.value)
                      }
                      placeholder="Ej: Cuenta Principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`type-${account.id}`}>Tipo de cuenta</Label>
                    <Select
                      value={account.type}
                      onValueChange={(value) =>
                        handleUpdateAccount(account.id, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">
                          Cuenta Corriente
                        </SelectItem>
                        <SelectItem value="savings">
                          Cuenta de Ahorros
                        </SelectItem>
                        <SelectItem value="credit">
                          Tarjeta de Crédito
                        </SelectItem>
                        <SelectItem value="investment">Inversión</SelectItem>
                        <SelectItem value="cash">Efectivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`balance-${account.id}`}>
                      Saldo actual
                    </Label>
                    <Input
                      id={`balance-${account.id}`}
                      type="number"
                      step="0.01"
                      value={account.balance}
                      onChange={(e) =>
                        handleUpdateAccount(
                          account.id,
                          "balance",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`institution-${account.id}`}>
                      Institución (opcional)
                    </Label>
                    <Input
                      id={`institution-${account.id}`}
                      value={account.institutionName || ""}
                      onChange={(e) =>
                        handleUpdateAccount(
                          account.id,
                          "institutionName",
                          e.target.value,
                        )
                      }
                      placeholder="Ej: Banco XYZ"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddAccount}
              className="w-full"
            >
              Agregar Otra Cuenta
            </Button>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("categories")}
          >
            Atrás
          </Button>
          <Button
            onClick={handleSaveAccounts}
            disabled={
              accounts.length === 0 ||
              accounts.some((a) => !a.name) ||
              isLoading
            }
          >
            {isLoading ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-3xl text-green-600">
          ¡Configuración Completada!
        </CardTitle>
        <CardDescription className="text-lg">
          Ya estás listo para empezar a gestionar tus finanzas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">Has configurado exitosamente:</p>
          <ul className="mx-auto max-w-md space-y-2 text-left">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {selectedCategories.length} categorías de gastos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}{" "}
              bancaria{accounts.length !== 1 ? "s" : ""}
            </li>
          </ul>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={handleComplete}
            size="lg"
            className="px-8"
            disabled={isLoading}
          >
            {isLoading ? "Completando..." : "Ir al Dashboard"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              {["welcome", "categories", "accounts", "complete"].map(
                (step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
                        currentStep === step
                          ? "bg-primary text-primary-foreground"
                          : index <
                              [
                                "welcome",
                                "categories",
                                "accounts",
                                "complete",
                              ].indexOf(currentStep)
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div
                        className={`mx-2 h-1 w-16 ${
                          index <
                          [
                            "welcome",
                            "categories",
                            "accounts",
                            "complete",
                          ].indexOf(currentStep)
                            ? "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Step content */}
        {currentStep === "welcome" && renderWelcomeStep()}
        {currentStep === "categories" && renderCategoriesStep()}
        {currentStep === "accounts" && renderAccountsStep()}
        {currentStep === "complete" && renderCompleteStep()}
      </div>
    </div>
  );
}
