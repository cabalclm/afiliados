"use server";

import { createClient } from "@/utils/supabase/server";

export async function obtenerConfiguracionAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sis_configuracion")
    .select("*")
    .single();

  if (error) {
    console.error("Error al obtener configuración:", error.message);
    return null;
  }

  return data;
}

export async function actualizarConfiguracionAction(
  nombre_candidato: string,
  lugar: string,
  frase: string,
  meta_celula: number = 15,
  meta_celula_minima: number = 10,
  meta_general: number = 3000
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sis_configuracion")
    .upsert({ 
      id: 1, 
      nombre_candidato, 
      lugar, 
      frase,
      meta_celula,
      meta_celula_minima,
      meta_general,
      updated_at: new Date().toISOString() 
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
