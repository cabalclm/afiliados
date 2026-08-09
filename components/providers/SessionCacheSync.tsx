"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

/**
 * Limpia el caché de React Query solo cuando la sesión realmente cambia
 * (cerrar sesión u otro usuario). No limpiar en SIGNED_IN / TOKEN_REFRESHED
 * del mismo usuario: en PWA al salir y volver Supabase reemite esos eventos
 * y borraría formularios/estado a medias.
 */
export default function SessionCacheSync() {
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      // Solo inicializa si aún no llegó un evento de auth.
      if (lastUserIdRef.current === undefined) {
        lastUserIdRef.current = data.session?.user?.id ?? null;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const prevUserId = lastUserIdRef.current;

      if (event === "SIGNED_OUT") {
        queryClient.clear();
        lastUserIdRef.current = null;
        return;
      }

      // Mismo usuario (p. ej. volver a la PWA / refresh de token): no tocar caché.
      if (
        prevUserId !== undefined &&
        prevUserId !== null &&
        nextUserId === prevUserId
      ) {
        return;
      }

      // Cambio real de usuario (o primer usuario distinto tras logout).
      if (
        nextUserId !== null &&
        prevUserId !== undefined &&
        prevUserId !== nextUserId
      ) {
        queryClient.clear();
      }

      lastUserIdRef.current = nextUserId;
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
