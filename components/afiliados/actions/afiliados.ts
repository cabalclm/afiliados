"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";

export async function obtenerAfiliadosAction(liderId?: string) {
  const supabase = await createClient();

  let query = supabase.from("afiliados").select("*");

  if (liderId) {
    query = query.eq("lider_id", liderId);
  }

  const { data: afiliados, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw new Error(error.message);
  if (!afiliados) return [];

  const liderIds = [
    ...new Set(afiliados.map((a) => a.lider_id).filter((id) => id)),
  ];
  const lugarIds = [
    ...new Set(afiliados.map((a) => a.lugar_id).filter((id) => id)),
  ];

  // Ejecución en paralelo de las consultas de apoyo
  const [perfilesRes, lugaresRes, usersRes] = await Promise.all([
    liderIds.length > 0
      ? supabase
          .from("info_perfil")
          .select("user_id, nombres, apellidos")
          .in("user_id", liderIds)
      : { data: [] },

    lugarIds.length > 0
      ? supabase.from("lugares_clm").select("id, nombre").in("id", lugarIds)
      : { data: [] },

    // Mantener listUsers pero con precaución
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
  ]);

  const perfiles = perfilesRes.data || [];
  const lugares = lugaresRes.data || [];
  const users = (usersRes as any)?.data?.users || [];

  const perfilMap = new Map(perfiles.map((p: any) => [p.user_id, p]));
  const lugarMap = new Map(lugares.map((l: any) => [l.id, l.nombre]));
  const userMap = new Map(users.map((u: any) => [u.id, u.email]));

  return afiliados.map((afiliado: any) => {
    const perfilLider = afiliado.lider_id
      ? perfilMap.get(afiliado.lider_id)
      : null;

    return {
      ...afiliado,
      lugar_nombre: afiliado.lugar_id
        ? lugarMap.get(afiliado.lugar_id) || null
        : null,
      lider_nombre: perfilLider
        ? `${perfilLider.nombres} ${perfilLider.apellidos}`
        : "Sin Líder",
      lider_email: afiliado.lider_id
        ? userMap.get(afiliado.lider_id) || ""
        : "",
    };
  });
}
