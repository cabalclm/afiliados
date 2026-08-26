"use client";

import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { MorphHoverRow } from "@/components/ui/HoverMorphIcon";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  Award,
  Briefcase,
  BriefcaseBusiness,
  Building,
  Building2,
  ClipboardList,
  Landmark,
  Medal,
} from "lucide";
import { useEffect, useState } from "react";

function NumeroConteo({
  value,
  decimals = 0,
  className,
  suffix = "",
  delay = 0,
}: {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  delay?: number;
}) {
  const motionVal = useMotionValue(0);
  const [texto, setTexto] = useState(
    decimals
      ? (0).toFixed(decimals)
      : "0",
  );

  useEffect(() => {
    const formatear = (n: number) => {
      if (decimals > 0) {
        return n.toLocaleString("es-GT", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      return Math.round(n).toLocaleString("es-GT");
    };

    setTexto(formatear(motionVal.get()));
    const controls = animate(motionVal, value, {
      duration: 2.6,
      ease: "easeOut",
      delay,
      onUpdate: (v) => setTexto(formatear(v)),
    });
    return () => controls.stop();
  }, [value, decimals, delay, motionVal]);

  return (
    <span className={className}>
      {texto}
      {suffix}
    </span>
  );
}

interface Props {
  totalSede: number;
  /** Integrantes empadronados bajo líderes. */
  totalLideres: number;
  /** Integrantes empadronados bajo empleados. */
  totalTrabajadores: number;
  /** Integrantes empadronados bajo planilla. */
  totalPlanilla?: number;
  /** Total real de la tabla afiliados (si viene, se usa en vez de sumar segmentos). */
  totalGeneral?: number;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalTrabajadores,
  totalPlanilla = 0,
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
      : totalSede + totalLideres + totalTrabajadores + totalPlanilla;
  const pct = (n: number) => Math.min((n / objetivoGeneral) * 100, 100);
  const progreso = pct(total);
  const texto = "text-xs md:text-lg font-bold leading-snug";

  const items = [
    {
      key: "sede",
      label: "Sede",
      value: totalSede,
      idle: Building2,
      hover: Building,
      bar: "bg-blue-600",
      card: "border-blue-200/70 bg-blue-50/60 dark:border-blue-800/40 dark:bg-blue-950/25",
      iconWrap: "text-blue-700 dark:text-blue-300",
      valueColor: "text-blue-800 dark:text-blue-300",
      pctChip:
        "bg-white/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
      key: "planilla",
      label: "Planilla",
      value: totalPlanilla,
      idle: Landmark,
      hover: ClipboardList,
      bar: "bg-emerald-500",
      card: "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/25",
      iconWrap: "text-emerald-700 dark:text-emerald-300",
      valueColor: "text-emerald-800 dark:text-emerald-300",
      pctChip:
        "bg-white/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    {
      key: "empleados",
      label: "Empleados",
      value: totalTrabajadores,
      idle: Briefcase,
      hover: BriefcaseBusiness,
      bar: "bg-violet-500",
      card: "border-violet-200/70 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/25",
      iconWrap: "text-violet-700 dark:text-violet-300",
      valueColor: "text-violet-800 dark:text-violet-300",
      pctChip:
        "bg-white/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    },
    {
      key: "lideres",
      label: "Líderes",
      value: totalLideres,
      idle: Medal,
      hover: Award,
      bar: "bg-orange-500",
      card: "border-orange-200/70 bg-orange-50/60 dark:border-orange-800/40 dark:bg-orange-950/25",
      iconWrap: "text-orange-700 dark:text-orange-300",
      valueColor: "text-orange-800 dark:text-orange-300",
      pctChip:
        "bg-white/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    },
  ] as const;

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
          <NumeroConteo
            value={total}
            className="tabular-nums"
          />{" "}
          / {objetivoGeneral.toLocaleString("es-GT")}{" "}
          <span className="text-gray-500 dark:text-gray-400">
            (
            <NumeroConteo value={progreso} decimals={1} suffix="%" />
            )
          </span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden flex items-center relative">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ width: 0 }}
            animate={{ width: `${pct(item.value)}%` }}
            transition={{ duration: 2.6, ease: "easeOut", delay: i * 0.12 }}
            className={`${item.bar} h-full shrink-0`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-stretch justify-center gap-2">
        {items.map((item, i) => (
          <MorphHoverRow
            key={item.key}
            idle={item.idle}
            hover={item.hover}
            size={28}
            className={`flex w-full min-w-[148px] max-w-[210px] flex-1 items-center justify-start gap-2.5 rounded-xl border px-3 py-2.5 ${item.card}`}
            iconClassName={item.iconWrap}
          >
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {item.label}
              </span>
              <span className="mt-0.5 flex items-baseline justify-start gap-1.5">
                <NumeroConteo
                  value={item.value}
                  delay={i * 0.12}
                  className={`text-lg font-black tabular-nums leading-none md:text-xl ${item.valueColor}`}
                />
                <NumeroConteo
                  value={pct(item.value)}
                  decimals={1}
                  suffix="%"
                  delay={i * 0.12}
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${item.pctChip}`}
                />
              </span>
            </span>
          </MorphHoverRow>
        ))}
      </div>
    </div>
  );
}
