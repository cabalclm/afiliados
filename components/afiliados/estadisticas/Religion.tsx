"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Afiliado } from "../esquemas";

interface Props {
  afiliados: Afiliado[];
}

const COLORES = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
];

export default function Religiones({ afiliados }: Props) {
  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const rel = afiliado.religion || "Sin especificar";
    conteo[rel] = (conteo[rel] || 0) + 1;
  });

  const datosPadron = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORES[index % COLORES.length],
    }));

  const datosGrafica =
    afiliados.length === 0
      ? [{ name: "Sin registros", value: 1, color: "#e5e7eb" }]
      : datosPadron.filter((d) => d.value > 0);

  const renderLabelPie = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;

    if (name === "Sin registros") return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percent === undefined || percent <= 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xl font-bold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      if (payload[0].name === "Sin registros") return null;

      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-[9px] z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">
            {payload[0].name}
          </p>
          <p className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: payload[0].payload.color }}
            ></span>
            <span className="text-gray-600">Total:</span>
            <strong className="text-gray-900 text-xl">
              {payload[0].value}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const legendPayload = datosPadron.map((item) => ({
    id: item.name,
    type: "circle" as const,
    value: item.name,
    color: item.color,
  }));

  return (
    <div className="w-full h-full flex flex-col min-h-[400px]">
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className="text-xs md:text-xl font-bold text-gray-800 uppercase">
          Estadística de Religión
        </h4>
        <p className="text-sm text-gray-500 italic">
          Distribución porcentual del grupo
        </p>
      </div>

      <div className="flex-1 min-h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={datosGrafica}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabelPie}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {datosGrafica.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  strokeWidth={2}
                  stroke="#fff"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "9px", fontWeight: 500 }}
              payload={legendPayload}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 shrink-0 flex-wrap">
        {datosPadron.map((item, index) => (
          <div key={item.name} className="flex items-center gap-4">
            {index > 0 && (
              <div className="w-px bg-gray-200 h-10 hidden sm:block"></div>
            )}
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
              <p className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mt-1">
                {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
