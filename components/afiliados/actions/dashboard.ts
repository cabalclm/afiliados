"use server";

import { createClient } from "@/utils/supabase/server";
import { getCachedAuthUsers } from "./cache";

/**
 * UN SOLO server action que trae TODO lo que necesita el dashboard.
 * 
 * OPTIMIZACIÓN CLAVE: Usa getSession() en vez de getUser().
 * - getUser() → hace una llamada HTTP a Supabase Auth (3-8 segundos de latencia)
 * - getSession() → lee la cookie JWT directamente (0ms de latencia)
 * 
 * Las 4 queries a la BD se ejecutan en PARALELO con Promise.all.
 */
export async function cargarDashboardAction() {
  console.time("🚀 TOTAL");
  const supabase = await createClient();

  // getSession() lee del JWT local — NO hace llamada de red
  console.time("🚀 getSession");
  const { data: { session } } = await supabase.auth.getSession();
  console.timeEnd("🚀 getSession");

  if (!session?.user) {
    console.timeEnd("🚀 TOTAL");
    return { error: "No hay sesión activa", session: null, usuarios: [], lugares: [] };
  }

  const user = session.user;

  // TODAS las queries en PARALELO — una sola ronda a la BD
  console.time("🚀 queries paralelas");
  const [profileRes, perfilesRes, conteoRes, lugaresRes] = await Promise.all([
    supabase
      .from("info_perfil")
      .select("nombres, apellidos, rol_id, roles ( nombre )")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("info_perfil")
      .select(`user_id, nombres, apellidos, activo, rol_id, roles!inner ( id, nombre )`)
      .order("nombres", { ascending: true }),

    supabase.from("afiliados").select("lider_id").not("lider_id", "is", null),

    supabase.from("lugares_clm").select("id, nombre").order("nombre", { ascending: true }),
  ]);
  console.timeEnd("🚀 queries paralelas");

  // Sesión
  const profileAny = profileRes.data as any;
  const sessionData = {
    id: user.id,
    email: user.email || "",
    nombres: profileRes.data?.nombres || "",
    apellidos: profileRes.data?.apellidos || "",
    rol: profileAny?.roles?.nombre || "",
    rol_id: profileRes.data?.rol_id || null,
  };

  // Usuarios con conteo
  const perfiles = perfilesRes.data || [];
  const conteoRaw = conteoRes.data || [];
  const authUsers = await getCachedAuthUsers();
  const emailMap = new Map(
    authUsers.map((u) => [u.id, u.email || ""]),
  );

  const conteoMap = new Map<string, number>();
  conteoRaw.forEach((row) => {
    if (row.lider_id) {
      conteoMap.set(row.lider_id, (conteoMap.get(row.lider_id) || 0) + 1);
    }
  });

  const usuarios = perfiles.map((p: any) => ({
    id: p.user_id,
    email: emailMap.get(p.user_id) || "",
    nombres: p.nombres,
    apellidos: p.apellidos,
    activo: p.activo,
    rol: p.roles?.nombre,
    rol_id: p.rol_id,
    conteoAfiliados: conteoMap.get(p.user_id) || 0,
  }));

  const lugares = lugaresRes.data || [];

  console.timeEnd("🚀 TOTAL");

  return {
    error: null,
    session: sessionData,
    usuarios,
    lugares,
  };
}
