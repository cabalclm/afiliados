"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchAllRows } from "@/lib/supabaseFetchAll";

export async function obtenerAfiliadosAction(liderId?: string) {
  const supabase = await createClient();

  // Paginar: Supabase limita a 1000 filas por request.
  const afiliados = await fetchAllRows<Record<string, unknown>>((from, to) => {
    let query = supabase.from("afiliados").select("*");
    if (liderId) {
      query = query.eq("lider_id", liderId);
    }
    return query.order("created_at", { ascending: false }).range(from, to);
  });

  if (afiliados.length === 0) return [];

  const liderIds = [
    ...new Set(afiliados.map((a) => a.lider_id as string | null).filter((id): id is string => !!id)),
  ];
  const lugarIds = [
    ...new Set(
      afiliados
        .map((a) => a.lugar_id as number | null)
        .filter((id): id is number => id != null),
    ),
  ];

  // Solo queries directas a Supabase — sin listUsers de Auth
  const [perfilesRes, lugaresRes] = await Promise.all([
    liderIds.length > 0
      ? supabase
          .from("info_perfil")
          .select("user_id, nombres, apellidos")
          .in("user_id", liderIds)
      : { data: [] },

    lugarIds.length > 0
      ? supabase.from("lugares_clm").select("id, nombre").in("id", lugarIds)
      : { data: [] },
  ]);

  const perfiles = perfilesRes.data || [];
  const lugares = lugaresRes.data || [];

  const perfilMap = new Map(perfiles.map((p: any) => [p.user_id, p]));
  const lugarMap = new Map(lugares.map((l: any) => [l.id, l.nombre]));

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
      lider_email: "",
    };
  });
}
