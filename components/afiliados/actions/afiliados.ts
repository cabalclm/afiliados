"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";

export async function obtenerAfiliadosAction() {
  const supabase = await createClient();

  const { data: afiliados, error } = await supabase
    .from("afiliados")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!afiliados) return [];

  const liderIds = [
    ...new Set(afiliados.map((a) => a.lider_id).filter((id) => id)),
  ];
  const lugarIds = [
    ...new Set(afiliados.map((a) => a.lugar_id).filter((id) => id)),
  ];

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

    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const perfiles = perfilesRes.data || [];
  const lugares = lugaresRes.data || [];
  const users = usersRes.data?.users || [];

  const perfilMap = new Map(perfiles.map((p: any) => [p.user_id, p]));
  const lugarMap = new Map(lugares.map((l: any) => [l.id, l.nombre]));
  const userMap = new Map(users.map((u) => [u.id, u.email]));

  return afiliados.map((afiliado: any) => {
    const perfilLider = afiliado.lider_id
      ? perfilMap.get(afiliado.lider_id)
      : null;

    return {
      ...afiliado,
      no_padron: afiliado.no_padron,

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
