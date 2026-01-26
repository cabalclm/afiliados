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

export default function Empadronados({ afiliados }: Props) {
  let totalEmpadronados = 0;
  let totalNoEmpadronados = 0;

  afiliados.forEach((afiliado) => {
    if (afiliado.empadronado) {
      totalEmpadronados++;
    } else {
      totalNoEmpadronados++;
    }
  });

  const datosPadron = [
    { name: "Empadronados", value: totalEmpadronados, color: "#16a34a" },
    { name: "No Empadronados", value: totalNoEmpadronados, color: "#dc2626" },
  ];

  const renderLabelPie = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm md:text-xl font-bold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-sm z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">
            {payload[0].name}
          </p>
          <p className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: payload[0].payload.color }}
            ></span>
            <span className="text-gray-600">Total:</span>
            <strong className="text-gray-900 text-lg">
              {payload[0].value}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col items-center mb-4 shrink-0">
        <h4 className="text-2xl font-bold text-gray-800">
          Estatus de Empadronamiento
        </h4>
        <p className="text-gray-500">Distribución porcentual del grupo</p>
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datosPadron}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabelPie}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {datosPadron.map((entry, index) => (
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
              wrapperStyle={{ fontSize: "14px", fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-12 mt-4 pt-4 border-t border-gray-100 shrink-0">
        <div className="text-center">
          <p className="text-4xl font-bold text-green-600">
            {totalEmpadronados}
          </p>
          <p className="text-xs uppercase text-gray-500 font-bold tracking-wider mt-1">
            Empadronados
          </p>
        </div>
        <div className="w-px bg-gray-200 h-14"></div>
        <div className="text-center">
          <p className="text-4xl font-bold text-red-600">
            {totalNoEmpadronados}
          </p>
          <p className="text-xs uppercase text-gray-500 font-bold tracking-wider mt-1">
            No Empadronados
          </p>
        </div>
      </div>
    </div>
  );
}
