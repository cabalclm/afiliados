"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import supabaseAdmin from '@/utils/supabase/admin';
import { revalidatePath } from "next/cache";

function encodeFormForRedirect(formData: FormData) {
    const dataToKeep = {
        nombres: formData.get("nombres")?.toString() || '',
        apellidos: formData.get("apellidos")?.toString() || '',
        telefono: formData.get("telefono")?.toString() || '',
        dpi: formData.get("dpi")?.toString() || '',
        nacimiento: formData.get("nacimiento")?.toString() || '',
        sexo: formData.get("sexo")?.toString() || 'M',
        email: formData.get("email")?.toString() || '',
        rol_id: formData.get("rol_id")?.toString() || '',
    };
    return encodeURIComponent(JSON.stringify(dataToKeep));
}

function redirectWithErrorAndData(message: string, formData: FormData) {
    const prevDataEncoded = encodeFormForRedirect(formData);
    const errorMsgEncoded = encodeURIComponent(message);
    
    const redirectPath = `/protected/admin?error=${errorMsgEncoded}&data=${prevDataEncoded}`;
    
    redirect(redirectPath);
}


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

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !rol_id || !nombres || !apellidos || !telefono || !dpi || !nacimiento || !sexo) {
    redirectWithErrorAndData("Todos los campos son obligatorios.", formData);
  }

  const { data: yaExiste, error: errorVerificacion } = await supabase.rpc(
    'correo_ya_registrado',
    { email_input: email }
  );

  if (errorVerificacion) {
    redirectWithErrorAndData("Error al verificar el correo.", formData);
  }

  if (yaExiste) {
    redirectWithErrorAndData(` ${email} ya esta registrado, elija un usuario diferente`, formData);
  }

  
  const { data: dpiAfiliados, error: errorAfiliados } = await supabase
    .from('afiliados')
    .select('id')
    .eq('dpi', dpi);

  if (errorAfiliados || dpiAfiliados === null) {
    redirectWithErrorAndData("Error al verificar DPI ya esta afiliado .", formData);
  }
  
  const { data: dpiPerfiles, error: errorPerfiles } = await supabase
    .from('info_perfil')
    .select('user_id')
    .eq('dpi', dpi);

  if (errorPerfiles || dpiPerfiles === null) {
    redirectWithErrorAndData("Error al verificar DPI en perfiles.", formData);
  }

  if (dpiPerfiles!.length > 0 ) {
    redirectWithErrorAndData("Este DPI ya se encuentra registrado a un LIDER.", formData);
  } else if(dpiAfiliados!.length > 0){
    redirectWithErrorAndData("Este DPI ya se encuentra registrado a un AFILIADO.", formData);
  }
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    redirectWithErrorAndData(error?.message || "No se pudo crear la cuenta de usuario.", formData);
  }

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
        rol_id: parseInt(rolIdValue, 10) 
    });

  if (errorPerfil) {
    console.error('Error al insertar en info_perfil:', errorPerfil);
    redirectWithErrorAndData("Error al guardar perfil.", formData);
  }

  return encodedRedirect("success", "/protected", "Usuario creado con éxito.");
};

export const signInAction = async (formData: FormData): Promise<{ error: string } | void> => {
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

    const mensaje = traduccionErrores[error.message] || error.message;
    return { error: mensaje };
  }

  const user = data?.user;

  const { data: perfil, error: errorPerfil } = await supabase
    .from('info_perfil')
    .select('activo') 
    .eq('user_id', user?.id)
    .single(); 

  if (errorPerfil) {
    console.error('Error al verificar estado del usuario:', errorPerfil);
    await supabase.auth.signOut();
    return { error: 'Error al iniciar sesión. Intenta más tarde, si el problema persiste contacta con Soporte Técnico.' };
  }

  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return { error: 'Tu cuenta está desactivada. Contacta con Soporte Técnico.' };
  }

  return redirect('/protected');
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect("error", "/reset-password", "La contraseña y la confirmación son requeridas");
  }

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/reset-password", "Las contraseñas no coinciden");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return encodedRedirect("error", "/reset-password", "La contraseña no pudo actualizarse");
  }

  return encodedRedirect("success", "/reset-password", "Contraseña restablecida");
};

export const signOutAction = async () => {
  const supabase = await createClient();
 
  await supabase.auth.signOut();

  return redirect("/");
};

export async function deleteUserAccountAction(userId: string) {
  if (!userId) {
    return { error: { message: "ID de usuario no proporcionado." } };
  }

  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error al eliminar usuario (admin):', error.message);
    return { error: { message: error.message } };
  }

  revalidatePath('/protected'); 
  return { error: null };
}