"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import supabaseAdmin from '@/utils/supabase/admin';
import { revalidatePath } from "next/cache";

export const deleteUserAccountAction = async (userId: string) => {
  if (!userId) return { error: "ID de usuario no proporcionado." };

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error al eliminar usuario (admin):', error.message);
    return { error: error.message };
  }

  revalidatePath('/dashboard/usuarios'); 
  return { success: "Usuario eliminado correctamente." };
};

export const updateUsuarioAction = async (formData: FormData) => {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const nombres = formData.get('nombres') as string;
  const apellidos = formData.get('apellidos') as string;
  const telefono = formData.get('telefono') as string;
  const dpi = formData.get('dpi') as string;
  const nacimiento = formData.get('nacimiento') as string;
  const sexo = formData.get('sexo') as string;
  const email = formData.get('email') as string;
  const rol_id = formData.get('rol_id') as string;
  const lugar_id = formData.get('lugar_id') as string;
  const password = formData.get('password') as string;

  const { error: updateError } = await supabase
    .from('info_perfil')
    .update({
      nombres,
      apellidos,
      telefono,
      dpi,
      nacimiento,
      sexo,
      rol_id: parseInt(rol_id),
      lugar_id: parseInt(lugar_id),
    })
    .eq('user_id', id);

  if (updateError) return { error: updateError.message };

  const authUpdateData: any = {};
  if (email) authUpdateData.email = email;
  if (password && password.trim() !== '') authUpdateData.password = password;

  if (Object.keys(authUpdateData).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData);
    if (authError) return { error: authError.message };
  }

  revalidatePath('/dashboard/usuarios');
  return { success: 'Usuario actualizado correctamente' };
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const nombres = formData.get("nombres")?.toString();
  const apellidos = formData.get("apellidos")?.toString();
  const telefono = formData.get("telefono")?.toString();
  const dpi = formData.get("dpi")?.toString();
  const nacimiento = formData.get("nacimiento")?.toString();
  const sexo = formData.get("sexo")?.toString();
  const rol_id = formData.get("rol_id")?.toString(); 
  const lugar_id = formData.get("lugar_id")?.toString(); 

  const supabase = await createClient();

  if (!email || !password || !rol_id || !nombres || !apellidos || !telefono || !dpi || !nacimiento || !sexo) {
    return { error: "Todos los campos son obligatorios." };
  }

  const { data: yaExiste, error: errorVerificacion } = await supabase.rpc(
    'correo_ya_registrado',
    { email_input: email }
  );

  if (errorVerificacion) return { error: "Error al verificar el correo." };
  if (yaExiste) return { error: `${email} ya está registrado.` };

  const { data: dpiAfiliados, error: errorAfiliados } = await supabase.from('afiliados').select('id').eq('dpi', dpi);
  if (errorAfiliados) return { error: "Error al verificar DPI en afiliados." };

  const { data: dpiPerfiles, error: errorPerfiles } = await supabase.from('info_perfil').select('user_id').eq('dpi', dpi);
  if (errorPerfiles) return { error: "Error al verificar DPI en perfiles." };

  if (dpiPerfiles && dpiPerfiles.length > 0) return { error: "Este DPI ya se encuentra registrado a un LIDER." };
  if (dpiAfiliados && dpiAfiliados.length > 0) return { error: "Este DPI ya se encuentra registrado a un AFILIADO." };
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) return { error: error?.message || "No se pudo crear la cuenta de usuario." };

  const user_id = data.user!.id; 
  const rolIdValue = rol_id ?? '';

  const { error: errorPerfil } = await supabase
    .from("info_perfil")
    .insert({ 
        user_id, 
        nombres,
        apellidos,
        telefono,
        dpi,
        nacimiento,
        sexo,
        activo: true, 
        rol_id: parseInt(rolIdValue, 10),
        lugar_id: lugar_id ? parseInt(lugar_id, 10) : null
    });

  if (errorPerfil) {
    console.error('Error al insertar en info_perfil:', errorPerfil);
    return { error: "Error al guardar perfil." };
  }

  revalidatePath('/dashboard/usuarios');
  return { success: "Usuario creado con éxito." };
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const traduccionErrores: Record<string, string> = {
      'Invalid login credentials': 'Correo o contraseña incorrectos.',
      'Email not confirmed': 'Debe confirmar su correo antes de iniciar sesión.',
      'User is banned': 'Este usuario ha sido suspendido.',
    };
    return { error: traduccionErrores[error.message] || error.message };
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from('info_perfil')
    .select('activo') 
    .eq('user_id', data.user?.id)
    .maybeSingle(); 

  if (errorPerfil || !perfil) {
    await supabase.auth.signOut();
    return { error: perfil ? 'Error de base de datos.' : 'No se encontró un perfil asociado.' };
  }

  if (!perfil.activo) {
    await supabase.auth.signOut();
    return { error: 'Tu cuenta está desactivada.' };
  }

  return redirect('/protected');
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) return { error: "Campos requeridos." };
  if (password !== confirmPassword) return { error: "Las contraseñas no coinciden." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Error al actualizar." };

  return { success: "Contraseña restablecida." };
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};