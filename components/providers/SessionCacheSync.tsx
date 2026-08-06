"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

/**
 * Limpia el caché de React Query cuando cambia la sesión de Supabase,
 * para no mostrar datos del usuario anterior tras cerrar/iniciar sesión.
 */
export default function SessionCacheSync() {
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      lastUserIdRef.current = data.session?.user?.id ?? null;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const prevUserId = lastUserIdRef.current;
      const userChanged =
        prevUserId !== null &&
        nextUserId !== null &&
        prevUserId !== nextUserId;

      if (event === "SIGNED_OUT" || event === "SIGNED_IN" || userChanged) {
        queryClient.clear();
      }

      lastUserIdRef.current = nextUserId;
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
