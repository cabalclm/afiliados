"use client";

import { useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import DonutPieChart from "./DonutPieChart";
import { chartStyles, useChartTheme } from "./utils";

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
  const theme = useChartTheme();

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
      ? [{ name: "Sin registros", value: 1, color: theme.emptySlice }]
      : datosPadron;

  return (
    <div className={`${chartStyles.card} h-full`}>
      <div className={chartStyles.headerBlock}>
        <h4 className={chartStyles.headerTitle}>
          Intereses Políticos Prioritarios
        </h4>
        <p className={chartStyles.headerSubtitleLeft}>
          Distribución porcentual del grupo
        </p>
      </div>

      <DonutPieChart
        data={datosGrafica}
        isMobile={isMobile}
        totalRegistros={afiliados.length}
        filasAdicionales={
          sinDefinir > 0
            ? [
                {
                  name: "Sin política seleccionada",
                  value: sinDefinir,
                  color: "#9ca3af",
                },
              ]
            : []
        }
      />
    </div>
  );
}
