"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  PIE_CORNER_RADIUS,
  PIE_PADDING_ANGLE,
  useChartTheme,
} from "./utils";

export type DonutDatum = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  data: DonutDatum[];
  isMobile: boolean;
  idleLabel?: string;
  /** Filas extra solo en tabla (no en gráfica), p. ej. sin política seleccionada. */
  filasAdicionales?: DonutDatum[];
  /** Total mostrado en la fila final; por defecto suma de `data`. */
  totalRegistros?: number;
};

const centerEase = [0.25, 0.46, 0.45, 0.94] as const;

export default function DonutPieChart({
  data,
  isMobile,
  idleLabel = "Total",
  filasAdicionales = [],
  totalRegistros,
}: Props) {
  const theme = useChartTheme();
  const [hoverIndex, setHoverIndex] = useState<number | undefined>();
  const [pinnedIndex, setPinnedIndex] = useState<number | undefined>();

  const isEmpty = data.length === 1 && data[0].name === "Sin registros";
  const total = useMemo(
    () => (isEmpty ? 0 : data.reduce((sum, item) => sum + item.value, 0)),
    [data, isEmpty],
  );
  const totalFinal = totalRegistros ?? total;

  const activeIndex = hoverIndex ?? pinnedIndex;
  const activeSlice =
    activeIndex !== undefined && !isEmpty ? data[activeIndex] : null;
  const activePercent =
    activeSlice && total > 0
      ? ((activeSlice.value / total) * 100).toFixed(0)
      : null;

  const handleClick = (index: number) => {
    if (isEmpty) return;
    setPinnedIndex((prev) => (prev === index ? undefined : index));
  };

  const chartSizeClass = isMobile
    ? "relative mx-auto aspect-square w-full max-w-[min(100%,24rem)] shrink-0"
    : "relative mx-auto aspect-square w-full shrink-0";

  return (
    <div className="flex w-full flex-col items-stretch justify-start gap-3">
      <div className="flex w-full flex-col items-center gap-3">
        <div className={chartSizeClass}>
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 w-[min(76%,14rem)] -translate-x-1/2 ${
            isMobile ? "translate-y-[calc(-50%+7px)]" : "translate-y-[calc(-50%+6px)]"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeSlice ? (
              <motion.div
                key={`slice-${activeSlice.name}`}
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.94 }}
                transition={{ duration: 0.24, ease: centerEase }}
                className="flex w-full flex-col items-center justify-center gap-0.5 text-center"
              >
                <span className="line-clamp-2 w-full text-balance text-center text-[8px] font-bold uppercase leading-tight text-gray-600 dark:text-zinc-400 md:text-[9px]">
                  {activeSlice.name}
                </span>
                <span
                  className="w-full text-center text-4xl font-black tabular-nums leading-none md:text-[2.5rem]"
                  style={{ color: activeSlice.color }}
                >
                  {activeSlice.value}
                </span>
                <span className="w-full text-center text-sm font-semibold text-gray-500 dark:text-zinc-500 md:text-xs">
                  {activePercent}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.94 }}
                transition={{ duration: 0.24, ease: centerEase }}
                className="flex w-full flex-col items-center justify-center gap-0.5 text-center"
              >
                <span className="w-full text-center text-xs font-bold uppercase leading-snug tracking-wide text-gray-500 dark:text-zinc-500 md:text-[10px]">
                  {idleLabel}
                </span>
                <span className="w-full text-center text-4xl font-black tabular-nums leading-none text-gray-800 dark:text-zinc-100 md:text-[2.25rem]">
                  {total}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? "60%" : "52%"}
              outerRadius={isMobile ? "92%" : "80%"}
              fill="#8884d8"
              paddingAngle={PIE_PADDING_ANGLE}
              cornerRadius={PIE_CORNER_RADIUS}
              dataKey="value"
              activeIndex={activeIndex}
              onMouseEnter={(_, index) => {
                if (!isEmpty) setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(undefined)}
              onClick={(_, index) => handleClick(index)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={theme.pieStroke}
                  strokeWidth={activeIndex === index ? 2 : 1}
                  className={isEmpty ? "" : "cursor-pointer"}
                />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {!isEmpty && (
        <div className="w-full shrink-0">
          <div className="max-h-[340px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:scrollbar-thumb-zinc-700 md:px-4 md:py-3">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="pb-2 pr-2 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                    Categoría
                  </th>
                  <th className="pb-2 pr-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                    Cant.
                  </th>
                  <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const pct =
                    totalFinal > 0
                      ? ((item.value / totalFinal) * 100).toFixed(0)
                      : "0";
                  const isActive = activeIndex === index;

                  return (
                    <tr
                      key={item.name}
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex(undefined)}
                      onClick={() => handleClick(index)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors dark:border-zinc-800 ${
                        isActive
                          ? "bg-gray-100 dark:bg-zinc-800/80"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <td className="py-2 pr-2 align-top">
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[9px] font-bold uppercase leading-snug text-gray-700 dark:text-zinc-300 md:text-[10px]">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-2 pr-2 text-right align-top text-xs font-black tabular-nums md:text-sm"
                        style={{ color: item.color }}
                      >
                        {item.value}
                      </td>
                      <td className="py-2 text-right align-top text-[10px] font-semibold tabular-nums text-gray-500 dark:text-zinc-400 md:text-xs">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
                {filasAdicionales.map((item) => {
                  const pct =
                    totalFinal > 0
                      ? ((item.value / totalFinal) * 100).toFixed(0)
                      : "0";

                  return (
                    <tr
                      key={item.name}
                      className="border-b border-gray-100 dark:border-zinc-800"
                    >
                      <td className="py-2 pr-2 align-top">
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[9px] font-bold uppercase leading-snug text-gray-500 dark:text-zinc-400 md:text-[10px]">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right align-top text-xs font-black tabular-nums text-gray-500 dark:text-zinc-400 md:text-sm">
                        {item.value}
                      </td>
                      <td className="py-2 text-right align-top text-[10px] font-semibold tabular-nums text-gray-500 dark:text-zinc-400 md:text-xs">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 bg-gray-50/80 dark:border-zinc-700 dark:bg-zinc-900/60">
                  <td className="py-2.5 pr-2 align-top">
                    <span className="text-[10px] font-black uppercase tracking-wide text-gray-800 dark:text-zinc-100 md:text-xs">
                      Total
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right align-top text-sm font-black tabular-nums text-gray-800 dark:text-zinc-100 md:text-base">
                    {totalFinal}
                  </td>
                  <td className="py-2.5 text-right align-top text-xs font-black tabular-nums text-gray-600 dark:text-zinc-300 md:text-sm">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
