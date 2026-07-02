"use client";

import { useQuery } from "@tanstack/react-query";
import useUserData from "@/hooks/sesion/useUserData";
import { obtenerConfiguracionAction } from "./actions/configuracion";

export default function ConfiguracionSistema() {
  const { rol, cargando: cargandoRol } = useUserData();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  if (isLoading || cargandoRol) return <div className="h-16 w-full bg-blue-50/50 animate-pulse rounded-xl mb-2" />;
  
  if (!config) return null;

  const currentConfig = config || { nombre_candidato: "", lugar: "", frase: "" };

  return (
    <div className="mb-2 w-full transition-all duration-300">


        <div className="flex justify-center pb-5 w-full">
          <div className="flex flex-col relative group inline-flex max-w-full">
            <h1 className="text-2xl md:text-5xl font-bold text-center leading-tight bg-gradient-to-r from-blue-800 via-blue-400 to-blue-800 dark:from-blue-400 dark:via-blue-200 dark:to-blue-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-text-shine">
              {currentConfig.nombre_candidato || "Sin nombre asignado"}
            </h1>
            
            {currentConfig.frase && (
              <p className="mt-1 text-base md:text-lg text-blue-500 dark:text-blue-400 font-medium italic opacity-80 text-center">
                "{currentConfig.frase}"
              </p>
            )}

            <div className="flex justify-end mt-1 w-full">
              <span className="text-sm font-bold text-blue-300 dark:text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-[1px] w-6 bg-blue-200 dark:bg-blue-600"></span>
                {currentConfig.lugar || "Sin lugar"}
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}
