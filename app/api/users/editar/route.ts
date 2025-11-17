import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(req: Request) {
  try {
    const { id, email, nombres, apellidos, rol: rol_id, password, activo } = await req.json();

    if (!id || !email || !nombres || !apellidos || rol_id === undefined) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const { data: authActual, error: errorAuthActual } = await supabaseAdmin.auth.admin.getUserById(id);

    if (errorAuthActual || !authActual?.user) {
      return NextResponse.json({ error: 'No se pudo encontrar al usuario' }, { status: 500 });
    }

    const updateData: any = { email };
    if (password) updateData.password = password;

    const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (errorAuth) {
      console.error('Error al actualizar auth:', errorAuth);
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
    }

    const { error: errorPerfil } = await supabaseAdmin
      .from('info_perfil')
      .update({ nombres, apellidos, activo, rol_id: rol_id })
      .eq('user_id', id);

    if (errorPerfil) {
      console.error('Error al actualizar perfil:', errorPerfil);
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}