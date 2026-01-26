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
} from "recharts";
import type { Afiliado } from "../esquemas";

interface Props {
  afiliados: Afiliado[];
}

export default function Lugares({ afiliados }: Props) {
  const conteoLugares: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const lugar = afiliado.lugar_nombre || "Sin Especificar";
    conteoLugares[lugar] = (conteoLugares[lugar] || 0) + 1;
  });

  const datosLugares = Object.entries(conteoLugares)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-sm z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1 uppercase">
            {label}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-gray-600">Personas:</span>
            <strong className="text-[#6366f1] text-lg">
              {payload[0].value}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className="text-xl md:text-2xl font-bold text-gray-800 uppercase">
          Ubicación de los Afiliados
        </h4>
        <p className="text-sm text-gray-500 italic">
          Lugares con mayor presencia
        </p>
      </div>

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <div
          className="min-w-[550px]"
          style={{ height: datosLugares.length * 50 + 50 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datosLugares}
              margin={{ top: 10, right: 30, left: -20, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
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
                cursor={{ fill: "#f3f4f6", radius: 8 }}
              />
              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[0, 8, 8, 0]}
                barSize={42}
              >
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={25}
                  fill="#FFFFFF"
                  fontSize={11}
                  fontWeight="bold"
                  style={{ pointerEvents: "none", textTransform: "uppercase" }}
                />
                <LabelList
                  dataKey="value"
                  position="insideRight"
                  offset={25}
                  fill="#FFFFFF"
                  fontSize={14}
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
