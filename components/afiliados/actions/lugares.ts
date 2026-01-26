"use server";

import { createClient } from "@/utils/supabase/server";

export async function obtenerLugaresAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lugares_clm")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
