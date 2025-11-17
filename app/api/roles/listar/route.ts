import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 

export async function GET() {
  const supabase = await createClient(); 
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al listar roles:', error);
    return NextResponse.json({ error: 'Error al cargar roles' }, { status: 500 });
  }

  return NextResponse.json({ roles });
}