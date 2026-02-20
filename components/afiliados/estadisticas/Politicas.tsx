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

interface Props {
  afiliados: Afiliado[];
}

export default function Politicas({ afiliados }: Props) {
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

  const datosGrafica = Object.entries(conteo)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-sm z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1 uppercase">
            {label}
          </p>
          <p className="flex items-center gap-2 mb-1">
            <span className="text-gray-600">Interesados:</span>
            <strong className="text-[#0066CC] text-lg">
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
        <h4 className="text-xl md:text-xl font-bold text-gray-800 uppercase">
          Intereses Políticos Prioritarios
        </h4>
        <p className="text-sm text-gray-500 italic">
          Áreas de mayor interés para el grupo
        </p>
      </div>

      <div className="flex-1 w-full md:overflow-x-auto md:overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <div
          className="w-full md:min-w-[550px]"
          style={{ height: datosGrafica.length * 55 + 30 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datosGrafica}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
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
                name="Personas"
                barSize={20}
                shape={(props: any) => {
                  const { x, y, width, height } = props;
                  return (
                    <Rectangle
                      x={x}
                      y={y - 12}
                      width={width}
                      height={height}
                      fill="#0066CC"
                      radius={[0, 8, 8, 0]}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="name"
                  content={(props: any) => {
                    const { x, y, index } = props;
                    const item = datosGrafica[index];

                    if (!item) return null;

                    return (
                      <text
                        x={x}
                        y={y + 22}
                        fill="#6b7280"
                        fontSize={9}
                        fontWeight="bold"
                        className="uppercase"
                        textAnchor="start"
                      >
                        <tspan fontSize={13} fontWeight="900" fill="#0066CC">
                          ({item.value})
                        </tspan>
                        <tspan dx={5}> {item.name}</tspan>
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] text-gray-400 shrink-0 uppercase font-bold">
        {sinDefinir > 0 && (
          <span>(Personas sin política seleccionada: {sinDefinir})</span>
        )}
      </div>
    </div>
  );
}
