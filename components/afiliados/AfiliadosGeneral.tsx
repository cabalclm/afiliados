"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { Afiliado, Lider } from "./esquemas";
import { motion } from "framer-motion";

interface Props {
  afiliados: Afiliado[];
  lideres: Lider[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  searchTerm: string;
}

export default function AfiliadosGeneral({
  afiliados,
  lideres,
  onEditar,
  onDataChange,
  searchTerm,
}: Props) {
  const [liderAbiertoId, setLiderAbiertoId] = useState<string | null>(null);

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return "—";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  const afiliadosAgrupados = useMemo(() => {
    const grouped = new Map<string, Afiliado[]>();
    const term = searchTerm.toLowerCase();

    afiliados.forEach((afiliado) => {
      const liderId = afiliado.lider_id || "SIN_LIDER";
      const fullName =
        `${afiliado.nombres} ${afiliado.apellidos}`.toLowerCase();
      const dpi = afiliado.dpi || "";

      if (!searchTerm || fullName.includes(term) || dpi.includes(term)) {
        if (!grouped.has(liderId)) {
          grouped.set(liderId, []);
        }
        grouped.get(liderId)?.push(afiliado);
      }
    });

    const leadersMap = new Map(lideres.map((l) => [l.id, l]));
    const leaderGroups: Array<{ lider: Lider | null; afiliados: Afiliado[] }> =
      [];

    grouped.forEach((list, liderId) => {
      if (liderId !== "SIN_LIDER") {
        const lider = leadersMap.get(liderId);
        if (lider) {
          leaderGroups.push({ lider, afiliados: list });
        }
      }
    });

    if (grouped.has("SIN_LIDER")) {
      leaderGroups.push({
        lider: null,
        afiliados: grouped.get("SIN_LIDER") || [],
      });
    }

    return leaderGroups;
  }, [afiliados, lideres, searchTerm]);

  if (afiliadosAgrupados.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">
        No se encontraron miembros.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {afiliadosAgrupados.map(({ lider, afiliados: list }) => {
        const liderId = lider?.id || "SIN_LIDER";
        const isLiderAbierto = liderAbiertoId === liderId;
        const nombreLider = lider
          ? `${lider.nombres} ${lider.apellidos}`
          : "Miembros sin Líder asignado";
        const colorClase = lider
          ? lider.rol === "SUPER"
            ? "bg-indigo-50 border-indigo-200"
            : "bg-gray-50 border-gray-200"
          : "bg-red-50 border-red-200";

        return (
          <div key={liderId} className="border rounded-lg shadow-sm">
            <div
              className={`flex justify-between items-center p-4 cursor-pointer ${colorClase} rounded-lg`}
              onClick={() => setLiderAbiertoId(isLiderAbierto ? null : liderId)}
            >
              <h3 className="text-base font-bold text-gray-800">
                Célula de:{" "}
                <span className="text-blue-700 uppercase">
                  {nombreLider} ({list.length})
                </span>
              </h3>
              <ChevronDown
                className={`h-5 w-5 text-gray-600 transition-transform ${isLiderAbierto ? "rotate-180" : ""}`}
              />
            </div>

            <motion.div
              initial={false}
              animate={{ height: isLiderAbierto ? "auto" : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        No.
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        DPI
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        Teléfono
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        Edad
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase">
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {list.map((afiliado, index) => (
                      <tr
                        key={afiliado.id + 1}
                        className="hover:bg-gray-50 uppercase"
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900">
                          {afiliado.nombres} {afiliado.apellidos}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-mono">
                          {afiliado.dpi || "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-mono">
                          {afiliado.telefono || "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-bold">
                          {calcularEdad(afiliado.nacimiento)}
                        </td>
                        {/* CAMBIO AQUÍ: Solo usamos la ubicación del afiliado */}
                        <td className="px-4 py-2 whitespace-nowrap">
                          {afiliado.lugar_nombre || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
