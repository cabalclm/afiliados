import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(request: Request) {
  const { id, nombre } = await request.json();

  if (!id || !nombre) {
     return NextResponse.json({ error: 'Faltan ID o nombre' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('roles')
    .update({ nombre })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar rol:', error.message);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}