import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/protected");

  // Rutas públicas y assets: no verificar nada
  if (!isProtectedRoute && pathname !== "/") {
    return response;
  }

  // API routes dentro de /api: dejar pasar (la autenticación se hace dentro)
  if (pathname.startsWith("/api/")) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No autenticado + ruta protegida → redirigir al login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Autenticado en "/" → redirigir a /protected
  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/protected", request.url));
  }

  // Solo consultar rol si la ruta lo requiere (admin/configs o admin)
  if (user && pathname.startsWith("/protected/admin")) {
    const { data: profile } = await supabase
      .from("info_perfil")
      .select("roles ( nombre )")
      .eq("user_id", user.id)
      .single();

    const rolNombre = ((profile as any)?.roles?.nombre ?? "").toUpperCase();

    if (
      pathname.startsWith("/protected/admin/configs") &&
      !rolNombre.includes("SUPER")
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (
      !rolNombre.includes("ADMIN") &&
      !rolNombre.includes("SUPER")
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
