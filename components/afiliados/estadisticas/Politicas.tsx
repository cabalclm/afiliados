"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";

const LISTA_POLITICAS = [
  "Obras de Infraestructura",
  "Red Vial",
  "Educación",
  "Medio Ambiente",
  "Desarrollo Económico Local",
  "Servicios Públicos",
  "de Seguridad",
  "Salud",
];

const COLORES = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

interface Props {
  afiliados: Afiliado[];
}

export default function Politicas({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const conteo: Record<string, number> = {};
  LISTA_POLITICAS.forEach((p) => (conteo[p] = 0));

  let sinDefinir = 0;

  afiliados.forEach((afiliado) => {
    if (afiliado.politica && conteo.hasOwnProperty(afiliado.politica)) {
      conteo[afiliado.politica]++;
    } else if (afiliado.politica) {
      conteo[afiliado.politica] = (conteo[afiliado.politica] || 0) + 1;
    } else {
      sinDefinir++;
    }
  });

  const datosPadron = Object.entries(conteo)
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORES[index % COLORES.length],
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const datosGrafica =
    datosPadron.length === 0
      ? [{ name: "Sin registros", value: 1, color: "#e5e7eb" }]
      : datosPadron;

  const renderLabelPie = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill, value } = props;

    if (name === "Sin registros") return null;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    const offset = isMobile ? 5 : 10;
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + offset) * cos;
    const my = cy + (outerRadius + offset) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 6;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    if (percent === undefined || percent <= 0) return null;

    const words = name.split(" ");
    let lines = [name];
    if (name.length > 12) {
      lines = [];
      let currentLine = "";
      words.forEach((word: string) => {
        if ((currentLine + word).length > 12) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });
      lines.push(currentLine.trim());
    }

    return (
      <g>
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
          strokeWidth={1.5}
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          className="uppercase"
        >
          <tspan x={ex + (cos >= 0 ? 1 : -1) * 5} dy="-0.6em" className={isMobile ? "text-[8px]" : "text-[10px]"}>
            <tspan fontWeight="900" fill={fill}>{value}</tspan>
            <tspan fontWeight="normal" fill="#6b7280"> | {(percent * 100).toFixed(0)}%</tspan>
          </tspan>
          {lines.slice(0, 3).map((line, i) => (
            <tspan 
              key={i} 
              x={ex + (cos >= 0 ? 1 : -1) * 5} 
              dy="1.2em" 
              className={`${isMobile ? "text-[6px]" : "text-[7px]"} font-bold fill-gray-500`}
            >
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      if (payload[0].name === "Sin registros") return null;

      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-[9px] z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1 uppercase">
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

  return (
    <div className="w-full h-full flex flex-col min-h-[400px]">
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className="text-xs md:text-xl font-bold text-gray-800 uppercase">
          Intereses Políticos Prioritarios
        </h4>
        <p className="text-sm text-gray-500 italic">
          Distribución porcentual del grupo
        </p>
      </div>

      <div className="flex-1 min-h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
          <PieChart>
            <Pie
              data={datosGrafica}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabelPie}
              innerRadius={isMobile ? "35%" : "45%"}
              outerRadius={isMobile ? "60%" : "75%"}
              fill="#8884d8"
              paddingAngle={5}
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-400 shrink-0 uppercase font-bold border-t border-gray-100 pt-4">
        <p className="text-gray-500 mb-1">Total de registros evaluados: {afiliados.length}</p>
        {sinDefinir > 0 && (
          <span>(Sin política seleccionada: {sinDefinir})</span>
        )}
      </div>
    </div>
  );
}
