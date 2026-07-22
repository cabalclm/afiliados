"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import { calcularEdadAnios } from "@/utils/formatoFechaGT";
import { chartStyles, useChartTheme } from "./utils";

interface Props {
  afiliados: Afiliado[];
}

export default function Edades({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const theme = useChartTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rangos = [
    { name: "Jóvenes (18-30)", min: 18, max: 30, hombres: 0, mujeres: 0 },
    { name: "Adultos (31-60)", min: 31, max: 60, hombres: 0, mujeres: 0 },
    { name: "Mayores (61+)", min: 61, max: 150, hombres: 0, mujeres: 0 },
  ];

  afiliados.forEach((af) => {
    const edad = calcularEdadAnios(af.nacimiento);
    if (edad === null) return;
    const rango = rangos.find((r) => edad >= r.min && edad <= r.max);
    if (rango) {
      if (af.sexo === "M") rango.hombres++;
      else rango.mujeres++;
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className={chartStyles.tooltip}>
        <p className={chartStyles.tooltipTitle}>{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className={chartStyles.tooltipLabel}>{entry.name}:</span>
            <strong className={chartStyles.tooltipValue}>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={chartStyles.cardCompact}>
      <div className="mb-4 shrink-0">
        <h4 className={chartStyles.headerTitleSm}>Demografía del Grupo</h4>
        <p className={chartStyles.headerSubtitle}>
          Distribución por rangos de edad y género
        </p>
      </div>

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rangos}
            margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
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
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: theme.axisTick }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: theme.cursorFill, radius: 8 }}
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
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="hombres"
                position="top"
                fill={theme.hombreLabel}
                fontSize={9}
                fontWeight="900"
              />
            </Bar>
            <Bar
              dataKey="mujeres"
              name="Mujeres"
              fill="#ec4899"
              radius={[8, 8, 0, 0]}
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="mujeres"
                position="top"
                fill={theme.mujerLabel}
                fontSize={9}
                fontWeight="900"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
