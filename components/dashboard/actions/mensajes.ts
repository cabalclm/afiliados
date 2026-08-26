"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { enviarNotificacionPush } from "@/lib/push";
import { fetchAllRows } from "@/lib/supabaseFetchAll";

interface EnviarMensajeInput {
  titulo?: string;
  mensaje: string;
  publico_objetivo: string;
  usuarios_especificos?: string[];
  ruta?: string;
}

function calcularNivel(
  conteo: number,
  metaCelula: number,
  metaMinima: number,
): string {
  if (conteo > metaCelula) return "Alto";
  if (conteo === metaCelula) return "Cumple";
  if (conteo >= metaMinima) return "Medio";
  return "Bajo";
}

/** Devuelve los user_id cuyo nivel de compromiso coincide con `nivel`. */
async function resolverUserIdsPorNivel(nivel: string): Promise<string[]> {
  const [configRes, perfilesRes, conteoRaw] = await Promise.all([
    supabaseAdmin
      .from("sis_configuracion")
      .select("meta_celula, meta_celula_minima")
      .single(),
    supabaseAdmin.from("info_perfil").select("user_id"),
    fetchAllRows<{ lider_id: string }>((from, to) =>
      supabaseAdmin
        .from("afiliados")
        .select("lider_id")
        .not("lider_id", "is", null)
        .range(from, to),
    ),
  ]);

  const metaCelula = configRes.data?.meta_celula ?? 15;
  const metaMinima = configRes.data?.meta_celula_minima ?? 10;

  const conteoMap = new Map<string, number>();
  conteoRaw.forEach((row) => {
    if (row.lider_id) {
      conteoMap.set(row.lider_id, (conteoMap.get(row.lider_id) || 0) + 1);
    }
  });

  return (perfilesRes.data || [])
    .map((p: any) => p.user_id as string)
    .filter(
      (uid) =>
        calcularNivel(conteoMap.get(uid) || 0, metaCelula, metaMinima).toUpperCase() ===
        nivel.toUpperCase(),
    );
}

type RolJoin = { nombre?: string } | { nombre?: string }[] | null | undefined;

function nombreRolDesdeJoin(roles: RolJoin): string {
  if (Array.isArray(roles)) return roles[0]?.nombre || "";
  return roles?.nombre || "";
}

function coincideRolFiltro(nombreRol: string, rolesUpper: Set<string>): boolean {
  const nombre = nombreRol.toUpperCase();
  if (rolesUpper.has(nombre)) return true;
  if (rolesUpper.has("EMPLEADO") && nombre === "TRABAJADOR") return true;
  if (rolesUpper.has("ADMINISTRADOR") && nombre === "ADMIN") return true;
  return false;
}

/** Devuelve los user_id cuyo rol (nombre) está en `roles`. */
async function resolverUserIdsPorRol(roles: string[]): Promise<string[]> {
  const rolesUpper = new Set(roles.map((r) => r.toUpperCase()));
  const { data, error } = await supabaseAdmin
    .from("info_perfil")
    .select("user_id, roles!inner ( nombre )");

  if (error) {
    console.error("[mensajes] Error resolviendo usuarios por rol:", error.message);
    return [];
  }

  type PerfilConRol = { user_id: string; roles: RolJoin };

  return ((data || []) as PerfilConRol[])
    .filter((p) =>
      coincideRolFiltro(nombreRolDesdeJoin(p.roles), rolesUpper),
    )
    .map((p) => p.user_id);
}

async function obtenerRolUsuario(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("info_perfil")
    .select("roles ( nombre )")
    .eq("user_id", userId)
    .maybeSingle();

  const roles = data?.roles as RolJoin;
  return nombreRolDesdeJoin(roles);
}

export async function enviarMensajeAction(
  input: EnviarMensajeInput,
) {
  const {
    titulo,
    mensaje,
    publico_objetivo,
    usuarios_especificos = [],
    ruta,
  } = input;

  const supabase = await createClient();

  const rutaFinal = ruta?.trim() || "/";

  const { data, error } = await supabase
    .from("sis_mensajes")
    .insert({
      titulo: titulo?.trim() || null,
      mensaje,
      publico_objetivo,
      usuarios_especificos,
      ruta: rutaFinal,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Notificación push a los involucrados (no debe romper el envío si falla)
  let push = { enviadas: 0, fallidas: 0 };
  try {
    let userIds: string[] | undefined;
    if (publico_objetivo === "Todos") {
      userIds = undefined;
    } else if (publico_objetivo === "Usuarios Específicos") {
      userIds = usuarios_especificos;
    } else if (publico_objetivo === "Lideres") {
      userIds = await resolverUserIdsPorRol(["LIDER"]);
    } else if (publico_objetivo === "Empleados") {
      userIds = await resolverUserIdsPorRol(["EMPLEADO", "TRABAJADOR"]);
    } else {
      userIds = await resolverUserIdsPorNivel(publico_objetivo);
    }

    push = await enviarNotificacionPush({
      titulo: titulo?.trim() || "Nueva difusión SOTE",
      mensaje,
      ruta: rutaFinal,
      userIds,
      tag: data.id,
    });
  } catch (pushError) {
    console.error("[mensajes] Error enviando notificación push:", pushError);
  }

  return { mensaje: data, push };
}

function mensajeAplicaAlUsuario(
  mensaje: {
    publico_objetivo: string;
    usuarios_especificos?: string[] | null;
  },
  userId: string,
  nivelCompromiso: string,
  rolUsuario: string,
) {
  if (mensaje.publico_objetivo === "Todos") return true;
  if (mensaje.publico_objetivo === "Usuarios Específicos") {
    return mensaje.usuarios_especificos?.includes(userId) ?? false;
  }
  if (mensaje.publico_objetivo === "Lideres") {
    return (rolUsuario || "").toUpperCase() === "LIDER";
  }
  if (mensaje.publico_objetivo === "Empleados") {
    const r = (rolUsuario || "").toUpperCase();
    return r === "EMPLEADO" || r === "TRABAJADOR";
  }
  return (
    mensaje.publico_objetivo?.toUpperCase() === nivelCompromiso?.toUpperCase()
  );
}

async function obtenerMensajesParaUsuario(
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

  const [{ data: lecturas }, rolUsuario] = await Promise.all([
    supabase
      .from("sis_mensajes_lecturas")
      .select("mensaje_id, leido_en")
      .eq("user_id", userId),
    obtenerRolUsuario(userId),
  ]);

  const lecturasPorMensaje = new Map(
    (lecturas || []).map((l) => [l.mensaje_id, l.leido_en]),
  );

  return mensajes
    .filter((m) =>
      mensajeAplicaAlUsuario(m, userId, nivelCompromiso, rolUsuario),
    )
    .map((m) => ({
      ...m,
      leido: lecturasPorMensaje.has(m.id),
      leido_en: lecturasPorMensaje.get(m.id) ?? null,
    }));
}

async function obtenerMensajesPendientesParaUsuario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  nivelCompromiso: string,
) {
  const mensajes = await obtenerMensajesParaUsuario(
    supabase,
    userId,
    nivelCompromiso,
  );

  return mensajes.filter((m) => !m.leido);
}

export async function obtenerMensajesUsuarioAction(
  userId: string,
  nivelCompromiso: string,
) {
  if (!userId) return [];

  const supabase = await createClient();
  return obtenerMensajesParaUsuario(supabase, userId, nivelCompromiso);
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
