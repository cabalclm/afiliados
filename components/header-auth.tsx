'use client';

import { signOutAction } from "@/app/actions/usuarios";
import Link from "next/link";
import { Button } from "./ui/button";
import useUserData from "@/hooks/sesion/useUserData";

export default function AuthButton() {
  const { email, nombres, apellidos, cargando } = useUserData();

  if (cargando) {
    return (
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded animate-pulse"></div>
      </div>
    );
  }

  return email ? (

    <div className="flex flex-col items-end gap-1"> 
      <div className="flex flex-col items-end text-right leading-tight">
        <span className="text-sm font-bold">
          {nombres} {apellidos}
        </span>
        <span className="text-xs text-gray-500 mb-1">
          {email}
        </span>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="h-7 px-3 text-xs">
          Cerrar Sesión
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
    </div>
  );
}