"use client";

import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { PiBriefcaseDuotone, PiMedalDuotone } from "react-icons/pi";

interface Props {
  totalSede: number;
  /** Integrantes empadronados bajo líderes. */
  totalLideres: number;
  /** Integrantes empadronados bajo empleados. */
  totalTrabajadores: number;
  /** Total real de la tabla afiliados (si viene, se usa en vez de sumar segmentos). */
  totalGeneral?: number;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalTrabajadores,
  totalGeneral,
}: Props) {
  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const objetivoGeneral = config?.meta_general ?? 3000;
  const total =
    typeof totalGeneral === "number"
      ? totalGeneral
      : totalSede + totalLideres + totalTrabajadores;
  const pct = (n: number) => Math.min((n / objetivoGeneral) * 100, 100);
  const progreso = pct(total);
  const texto = "text-xs md:text-lg font-bold leading-snug";

  return (
    <div className="mb-4 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <span
          className={`${texto} uppercase tracking-wide text-blue-800 dark:text-blue-400`}
        >
          Meta General de Afiliación
        </span>
        <span
          className={`${texto} text-blue-700 dark:text-blue-400 whitespace-nowrap`}
        >
          {total.toLocaleString()} / {objetivoGeneral.toLocaleString()}{" "}
          <span className="text-gray-500 dark:text-gray-400">
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
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-blue-700 dark:text-blue-400`}
          >
            <Building2 className="size-5 shrink-0" />
            Sede: {totalSede.toLocaleString()}
          </span>
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-orange-600 dark:text-orange-400`}
          >
            <PiMedalDuotone className="size-5 shrink-0" />
            Líderes: {totalLideres.toLocaleString()}
          </span>
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-violet-600 dark:text-violet-400`}
          >
            <PiBriefcaseDuotone className="size-5 shrink-0" />
            Empleados: {totalTrabajadores.toLocaleString()}
          </span>
      </div>
    </div>
  );
}
