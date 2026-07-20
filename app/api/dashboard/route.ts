import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getCachedAuthUsers } from "@/components/afiliados/actions/cache";

export async function GET() {
  console.time("🚀 API /api/dashboard TOTAL");
  const supabase = await createClient();

  // Leer sesión del JWT (sin llamada de red)
  console.time("🚀 getSession");
  const { data: { session } } = await supabase.auth.getSession();
  console.timeEnd("🚀 getSession");

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = session.user;

  // TODAS las queries en PARALELO
  console.time("🚀 queries");
  const [profileRes, perfilesRes, conteoRes, lugaresRes] = await Promise.all([
    supabase
      .from("info_perfil")
      .select("nombres, apellidos, rol_id, roles ( nombre )")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("info_perfil")
      .select("user_id, nombres, apellidos, activo, rol_id, roles!inner ( id, nombre )")
      .order("nombres", { ascending: true }),

    supabase.from("afiliados").select("lider_id").not("lider_id", "is", null),

    supabase.from("lugares_clm").select("id, nombre").order("nombre", { ascending: true }),
  ]);
  console.timeEnd("🚀 queries");

  const profileAny = profileRes.data as any;
  const sessionData = {
    id: user.id,
    email: user.email || "",
    nombres: profileRes.data?.nombres || "",
    apellidos: profileRes.data?.apellidos || "",
    rol: profileAny?.roles?.nombre || "",
    rol_id: profileRes.data?.rol_id || null,
  };

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

  console.timeEnd("🚀 API /api/dashboard TOTAL");

  return NextResponse.json({
    session: sessionData,
    usuarios,
    lugares: lugaresRes.data || [],
  });
}
