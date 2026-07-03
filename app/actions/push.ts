"use server";

import { createClient } from "@/utils/supabase/server";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/** Guarda (o actualiza) la suscripción push del usuario en sesión. */
export async function guardarSubscripcionAction(
  sub: PushSubscriptionInput,
  userAgent?: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No hay sesión activa");
  }

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw new Error("Suscripción inválida");
  }

  const { error } = await supabase.from("sis_push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

/** Elimina la suscripción por endpoint (al desactivar en este dispositivo). */
export async function eliminarSubscripcionAction(endpoint: string) {
  if (!endpoint) return { ok: true };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: true };

  const { error } = await supabase
    .from("sis_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}
