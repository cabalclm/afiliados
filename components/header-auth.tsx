"use client";

import { signOutAction } from "@/app/actions/usuarios";
import Link from "next/link";
import { Button } from "./ui/button";
import useUserData from "@/hooks/sesion/useUserData";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function AuthButton() {
  const { email, nombres, apellidos, cargando } = useUserData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-end gap-1 ">
        <div className="flex flex-col items-end text-right leading-tight mb-1">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return email ? (
    <div className="flex flex-col items-end gap-1 ">
      <div className="flex flex-col items-end text-right leading-tight">
        <span className="text-xs md:text-xl font-bold">
          {nombres} {apellidos}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="outline"
            className="h-9 px-4 px-2 shrink-0 text-xs md:text-sm"
          >
            Cerrar Sesión
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-9 p-0 shrink-0"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-600 transition-all duration-500 ${
              isRefreshing ? "animate-spin" : "hover:rotate-180"
            }`}
          />
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2 ">
      <Button
        asChild
        variant="outline"
        className="h-9 px-4 text-xs md:text-sm"
      >
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
    </div>
  );
}
