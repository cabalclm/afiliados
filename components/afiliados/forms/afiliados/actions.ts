"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function guardarAfiliadoAction(formData: any, idEditar?: string) {
  const supabase = await createClient();

  // 1. Validaciones previas (DPI duplicado)
  if (formData.dpi) {
    let query = supabase.from("afiliados").select("id").eq("dpi", formData.dpi);
    if (idEditar) query = query.neq("id", idEditar);

    const { data } = await query;
    if (data && data.length > 0) {
      return { error: "Este DPI ya está registrado.", field: "dpi" };
    }
  }

  // 2. Validaciones previas (No. Padrón duplicado)
  // Solo validamos si trae un valor
  if (formData.no_padron) {
    let query = supabase
      .from("afiliados")
      .select("id")
      .eq("no_padron", formData.no_padron);
    if (idEditar) query = query.neq("id", idEditar);

    const { data } = await query;
    if (data && data.length > 0) {
      return {
        error: "Este No. de Padrón ya está registrado.",
        field: "no_padron",
      };
    }
  }

  // 3. PREPARAR DATOS (Aquí estaba el problema)

  // Detectamos si escribió un número de padrón válido
  const tienePadron = formData.no_padron && formData.no_padron.trim() !== "";

  const dataToSend = {
    ...formData,
    // Si tiene padrón, FORZAMOS empadronado a true. Si no, usamos lo que venga en el form.
    empadronado: tienePadron ? true : formData.empadronado,

    // Si tiene padrón lo guardamos, si no, enviamos null
    no_padron: tienePadron ? formData.no_padron : null,

    politica: formData.politica || null,
  };

  // ❌ ELIMINÉ ESTA LÍNEA: delete dataToSend.no_padron; ❌
  // Al quitarla, ahora sí se enviará a Supabase.

  let result;
  if (idEditar) {
    result = await supabase
      .from("afiliados")
      .update(dataToSend)
      .eq("id", idEditar);
  } else {
    result = await supabase.from("afiliados").insert(dataToSend);
  }

  if (result.error) return { error: result.error.message };

  revalidatePath("/dashboard/afiliados");
  return { success: true };
}
