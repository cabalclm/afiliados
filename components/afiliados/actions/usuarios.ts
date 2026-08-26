"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { getCachedAuthUsers } from "./cache";

export async function listarUsuariosAction(rol_filtro?: string | string[]) {
  console.time("🔵 SERVER: listarUsuariosAction TOTAL");
  const supabase = await createClient();

  // Query directa a info_perfil con JOIN a roles — sin listUsers de Auth
  console.time("🔵 SERVER: query perfiles");
  const queryPerfiles = supabase
    .from("info_perfil")
    .select(`
      user_id, 
      nombres, 
      apellidos, 
      activo, 
      rol_id,
      roles!inner ( id, nombre )
    `)
    .order("nombres", { ascending: true });

  let filtroPerfiles = queryPerfiles;
  
  if (rol_filtro) {
    if (Array.isArray(rol_filtro)) {
      filtroPerfiles = queryPerfiles.in("roles.nombre", rol_filtro);
    } else {
      filtroPerfiles = queryPerfiles.eq("roles.nombre", rol_filtro);
    }
  }

  // Conteos paginados de TODAS las filas (límite Supabase = 1000).
  const [perfilesRes, afiliadosLiderIds] = await Promise.all([
    filtroPerfiles,
    fetchAllRows<{ lider_id: string | null }>((from, to) =>
      supabase.from("afiliados").select("lider_id").range(from, to),
    ),
  ]);
  console.timeEnd("🔵 SERVER: query perfiles");

  if (perfilesRes.error) throw new Error(perfilesRes.error.message);

  const perfiles = perfilesRes.data || [];
  console.log("🔵 SERVER: perfiles count:", perfiles.length);
  console.log("🔵 SERVER: afiliados count:", afiliadosLiderIds.length);
  const authUsers = await getCachedAuthUsers();
  const emailMap = new Map(
    authUsers.map((u) => [u.id, u.email || ""]),
  );

  // Conteo eficiente en memoria
  const conteoMap = new Map<string, number>();
  afiliadosLiderIds.forEach((row) => {
    if (row.lider_id) {
      conteoMap.set(row.lider_id, (conteoMap.get(row.lider_id) || 0) + 1);
    }
  });

  const result = perfiles.map((p: any) => ({
    id: p.user_id,
    email: emailMap.get(p.user_id) || "",
    nombres: p.nombres,
    apellidos: p.apellidos,
    activo: p.activo,
    rol: p.roles?.nombre,
    rol_id: p.rol_id,
    conteoAfiliados: conteoMap.get(p.user_id) || 0,
  }));
  console.timeEnd("🔵 SERVER: listarUsuariosAction TOTAL");
  return result;
}
