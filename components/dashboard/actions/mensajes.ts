"use server";

import { createClient } from "@/utils/supabase/server";

export async function enviarMensajeAction(
  mensaje: string,
  publico_objetivo: string,
  usuarios_especificos: string[] = []
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sis_mensajes")
    .insert({
      mensaje,
      publico_objetivo,
      usuarios_especificos,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mensajeAplicaAlUsuario(
  mensaje: {
    publico_objetivo: string;
    usuarios_especificos?: string[] | null;
  },
  userId: string,
  nivelCompromiso: string,
) {
  if (mensaje.publico_objetivo === "Todos") return true;
  if (mensaje.publico_objetivo === "Usuarios Específicos") {
    return mensaje.usuarios_especificos?.includes(userId) ?? false;
  }
  return (
    mensaje.publico_objetivo?.toUpperCase() === nivelCompromiso?.toUpperCase()
  );
}

async function obtenerMensajesPendientesParaUsuario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  nivelCompromiso: string,
) {
  const { data: mensajes, error: errorMensaje } = await supabase
    .from("sis_mensajes")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (errorMensaje || !mensajes?.length) return [];

  const { data: lecturas } = await supabase
    .from("sis_mensajes_lecturas")
    .select("mensaje_id")
    .eq("user_id", userId);

  const leidosIds = new Set((lecturas || []).map((l) => l.mensaje_id));

  return mensajes.filter(
    (m) =>
      !leidosIds.has(m.id) && mensajeAplicaAlUsuario(m, userId, nivelCompromiso),
  );
}

export async function obtenerMensajePendienteAction(
  userId: string,
  nivelCompromiso: string
) {
  if (!userId) return null;

  const supabase = await createClient();
  const pendientes = await obtenerMensajesPendientesParaUsuario(
    supabase,
    userId,
    nivelCompromiso,
  );

  return pendientes[0] ?? null;
}

export async function contarMensajesPendientesAction(
  userId: string,
  nivelCompromiso: string,
) {
  if (!userId) return 0;

  const supabase = await createClient();
  const pendientes = await obtenerMensajesPendientesParaUsuario(
    supabase,
    userId,
    nivelCompromiso,
  );

  return pendientes.length;
}

export async function marcarLeidoAction(mensajeId: string, userId: string) {
  if (!userId || !mensajeId) return;

  const supabase = await createClient();

  const { error } = await supabase.from("sis_mensajes_lecturas").insert({
    mensaje_id: mensajeId,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function obtenerHistorialMensajesAction() {
  const supabase = await createClient();

  const { data: mensajes, error } = await supabase
    .from("sis_mensajes")
    .select(`
      *,
      sis_mensajes_lecturas (
        user_id,
        leido_en
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return mensajes;
}
