"use client";

import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "./ui/button";
import usePushNotifications from "@/hooks/usePushNotifications";

export default function NotificationBell() {
  const { soportado, activo, cargando, procesando, toggle } =
    usePushNotifications();

  if (!soportado) return null;

  const handleClick = async () => {
    const prevActivo = activo;
    const res = await toggle();
    if (!res) return;

    if (res.ok) {
      toast.success(
        prevActivo
          ? "Notificaciones desactivadas en este dispositivo"
          : "Notificaciones activadas en este dispositivo",
      );
    } else if ("motivo" in res && res.motivo === "permiso-denegado") {
      toast.warning(
        "Permiso de notificaciones denegado. Actívalo en los ajustes del navegador.",
      );
    } else {
      toast.error("No se pudieron activar las notificaciones");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={cargando || procesando}
      title={
        cargando
          ? "Cargando notificaciones…"
          : activo
            ? "Notificaciones activadas · click para desactivar"
            : "Activar notificaciones en este dispositivo"
      }
      aria-label="Notificaciones"
      className={`relative h-10 w-10 p-0 rounded-full shrink-0 transition-colors ${
        activo
          ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      }`}
    >
      {procesando || cargando ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : activo ? (
        <>
          <BellRing className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-yellow-500 ring-2 ring-white dark:ring-neutral-900" />
        </>
      ) : (
        <Bell className="h-5 w-5" />
      )}
    </Button>
  );
}
