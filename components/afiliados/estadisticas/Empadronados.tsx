"use client";

import { useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import DonutPieChart from "./DonutPieChart";
import { chartStyles, useChartTheme } from "./utils";

interface Props {
  afiliados: Afiliado[];
}

export default function Empadronados({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const theme = useChartTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const datosGrafica =
    totalEmpadronados === 0 && totalNoEmpadronados === 0
      ? [{ name: "Sin registros", value: 1, color: theme.emptySlice }]
      : datosPadron.filter((d) => d.value > 0);

  return (
    <div className={chartStyles.card}>
      <div className={chartStyles.headerBlock}>
        <h4 className={chartStyles.headerTitle}>
          Estatus de empadronamiento
        </h4>
        <p className={chartStyles.headerSubtitleLeft}>
          Distribución porcentual del grupo
        </p>
      </div>

      <DonutPieChart data={datosGrafica} isMobile={isMobile} />

      <div className={chartStyles.footer}>
        <p className={chartStyles.footerText}>
          Total de registros: {afiliados.length}
        </p>
      </div>
    </div>
  );
}
