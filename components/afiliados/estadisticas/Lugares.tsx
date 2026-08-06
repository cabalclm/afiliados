"use client";

import type { Afiliado } from "../esquemas";
import { chartStyles, useChartTheme } from "./utils";

interface Props {
  afiliados: Afiliado[];
}

export default function Lugares({ afiliados }: Props) {
  const theme = useChartTheme();

  const conteoLugares: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const lugar = afiliado.lugar_nombre || "Sin Especificar";
    conteoLugares[lugar] = (conteoLugares[lugar] || 0) + 1;
  });

  const datosLugares = Object.entries(conteoLugares)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const hasData = datosLugares.length > 0;
  const total = afiliados.length;
  const maxValue = hasData
    ? Math.max(...datosLugares.map((item) => item.value))
    : 1;

  return (
    <div className={`${chartStyles.cardCompact} h-full`}>
      <div className="mb-4 flex shrink-0 flex-col items-center text-center md:items-start md:text-left">
        <h4 className={chartStyles.headerTitle}>
          Ubicación de los Afiliados
        </h4>
        <p className={chartStyles.headerSubtitleLeft}>
          Lugares con mayor presencia
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col />
            <col className="w-[3.5rem]" />
            <col className="w-[3rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700">
              <th className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                Lugar
              </th>
              <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                Cant.
              </th>
              <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 md:text-[10px]">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasData ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500"
                >
                  Sin registros
                </td>
              </tr>
            ) : (
              datosLugares.map((item) => {
                const pctNum = total > 0 ? (item.value / total) * 100 : 0;
                const pct = pctNum.toFixed(0);
                const barWidth =
                  maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                return (
                  <tr
                    key={item.name}
                    className="group cursor-default border-b border-gray-100 last:border-0 dark:border-zinc-800"
                  >
                    <td colSpan={3} className="relative p-0">
                      <div className="absolute inset-0 bg-transparent transition-colors duration-200 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/40" />
                      <div className="relative px-3 py-2.5">
                        <div className="mb-2 grid grid-cols-[1fr_3.5rem_3rem] items-center gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <span
                              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: theme.barAccent }}
                            />
                            <span className="truncate text-[9px] font-bold uppercase leading-snug text-gray-700 group-hover:text-gray-900 dark:text-zinc-300 dark:group-hover:text-zinc-100 md:text-[10px]">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className="text-right text-xs font-black tabular-nums md:text-sm"
                            style={{ color: theme.barAccent }}
                          >
                            {item.value}
                          </span>
                          <span className="text-right text-[10px] font-semibold tabular-nums text-gray-500 dark:text-zinc-400 md:text-xs">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                          <div
                            className="h-full rounded-full transition-[width] duration-500 ease-out"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: theme.barAccent,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
