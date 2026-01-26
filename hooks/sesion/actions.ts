"use server";

import { createClient } from "@/utils/supabase/server";

export interface UserRPCData {
  id: string;
  email: string;
  nombres: string | null;
  apellidos: string | null;
  rol: string | null;
  rol_id: number | null;
}

export async function getUserDataAction(): Promise<UserRPCData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("info_perfil")
    .select(
      `
      nombres,
      apellidos,
      rol_id,
      roles ( nombre )
    `,
    )
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const profileAny = profile as any;

  return {
    id: user.id,
    email: user.email || "",
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    rol: profileAny.roles?.nombre || null,
    rol_id: profile.rol_id,
  };
}
