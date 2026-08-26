"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { esRolAdminOSuper, esRolEmpleado, esUsuarioSede } from "../esquemas";
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.timeEnd("🚀 getSession");

  if (!session?.user) {
    console.timeEnd("🚀 TOTAL");
    return {
      error: "No hay sesión activa",
      session: null,
      usuarios: [],
      lugares: [],
      meta: { total: 0, sede: 0, lideres: 0, trabajadores: 0 },
    };
  }

  const user = session.user;

  // TODAS las queries en PARALELO — una sola ronda a la BD
  console.time("🚀 queries paralelas");
  const [profileRes, perfilesRes, afiliadosLiderIds, lugaresRes] =
    await Promise.all([
      supabase
        .from("info_perfil")
        .select("nombres, apellidos, rol_id, roles ( nombre )")
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("info_perfil")
        .select(
          `user_id, nombres, apellidos, activo, rol_id, roles!inner ( id, nombre )`,
        )
        .order("nombres", { ascending: true }),

      fetchAllRows<{ lider_id: string | null }>((from, to) =>
        supabase.from("afiliados").select("lider_id").range(from, to),
      ),

      supabase
        .from("lugares_clm")
        .select("id, nombre")
        .order("nombre", { ascending: true }),
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
  const authUsers = await getCachedAuthUsers();
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email || ""]));

  const conteoMap = new Map<string, number>();
  for (const row of afiliadosLiderIds) {
    if (row.lider_id) {
      conteoMap.set(row.lider_id, (conteoMap.get(row.lider_id) || 0) + 1);
    }
  }

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

  const porId = new Map(usuarios.map((u) => [u.id, u]));
  let sede = 0;
  let lideres = 0;
  let trabajadores = 0;

  for (const row of afiliadosLiderIds) {
    const lid = row.lider_id;
    const responsable = lid ? porId.get(lid) : undefined;

    if (responsable && esUsuarioSede(responsable)) {
      sede++;
    } else if (
      responsable &&
      (esRolEmpleado(responsable.rol) || esRolAdminOSuper(responsable.rol))
    ) {
      trabajadores++;
    } else {
      lideres++;
    }
  }

  const meta = {
    total: afiliadosLiderIds.length,
    sede,
    lideres,
    trabajadores,
  };

  const lugares = lugaresRes.data || [];

  console.timeEnd("🚀 TOTAL");

  return {
    error: null,
    session: sessionData,
    usuarios,
    lugares,
    meta,
  };
}
