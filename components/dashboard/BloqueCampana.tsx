"use client";

import { useQuery } from "@tanstack/react-query";
import useUserData from "@/hooks/sesion/useUserData";
import { obtenerConfiguracionAction } from "./actions/configuracion";
import { titleMainClass } from "@/lib/tituloMarca";

type Props = {
  variant?: "page" | "header";
  className?: string;
};

export default function BloqueCampana({
  variant = "page",
  className = "",
}: Props) {
  const { cargando: cargandoRol } = useUserData();

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const enHeader = variant === "header";

  if (isLoading || cargandoRol) {
    return (
      <div
        className={`animate-pulse rounded-xl bg-[#06c]/10 ${
          enHeader ? "mx-auto h-12 w-full max-w-md" : "mb-2 h-16 w-full"
        } ${className}`}
      />
    );
  }

  if (!config) return null;

  const currentConfig = config || { nombre_candidato: "", lugar: "", frase: "" };
  const nombre = currentConfig.nombre_candidato?.trim() || "";
  const frase = currentConfig.frase?.trim() || "";
  const tituloPrincipal = nombre || frase || "Sin nombre asignado";
  const mostrarFraseDebajo = Boolean(nombre && frase && nombre !== frase);

  const tituloClass = enHeader
    ? `text-center text-base font-bold sm:text-lg lg:text-xl xl:text-2xl ${titleMainClass}`
    : `text-center text-xl sm:text-2xl md:text-3xl ${titleMainClass}`;

  const lugarClass = enHeader
    ? "text-xs font-bold uppercase tracking-wide text-[#06c] dark:text-[#99ccff] sm:text-sm lg:text-sm"
    : "text-sm font-bold uppercase tracking-wide text-[#06c] dark:text-[#99ccff] sm:text-base";

  return (
    <div
      className={`inline-flex max-w-full flex-col ${enHeader ? "items-center px-2" : "relative group"} ${className}`}
    >
      <h1 className={tituloClass}>{tituloPrincipal}</h1>

      {mostrarFraseDebajo && (
        <p
          className={`mt-1 px-2 text-center font-medium italic text-[#06c] dark:text-[#99ccff] ${
            enHeader ? "text-xs sm:text-sm" : "text-base sm:text-lg"
          }`}
        >
          &ldquo;{frase}&rdquo;
        </p>
      )}

      <div
        className={`flex w-full ${enHeader ? "mt-0.5 justify-center" : "mt-1 justify-end px-2"}`}
      >
        <span className={`flex items-center gap-2 ${lugarClass}`}>
          <span className="h-px w-5 bg-[#06c]/40 dark:bg-[#99ccff]/50 sm:w-6" />
          {currentConfig.lugar || "Sin lugar"}
        </span>
      </div>
    </div>
  );
}
