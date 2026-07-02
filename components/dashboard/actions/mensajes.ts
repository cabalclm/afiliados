"use server";

import { createClient } from "@/utils/supabase/server";

export async function enviarMensajeAction(
  mensaje: string,
  publico_objetivo: string,
  usuarios_especificos: string[] = []
) {
  const supabase = await createClient();

  // Desactivar todos los mensajes anteriores
  await supabase
    .from("sis_mensajes")
    .update({ activo: false })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Hack para actualizar todos

  // Crear el nuevo mensaje
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

export async function obtenerMensajePendienteAction(
  userId: string,
  nivelCompromiso: string
) {
  if (!userId) return null;

  const supabase = await createClient();

  // Obtener el mensaje activo
  const { data: mensajes, error: errorMensaje } = await supabase
    .from("sis_mensajes")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorMensaje || !mensajes || mensajes.length === 0) {
    return null; // No hay mensaje activo
  }

  const mensajeActivo = mensajes[0];

  // Verificar si ya lo leyó
  const { data: lectura } = await supabase
    .from("sis_mensajes_lecturas")
    .select("id")
    .eq("mensaje_id", mensajeActivo.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (lectura) {
    return null; // Ya lo leyó
  }

  // Verificar si el público objetivo coincide con el usuario
  let aplica = false;
  if (mensajeActivo.publico_objetivo === "Todos") {
    aplica = true;
  } else if (mensajeActivo.publico_objetivo === "Usuarios Específicos") {
    aplica = mensajeActivo.usuarios_especificos?.includes(userId);
  } else if (mensajeActivo.publico_objetivo?.toUpperCase() === nivelCompromiso?.toUpperCase()) {
    aplica = true;
  }

  if (aplica) {
    return mensajeActivo;
  }

  return null;
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
