"use client";

import { useCallback, useEffect, useState } from "react";
import {
  guardarSubscripcionAction,
  eliminarSubscripcionAction,
} from "@/app/actions/push";

const SW_URL = "/push-sw.js";
const SW_SCOPE = "/push/";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existente = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existente) return existente;
  return navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
}

export default function usePushNotifications() {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const esSoportado =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;

    setSoportado(esSoportado);

    if (!esSoportado) {
      setCargando(false);
      return;
    }

    (async () => {
      try {
        const reg = await getRegistration();
        const sub = await reg.pushManager.getSubscription();
        setActivo(!!sub && Notification.permission === "granted");
      } catch (e) {
        console.error("[push] Error comprobando suscripción:", e);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const activar = useCallback(async () => {
    if (!soportado || procesando) return;
    setProcesando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setActivo(false);
        return { ok: false, motivo: "permiso-denegado" as const };
      }

      const reg = await getRegistration();
      await navigator.serviceWorker.ready.catch(() => {});

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      await guardarSubscripcionAction(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh || "",
            auth: json.keys?.auth || "",
          },
        },
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      );

      setActivo(true);
      return { ok: true as const };
    } catch (e) {
      console.error("[push] Error activando notificaciones:", e);
      setActivo(false);
      return { ok: false, motivo: "error" as const };
    } finally {
      setProcesando(false);
    }
  }, [soportado, procesando]);

  const desactivar = useCallback(async () => {
    if (!soportado || procesando) return;
    setProcesando(true);
    try {
      const reg = await getRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        await eliminarSubscripcionAction(endpoint).catch(() => {});
      }
      setActivo(false);
      return { ok: true as const };
    } catch (e) {
      console.error("[push] Error desactivando notificaciones:", e);
      return { ok: false as const };
    } finally {
      setProcesando(false);
    }
  }, [soportado, procesando]);

  const toggle = useCallback(async () => {
    return activo ? desactivar() : activar();
  }, [activo, activar, desactivar]);

  return { soportado, activo, cargando, procesando, activar, desactivar, toggle };
}
