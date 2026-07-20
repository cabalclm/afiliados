"use client";

import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { PiBriefcaseDuotone, PiCrownDuotone } from "react-icons/pi";

const OBJETIVO_GENERAL = 2250;

interface Props {
  totalSede: number;
  totalLideres: number;
  totalTrabajadores: number;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalTrabajadores,
}: Props) {
  const total = totalSede + totalLideres + totalTrabajadores;
  const pct = (n: number) => Math.min((n / OBJETIVO_GENERAL) * 100, 100);
  const progreso = pct(total);

  return (
    <div className="mb-4 w-full space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 font-sans">
          Meta General de Afiliación
        </span>
        <span className="text-sm font-black text-blue-700 dark:text-blue-400">
          {total.toLocaleString()} / {OBJETIVO_GENERAL.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden flex items-center relative">
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
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase">
        <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          Sede: {totalSede.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
          <PiCrownDuotone className="h-3.5 w-3.5 shrink-0" />
          Líderes: {totalLideres.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
          <PiBriefcaseDuotone className="h-3.5 w-3.5 shrink-0" />
          Trabajadores: {totalTrabajadores.toLocaleString()}
        </span>
        <span className="font-black text-gray-900 dark:text-gray-100 normal-case">
          Total: {total.toLocaleString()} ({progreso.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
