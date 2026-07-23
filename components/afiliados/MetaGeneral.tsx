"use client";

import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { PiBriefcaseDuotone, PiMedalDuotone } from "react-icons/pi";
import { useQuery } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";

interface Props {
  totalSede: number;
  /** Miembros afiliados bajo líderes (barra de progreso). */
  totalLideres: number;
  totalTrabajadores: number;
  /** Usuarios con rol LIDER (leyenda). */
  usuariosLideres?: number;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalTrabajadores,
  usuariosLideres,
}: Props) {
  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const objetivoGeneral = config?.meta_general ?? 3000;
  const total = totalSede + totalLideres + totalTrabajadores;
  const pct = (n: number) => Math.min((n / objetivoGeneral) * 100, 100);
  const progreso = pct(total);

  return (
    <div className="mb-4 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="flex justify-between items-end gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-400">
          Meta General de Afiliación
        </span>
        <span className="text-sm md:text-base font-black text-blue-700 dark:text-blue-400 whitespace-nowrap">
          {total.toLocaleString()} / {objetivoGeneral.toLocaleString()}{" "}
          <span className="text-gray-500 dark:text-gray-400 font-bold">
            ({progreso.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden flex items-center relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(totalSede)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-blue-600 h-full shrink-0"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(totalLideres)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          className="bg-orange-500 h-full shrink-0"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(totalTrabajadores)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
          className="bg-violet-500 h-full shrink-0"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5 text-[11px] font-bold uppercase">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            Sede: {totalSede.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <PiMedalDuotone className="h-3.5 w-3.5 shrink-0" />
            Líderes: {(usuariosLideres ?? totalLideres).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <PiBriefcaseDuotone className="h-3.5 w-3.5 shrink-0" />
            Empleados: {totalTrabajadores.toLocaleString()}
          </span>
        </div>
        <span className="font-black text-gray-900 dark:text-gray-100 normal-case text-xs">
          Total: {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
