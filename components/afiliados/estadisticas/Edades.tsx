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
import type { Afiliado } from "../esquemas";

interface Props {
  afiliados: Afiliado[];
}

export default function Edades({ afiliados }: Props) {
  const rangos = [
    { name: "Jóvenes (18-30)", min: 18, max: 30, hombres: 0, mujeres: 0 },
    { name: "Adultos (31-60)", min: 31, max: 60, hombres: 0, mujeres: 0 },
    { name: "Mayores (61+)", min: 61, max: 150, hombres: 0, mujeres: 0 },
  ];

  afiliados.forEach((af) => {
    const nacimiento = new Date(af.nacimiento);
    const edad = new Date().getFullYear() - nacimiento.getFullYear();
    const rango = rangos.find((r) => edad >= r.min && edad <= r.max);
    if (rango) {
      if (af.sexo === "M") rango.hombres++;
      else rango.mujeres++;
    }
  });

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="mb-4 shrink-0">
        <h4 className="text-xl md:text-2xl font-bold text-gray-800 uppercase text-center md:text-left">
          Demografía del Grupo
        </h4>
        <p className="text-sm text-gray-500 text-center md:text-left">
          Distribución por rangos de edad y género
        </p>
      </div>

      {/* Contenedor con Scroll Horizontal para Móvil */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <div className="h-full min-w-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rangos}
              margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fontWeight: 700, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
              />
              <Tooltip cursor={{ fill: "#f9fafb", radius: 8 }} />
              <Legend verticalAlign="top" height={40} iconType="circle" />
              <Bar
                dataKey="hombres"
                name="Hombres"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={50}
              >
                <LabelList
                  dataKey="hombres"
                  position="top"
                  fill="#1e40af"
                  fontSize={12}
                  fontWeight="bold"
                />
              </Bar>
              <Bar
                dataKey="mujeres"
                name="Mujeres"
                fill="#ec4899"
                radius={[6, 6, 0, 0]}
                barSize={50}
              >
                <LabelList
                  dataKey="mujeres"
                  position="top"
                  fill="#9d174d"
                  fontSize={12}
                  fontWeight="bold"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
