"use client";

import { signOutAction } from "@/app/actions/usuarios";
import Link from "next/link";
import { Button } from "./ui/button";
import useUserData from "@/hooks/sesion/useUserData";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import ConfiguracionModal from "./ConfiguracionModal";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function AuthButton() {
  const { email, nombres, apellidos, rol, cargando } = useUserData();
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

      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="flex items-center gap-2">
          {(rol === "ADMIN" || rol === "SUPER" || rol === "ADMINISTRADOR") && (
            <ConfiguracionModal />
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-full shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-5 w-5 ${
                isRefreshing ? "animate-spin" : "hover:rotate-180 transition-transform duration-500"
              }`}
            />
          </Button>
          <AnimatedThemeToggler 
            duration={600} 
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors" 
          />
        </div>

        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="h-8 px-4 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-xs md:text-sm font-semibold"
          >
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2 items-center">
      <Button
        asChild
        variant="ghost"
        className="h-10 px-5 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-xs md:text-sm font-semibold"
      >
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
      <AnimatedThemeToggler 
        variant="hexagon" 
        duration={600} 
        fromCenter 
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      />
    </div>
  );
}
