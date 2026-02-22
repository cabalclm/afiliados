"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";

export async function listarUsuariosAction(rol_filtro?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("info_perfil")
    .select(
      `
      user_id, 
      nombres, 
      apellidos, 
      activo, 
      rol_id,
      roles!inner ( id, nombre )
    `,
    )
    .order("nombres", { ascending: true });

  if (rol_filtro) {
    query = query.eq("roles.nombre", rol_filtro);
  }

  const { data: perfiles, error } = await query;
  if (error) throw new Error(error.message);

  const {
    data: { users },
    error: authError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw new Error(authError.message);

  const { data: conteoRaw, error: countError } = await supabase
    .from("afiliados")
    .select("lider_id");

  if (countError) throw new Error(countError.message);

  const conteoMap = new Map();
  conteoRaw.forEach((row) => {
    if (row.lider_id) {
      conteoMap.set(row.lider_id, (conteoMap.get(row.lider_id) || 0) + 1);
    }
  });

  const userMap = new Map(users.map((u) => [u.id, u.email]));

  return perfiles.map((p: any) => ({
    id: p.user_id,
    email: userMap.get(p.user_id)?.replace(/@.*$/, "") || "",
    nombres: p.nombres,
    apellidos: p.apellidos,
    activo: p.activo,
    rol: p.roles?.nombre,
    rol_id: p.rol_id,
    conteoAfiliados: conteoMap.get(p.user_id) || 0,
  }));
}
