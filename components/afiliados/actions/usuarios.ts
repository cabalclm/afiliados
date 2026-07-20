"use server";

import { createClient } from "@/utils/supabase/server";
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

  // Ejecutamos las dos queries en paralelo — ambas son rápidas (< 500ms)
  const [perfilesRes, conteoRes] = await Promise.all([
    filtroPerfiles,
    supabase.from("afiliados").select("lider_id").not("lider_id", "is", null)
  ]);
  console.timeEnd("🔵 SERVER: query perfiles");

  if (perfilesRes.error) throw new Error(perfilesRes.error.message);
  if (conteoRes.error) throw new Error(conteoRes.error.message);

  const perfiles = perfilesRes.data || [];
  console.log("🔵 SERVER: perfiles count:", perfiles.length);
  const conteoRaw = conteoRes.data || [];
  console.log("🔵 SERVER: conteoRaw count:", conteoRaw.length);
  const authUsers = await getCachedAuthUsers();
  const emailMap = new Map(
    authUsers.map((u) => [u.id, u.email || ""]),
  );

  // Conteo eficiente en memoria
  const conteoMap = new Map<string, number>();
  conteoRaw.forEach((row) => {
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
