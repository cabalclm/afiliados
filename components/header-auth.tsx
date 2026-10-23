"use client";

import { signOutAction } from "@/app/actions/usuarios";
import Link from "next/link";
import { Button } from "./ui/button";
import useUserData from "@/hooks/sesion/useUserData";
import Swal from "@/lib/swal";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import ConfiguracionModal from "./ConfiguracionModal";
import NotificationBell from "./NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function AuthButton() {
  const { email, nombres, apellidos, rol, cargando } = useUserData();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      customClass: {
        popup: "swal-logout-popup",
        actions: "swal-logout-actions",
        confirmButton: "swal-logout-confirm",
        cancelButton: "swal-logout-cancel",
      },
    });

    if (!result.isConfirmed) return;

    setIsSigningOut(true);
    queryClient.clear();
    await signOutAction();
    router.refresh();
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-end gap-1 ">
        <div className="flex flex-col items-end text-right leading-tight mb-1">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return email ? (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className="max-w-[11rem] truncate text-right text-sm font-bold leading-snug sm:max-w-none sm:text-base lg:text-sm"
        title={`${nombres} ${apellidos}`.trim()}
      >
        {nombres} {apellidos}
      </span>

      <div className="mt-0.5 flex items-center gap-0.5 sm:gap-1.5">
        {(rol === "ADMIN" || rol === "SUPER" || rol === "ADMINISTRADOR") && (
          <ConfiguracionModal />
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-full p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 sm:h-10 sm:w-10 lg:h-9 lg:w-9"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 ${
              isRefreshing ? "animate-spin" : "hover:rotate-180 transition-transform duration-500"
            }`}
          />
        </Button>
        <NotificationBell />
        <AnimatedThemeToggler
          duration={600}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100 sm:h-10 sm:w-10 lg:h-9 lg:w-9 [&_svg]:h-5 [&_svg]:w-5"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mt-0.5 h-8 rounded-full px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 sm:h-9 sm:px-3.5 sm:text-sm lg:h-8 lg:px-2.5 lg:text-xs"
      >
        {isSigningOut ? "Cerrando..." : "Cerrar Sesión"}
      </Button>
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
        className="h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      />
    </div>
  );
}
