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

interface Props {
  afiliados: Afiliado[];
}

export default function Edades({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);

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
        <h4 className="text-xs md:text-lg font-bold text-gray-800 uppercase text-center md:text-left">
          Demografía del Grupo
        </h4>
        <p className="text-sm text-gray-500 text-center md:text-left">
          Distribución por rangos de edad y género
        </p>
      </div>

      {/* Contenedor con Scroll Horizontal para Móvil */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rangos}
            margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fontWeight: 700, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
            />
            <Tooltip cursor={{ fill: "#f9fafb", radius: 8 }} />
            <Legend
              verticalAlign="top"
              height={40}
              iconType="circle"
              wrapperStyle={{ fontSize: "9px" }}
            />
            <Bar
              dataKey="hombres"
              name="Hombres"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="hombres"
                position="top"
                fill="#1e40af"
                fontSize={9}
                fontWeight="900"
              />
            </Bar>
            <Bar
              dataKey="mujeres"
              name="Mujeres"
              fill="#ec4899"
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="mujeres"
                position="top"
                fill="#9d174d"
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
