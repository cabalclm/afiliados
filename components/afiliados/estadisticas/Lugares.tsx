"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
  Rectangle,
} from "recharts";
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

  const datosLugaresRaw = Object.entries(conteoLugares)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const datosLugares =
    datosLugaresRaw.length > 0
      ? datosLugaresRaw
      : [{ name: "Sin registros", value: 1 }];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (payload[0].payload.name === "Sin registros") return null;

      return (
        <div className={chartStyles.tooltip}>
          <p className={chartStyles.tooltipTitle}>{label}</p>
          <p className="flex items-center gap-2">
            <span className={chartStyles.tooltipLabel}>Personas:</span>
            <strong
              className="text-xl"
              style={{ color: theme.barAccent }}
            >
              {payload[0].value}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={chartStyles.cardCompact}>
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className={chartStyles.headerTitle}>
          Ubicación de los Afiliados
        </h4>
        <p className={chartStyles.headerSubtitleLeft}>
          Lugares con mayor presencia
        </p>
      </div>

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
        <div
          className="w-full md:min-w-[550px]"
          style={{ height: Math.max(datosLugares.length * 55 + 30, 100) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datosLugares}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={theme.gridStroke}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={10}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: theme.cursorFill, radius: 8 }}
              />
              <Bar
                dataKey="value"
                barSize={20}
                shape={(props: any) => {
                  const { x, y, width, height } = props;
                  return (
                    <Rectangle
                      x={x}
                      y={y - 12}
                      width={width}
                      height={height}
                      fill={
                        datosLugaresRaw.length > 0
                          ? theme.barAccent
                          : theme.emptySlice
                      }
                      radius={[0, 10, 10, 0]}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="name"
                  content={(props: any) => {
                    const { x, y, index } = props;
                    const item = datosLugares[index];

                    if (!item) return null;

                    const hasData = datosLugaresRaw.length > 0;
                    const total = afiliados.length;
                    const percent = (item.value / total) * 100;

                    return (
                      <text
                        x={x}
                        y={y + 22}
                        fill={hasData ? theme.barLabel : theme.axisTick}
                        fontSize={9}
                        className="uppercase"
                        textAnchor="start"
                      >
                        {hasData && (
                          <>
                            <tspan
                              fontSize={13}
                              fontWeight="900"
                              fill={theme.barAccent}
                            >
                              ({item.value}
                            </tspan>
                            <tspan
                              fontWeight="400"
                              fontSize={10}
                              fill={theme.axisTick}
                            >
                              {" "}
                              | {percent.toFixed(0)}%)
                            </tspan>
                          </>
                        )}
                        <tspan dx={hasData ? 5 : 0} fontWeight="600">
                          {" "}
                          {item.name}
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
