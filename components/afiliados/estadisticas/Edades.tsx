"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import type { Afiliado } from "../esquemas";
import { calcularEdadAnios } from "@/utils/formatoFechaGT";
import { chartStyles, useChartTheme } from "./utils";

interface Props {
  afiliados: Afiliado[];
}

export default function Edades({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | undefined>();
  const [pinnedIndex, setPinnedIndex] = useState<number | undefined>();
  const theme = useChartTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rangos = useMemo(() => {
    const data = [
      { name: "Jóvenes (18-30)", min: 18, max: 30, hombres: 0, mujeres: 0 },
      { name: "Adultos (31-60)", min: 31, max: 60, hombres: 0, mujeres: 0 },
      { name: "Mayores (61+)", min: 61, max: 150, hombres: 0, mujeres: 0 },
    ];

    afiliados.forEach((af) => {
      const edad = calcularEdadAnios(af.nacimiento);
      if (edad === null) return;
      const rango = data.find((r) => edad >= r.min && edad <= r.max);
      if (rango) {
        if (af.sexo === "M") rango.hombres++;
        else rango.mujeres++;
      }
    });

    return data;
  }, [afiliados]);

  const activeIndex = hoverIndex ?? pinnedIndex;

  const totales = useMemo(
    () => ({
      hombres: rangos.reduce((sum, r) => sum + r.hombres, 0),
      mujeres: rangos.reduce((sum, r) => sum + r.mujeres, 0),
    }),
    [rangos],
  );

  const totalGeneral = totales.hombres + totales.mujeres;
  const pctTotalH =
    totalGeneral > 0 ? (totales.hombres / totalGeneral) * 100 : 0;
  const pctTotalM =
    totalGeneral > 0 ? (totales.mujeres / totalGeneral) * 100 : 0;

  const fmtPct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

  const handleBarClick = (_: unknown, index: number) => {
    setPinnedIndex((prev) => (prev === index ? undefined : index));
  };

  const handleRowClick = (index: number) => {
    setPinnedIndex((prev) => (prev === index ? undefined : index));
  };

  const handleBarEnter = (_: unknown, index: number) => {
    setHoverIndex(index);
  };

  const handleInteractionLeave = () => {
    setHoverIndex(undefined);
  };

  return (
    <div className={`${chartStyles.cardCompact} h-full`}>
      <div className="mb-4 shrink-0">
        <h4 className={chartStyles.headerTitleSm}>Demografía del Grupo</h4>
        <p className={chartStyles.headerSubtitle}>
          Distribución por rangos de edad y género
        </p>
      </div>

      <div onMouseLeave={handleInteractionLeave}>
        <div className="h-[280px] w-full shrink-0 md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rangos}
              margin={{ top: 24, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.gridStroke}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fontWeight: 700, fill: theme.axisLabel }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: theme.axisTick }}
                tickFormatter={(value) => String(Math.round(Number(value)))}
                domain={[0, (max: number) => Math.ceil(max * 1.05) || 1]}
              />
              <Legend
                verticalAlign="top"
                height={40}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "9px",
                  color: theme.axisTick,
                }}
              />
              <Bar
                dataKey="hombres"
                name="Hombres"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                barSize={isMobile ? 22 : 48}
                isAnimationActive={false}
                activeBar={false}
                className="cursor-pointer"
                onClick={handleBarClick}
                onMouseEnter={handleBarEnter}
              >
                {rangos.map((_, index) => (
                  <Cell
                    key={`h-${index}`}
                    fill={
                      activeIndex === undefined || activeIndex === index
                        ? "#3b82f6"
                        : "#93c5fd"
                    }
                  />
                ))}
                <LabelList
                  dataKey="hombres"
                  position="top"
                  fill={theme.hombreLabel}
                  fontSize={9}
                  fontWeight={900}
                />
              </Bar>
              <Bar
                dataKey="mujeres"
                name="Mujeres"
                fill="#ec4899"
                radius={[8, 8, 0, 0]}
                barSize={isMobile ? 22 : 48}
                isAnimationActive={false}
                activeBar={false}
                className="cursor-pointer"
                onClick={handleBarClick}
                onMouseEnter={handleBarEnter}
              >
                {rangos.map((_, index) => (
                  <Cell
                    key={`m-${index}`}
                    fill={
                      activeIndex === undefined || activeIndex === index
                        ? "#ec4899"
                        : "#f9a8d4"
                    }
                  />
                ))}
                <LabelList
                  dataKey="mujeres"
                  position="top"
                  fill={theme.mujerLabel}
                  fontSize={9}
                  fontWeight={900}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="grid grid-cols-[5rem_1fr_5rem] border-b border-gray-200 px-3 py-2 dark:border-zinc-700">
            <span className="text-left text-[9px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 md:text-[10px]">
              Hombres
            </span>
            <span className="text-center text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
              Rango
            </span>
            <span className="text-right text-[9px] font-bold uppercase tracking-wide text-pink-600 dark:text-pink-400 md:text-[10px]">
              Mujeres
            </span>
          </div>

          {rangos.map((rango, index) => {
            const isActive = activeIndex === index;
            const filaTotal = rango.hombres + rango.mujeres;
            const pctH =
              filaTotal > 0 ? (rango.hombres / filaTotal) * 100 : 0;
            const pctM =
              filaTotal > 0 ? (rango.mujeres / filaTotal) * 100 : 0;

            return (
              <div
                key={rango.name}
                onMouseEnter={() => setHoverIndex(index)}
                onClick={() => handleRowClick(index)}
                className={`relative cursor-pointer border-b border-gray-100 dark:border-zinc-800 ${
                  isActive
                    ? "bg-gray-100 dark:bg-zinc-800/80"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="grid grid-cols-[5rem_1fr_5rem] items-end gap-x-2 px-3 pb-1 pt-2.5">
                  <div className="text-left">
                    <span className="block text-base font-black tabular-nums leading-none text-blue-600 md:text-lg">
                      {rango.hombres}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold tabular-nums text-blue-500/80 md:text-xs">
                      {fmtPct(rango.hombres, totalGeneral)}
                    </span>
                  </div>
                  <div
                    className={`pb-0.5 text-center ${
                      isActive
                        ? "text-gray-900 dark:text-zinc-100"
                        : "text-gray-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="block text-[9px] font-bold uppercase leading-snug md:text-[10px]">
                      {rango.name}
                    </span>
                    <span className="mt-1 block text-xs font-black tabular-nums text-gray-500 dark:text-zinc-400 md:text-sm">
                      {filaTotal} · {fmtPct(filaTotal, totalGeneral)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-base font-black tabular-nums leading-none text-pink-600 md:text-lg">
                      {rango.mujeres}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold tabular-nums text-pink-500/80 md:text-xs">
                      {fmtPct(rango.mujeres, totalGeneral)}
                    </span>
                  </div>
                </div>
                <div className="px-3 pb-2.5 pt-1">
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                    <div
                      className="h-full bg-blue-500 transition-[width] duration-300 ease-out"
                      style={{ width: `${pctH}%` }}
                    />
                    <div
                      className="h-full bg-pink-500 transition-[width] duration-300 ease-out"
                      style={{ width: `${pctM}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="relative bg-gray-50/80 dark:bg-zinc-900/60">
            <div className="grid grid-cols-[5rem_1fr_5rem] items-end gap-x-2 px-3 pb-1 pt-3">
              <div className="text-left">
                <span className="block text-lg font-black tabular-nums leading-none text-blue-600 md:text-xl">
                  {totales.hombres}
                </span>
                <span className="mt-1 block text-xs font-bold tabular-nums text-blue-500/80 md:text-sm">
                  {fmtPct(totales.hombres, totalGeneral)}
                </span>
              </div>
              <div className="pb-0.5 text-center">
                <span className="block text-[10px] font-black uppercase tracking-wide text-gray-800 dark:text-zinc-100 md:text-xs">
                  Total
                </span>
                <span className="mt-1 block text-lg font-black tabular-nums leading-none text-gray-800 dark:text-zinc-100 md:text-xl">
                  {totalGeneral}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-lg font-black tabular-nums leading-none text-pink-600 md:text-xl">
                  {totales.mujeres}
                </span>
                <span className="mt-1 block text-xs font-bold tabular-nums text-pink-500/80 md:text-sm">
                  {fmtPct(totales.mujeres, totalGeneral)}
                </span>
              </div>
            </div>
            <div className="px-3 pb-3 pt-1">
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${pctTotalH}%` }}
                />
                <div
                  className="h-full bg-pink-500"
                  style={{ width: `${pctTotalM}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
