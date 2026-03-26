import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/protected");

  let rolEnMayusculas = "";
  if (user) {
    const { data: profile } = await supabase
      .from("info_perfil")
      .select(
        `
        roles ( nombre )
      `,
      )
      .eq("user_id", user.id)
      .single();

    const rolNombre = (profile as any)?.roles?.nombre ?? "";
    rolEnMayusculas = rolNombre.toUpperCase();
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
