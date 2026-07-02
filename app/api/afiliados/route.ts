import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const liderId = searchParams.get("liderId");

  console.time(`⏱️ API /api/afiliados?liderId=${liderId}`);
  const supabase = await createClient();

  let query = supabase.from("afiliados").select("*");

  if (liderId) {
    query = query.eq("lider_id", liderId);
  }

  const { data: afiliados, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching afiliados:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!afiliados || afiliados.length === 0) {
    console.timeEnd(`⏱️ API /api/afiliados?liderId=${liderId}`);
    return NextResponse.json([]);
  }

  const liderIds = [
    ...new Set(afiliados.map((a) => a.lider_id).filter((id) => id)),
  ];
  const lugarIds = [
    ...new Set(afiliados.map((a) => a.lugar_id).filter((id) => id)),
  ];

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

  const result = afiliados.map((afiliado: any) => {
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

  console.timeEnd(`⏱️ API /api/afiliados?liderId=${liderId}`);
  return NextResponse.json(result);
}
