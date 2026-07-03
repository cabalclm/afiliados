"use client";

import { useCallback, useEffect, useState } from "react";
import {
  guardarSubscripcionAction,
  eliminarSubscripcionAction,
} from "@/app/actions/push";

const SW_URL = "/push/sw.js";
const SW_SCOPE = "/push/";
const ACTIVATION_TIMEOUT_MS = 20000;

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

function esIOSSinPWA(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const esIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const esPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  return esIOS && !esPWA;
}

async function obtenerVapidPublicKey(): Promise<string> {
  const embebida = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  if (embebida) return embebida;

  try {
    const res = await fetch("/api/push/vapid-public-key");
    if (!res.ok) return "";
    const data = await res.json();
    return data.publicKey || "";
  } catch {
    return "";
  }
}

function esperarActivacion(
  reg: ServiceWorkerRegistration,
): Promise<ServiceWorkerRegistration> {
  if (reg.active) return Promise.resolve(reg);

  return new Promise((resolve, reject) => {
    let intervalo: ReturnType<typeof setInterval> | undefined;

    const listo = () => {
      if (reg.active) {
        clearTimeout(timeout);
        if (intervalo) clearInterval(intervalo);
        resolve(reg);
      }
    };

    const timeout = setTimeout(() => {
      if (intervalo) clearInterval(intervalo);
      reject(new Error("timeout activando service worker"));
    }, ACTIVATION_TIMEOUT_MS);

    const worker = reg.installing || reg.waiting;
    if (worker) {
      worker.addEventListener("statechange", listo);
      listo();
    }

    reg.addEventListener("updatefound", () => {
      reg.installing?.addEventListener("statechange", listo);
    });

    intervalo = setInterval(listo, 250);
  });
}

/** SW dedicado a push (scope /push/). Convive con el SW de la PWA en /. */
async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  const existente = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existente?.active) return existente;

  if (existente) {
    return esperarActivacion(existente);
  }

  const reg = await navigator.serviceWorker.register(SW_URL, {
    scope: SW_SCOPE,
    updateViaCache: "none",
  });

  return esperarActivacion(reg);
}

async function comprobarSuscripcionActiva(): Promise<boolean> {
  if (Notification.permission !== "granted") return false;

  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    try {
      const sub = await reg.pushManager.getSubscription();
      if (sub) return true;
    } catch {
      /* siguiente registro */
    }
  }
  return false;
}

export default function usePushNotifications() {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [vapidKey, setVapidKey] = useState("");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const navegadorOk =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!navegadorOk) {
        if (!cancelado) {
          setSoportado(false);
          setCargando(false);
        }
        return;
      }

      const key = await obtenerVapidPublicKey();
      if (cancelado) return;

      if (!key) {
        console.warn("[push] Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el deploy");
        setSoportado(false);
        setCargando(false);
        return;
      }

      setVapidKey(key);
      setSoportado(true);

      try {
        const yaActivo = await comprobarSuscripcionActiva();
        if (!cancelado) setActivo(yaActivo);
      } catch (e) {
        console.error("[push] Error comprobando suscripción:", e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const activar = useCallback(async () => {
    if (!soportado || procesando || !vapidKey) return;

    if (esIOSSinPWA()) {
      return { ok: false, motivo: "ios-sin-pwa" as const };
    }

    setProcesando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setActivo(false);
        return { ok: false, motivo: "permiso-denegado" as const };
      }

      const reg = await ensurePushRegistration();

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
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
        navigator.userAgent,
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
  }, [soportado, procesando, vapidKey]);

  const desactivar = useCallback(async () => {
    if (!soportado || procesando) return;
    setProcesando(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
          await eliminarSubscripcionAction(endpoint).catch(() => {});
        }
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
