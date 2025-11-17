import { type NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin'; 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rol = searchParams.get('rol');

  try {
    const { data, error } = await supabaseAdmin.rpc('obtener_usuarios', {
      rol_filtro: rol
    });

    if (error) {
      console.error('Error al obtener usuarios:', error);
      return NextResponse.json({ error: 'No se pudieron obtener los usuarios' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}