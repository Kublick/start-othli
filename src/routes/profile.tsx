import { createFileRoute } from "@tanstack/react-router";
import { Camera, Mail, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/store";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = () => {
    // TODO: Implement profile update API call
    toast.success("Perfil actualizado correctamente");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  return (
    <DashboardLayout title="Perfil">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Perfil</CardTitle>
            <CardDescription>
              Gestiona tu información personal y configuración de cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user?.image || "/avatar_image.png"}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="text-lg">
                    {user?.name?.[0] || user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() =>
                    toast.info("Función de cambio de avatar próximamente")
                  }
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {user?.name || "Usuario"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Guardar cambios</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Cuenta</CardTitle>
            <CardDescription>
              Configuración adicional y preferencias de la cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Cambiar contraseña</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Actualiza tu contraseña para mantener tu cuenta segura
              </p>
              <Button
                variant="outline"
                onClick={() => toast.info("Función próximamente")}
              >
                Cambiar contraseña
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Eliminar cuenta</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Elimina permanentemente tu cuenta y todos los datos asociados
              </p>
              <Button
                variant="destructive"
                onClick={() => toast.error("Función próximamente")}
              >
                Eliminar cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
