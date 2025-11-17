"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import supabaseAdmin from '@/utils/supabase/admin';

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

  // Validación actualizada para incluir campos nuevos
  if (!email || !password || !rol_id || !nombres || !apellidos || !telefono || !dpi || !nacimiento || !sexo) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Todos los campos son obligatorios.");
  }

  const { data: yaExiste, error: errorVerificacion } = await supabase.rpc(
    'correo_ya_registrado',
    { email_input: email }
  );

  if (errorVerificacion) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Error al verificar el correo.");
  }

  if (yaExiste) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Usuario ya registrado.");
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    return encodedRedirect("error", "/protected/admin/sign-up", error?.message || "No se pudo crear.");
  }

  const user_id = data.user.id;

  // Inserción actualizada para incluir teléfono, dpi, nacimiento y sexo
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
        rol_id: parseInt(rol_id, 10) 
    });

  if (errorPerfil) {
    console.error('Error al insertar en info_perfil:', errorPerfil);
    return encodedRedirect("error", "/protected/admin/sign-up", "Error al guardar perfil.");
  }

  return encodedRedirect("success", "/protected/admin/sign-up", "Usuario creado con éxito.");
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

    const mensaje = traduccionErrores[error.message] || error.message;
    return encodedRedirect('error', '/', mensaje);
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
    return encodedRedirect(
      'error',
      '/',
      'Error al iniciar sesión. Intenta más tarde, si el problema persiste contacta con Soporte Técnico.'
    );
  }

  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return encodedRedirect('error', '/', 'Tu cuenta está desactivada. Contacta con Soporte Técnico.');
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