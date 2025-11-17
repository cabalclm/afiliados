import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

interface UserData {
  id: string;
  email: string;
  nombre: string | null;
  rol: string | null;
  rol_id: number | null;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/protected');

  let rolEnMayusculas = '';
  if (user) {
    const { data, error: rpcError } = await supabase
      .rpc('get_userdata')
      .single<UserData>();

    if (rpcError) {
      console.error("Error al llamar RPC 'get_userdata' en middleware:", rpcError.message);
    }
    
    const rolNombre = data?.rol ?? '';
    rolEnMayusculas = rolNombre.toUpperCase();
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user && isProtectedRoute) {
      if (
        request.nextUrl.pathname.startsWith("/protected/admin/configs") &&
        !rolEnMayusculas.includes("SUPER")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (
        request.nextUrl.pathname.startsWith("/protected/admin") &&
        !rolEnMayusculas.includes("ADMIN") &&
        !rolEnMayusculas.includes("SUPER")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
  }
  
  if (user && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/protected", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}