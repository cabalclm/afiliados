"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAfiliadoAction(afiliadoId: string) {
    const supabase = await createClient();

    if (!afiliadoId) {
        return { error: { message: "ID de afiliado no proporcionado." } };
    }

    const { error } = await supabase
        .from('afiliados')
        .delete()
        .eq('id', afiliadoId);

    if (error) {
        console.error('Error al eliminar afiliado:', error.message);
        return { error: { message: error.message } };
    }
    
    revalidatePath('/protected'); 
    return { error: null };
}