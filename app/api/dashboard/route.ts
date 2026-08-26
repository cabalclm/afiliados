import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getCachedAuthUsers } from "@/components/afiliados/actions/cache";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import {
  esRolAdminOSuper,
  esRolEmpleado,
  esRolPlanilla,
  esUsuarioSede,
} from "@/components/afiliados/esquemas";

export async function GET() {
  console.time("🚀 API /api/dashboard TOTAL");
  const supabase = await createClient();

  // Leer sesión del JWT (sin llamada de red)
  console.time("🚀 getSession");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.timeEnd("🚀 getSession");

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = session.user;

  // TODAS las queries en PARALELO
  // Afiliados: paginar TODAS las filas (límite default Supabase = 1000).
  console.time("🚀 queries");
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
          "user_id, nombres, apellidos, activo, rol_id, roles!inner ( id, nombre )",
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

  // Meta = TODOS los registros de la tabla afiliados, clasificados por responsable.
  const porId = new Map(usuarios.map((u) => [u.id, u]));
  let sede = 0;
  let lideres = 0;
  let trabajadores = 0;
  let planilla = 0;

  for (const row of afiliadosLiderIds) {
    const lid = row.lider_id;
    const responsable = lid ? porId.get(lid) : undefined;

    if (responsable && esUsuarioSede(responsable)) {
      sede++;
    } else if (
      responsable &&
      (esRolEmpleado(responsable.rol) || esRolAdminOSuper(responsable.rol))
    ) {
      // Empleados + afiliados hechos por Admin/Super → bucket Empleados.
      trabajadores++;
    } else if (responsable && esRolPlanilla(responsable.rol)) {
      planilla++;
    } else {
      // Líder, sin líder o responsable ya no en perfiles.
      lideres++;
    }
  }

  const meta = {
    total: afiliadosLiderIds.length,
    sede,
    lideres,
    trabajadores,
    planilla,
  };

  console.timeEnd("🚀 API /api/dashboard TOTAL");

  return NextResponse.json({
    session: sessionData,
    usuarios,
    lugares: lugaresRes.data || [],
    meta,
  });
}
