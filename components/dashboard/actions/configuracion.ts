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
  meta_general: number = 3000,
  meta_planilla: number = 100,
  meta_planilla_minima: number = 67
) {
  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("sis_configuracion")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    id: 1,
    nombre_candidato,
    lugar,
    frase,
    meta_celula,
    meta_celula_minima,
    meta_general,
    updated_at: new Date().toISOString(),
  };

  if (actual && Object.prototype.hasOwnProperty.call(actual, "meta_planilla")) {
    payload.meta_planilla = meta_planilla;
  }
  if (
    actual &&
    Object.prototype.hasOwnProperty.call(actual, "meta_planilla_minima")
  ) {
    payload.meta_planilla_minima = meta_planilla_minima;
  }

  const { data, error } = await supabase
    .from("sis_configuracion")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
