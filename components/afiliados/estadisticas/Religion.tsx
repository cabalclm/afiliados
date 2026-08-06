"use client";

import { useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import DonutPieChart from "./DonutPieChart";
import { chartStyles, useChartTheme } from "./utils";

const COLORES = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
];

interface Props {
  afiliados: Afiliado[];
}

export default function Religiones({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const theme = useChartTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      ? [{ name: "Sin registros", value: 1, color: theme.emptySlice }]
      : datosPadron.filter((d) => d.value > 0);

  return (
    <div className={`${chartStyles.card} h-full`}>
      <div className={chartStyles.headerBlock}>
        <h4 className={chartStyles.headerTitle}>Estadística de Religión</h4>
        <p className={chartStyles.headerSubtitleLeft}>
          Distribución porcentual del grupo
        </p>
      </div>

      <DonutPieChart
        data={datosGrafica}
        isMobile={isMobile}
        totalRegistros={afiliados.length}
      />
    </div>
  );
}
