"use client";

import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Hash,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { eliminar } from "./acciones";
import type { Afiliado, Lider } from "./esquemas";

interface Props {
  lider: Lider;
  afiliados: Afiliado[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
}

export default function Tabla({
  lider,
  afiliados,
  onEditar,
  onDataChange,
  rolUsuarioSesion,
}: Props) {
  const puedeVerAcciones = true;

  if (afiliados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded border border-dashed">
        <p className="text-sm">No hay afiliados en esta célula aún.</p>
      </div>
    );
  }

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

  const generarLinkWhatsapp = (telefono: string) => {
    if (!telefono) return "#";
    const numeroLimpio = telefono.replace(/\D/g, "");
    const numeroFinal =
      numeroLimpio.length === 8 ? `502${numeroLimpio}` : numeroLimpio;
    return `https://wa.me/${numeroFinal}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {afiliados.map((afiliado, index) => (
        <div
          key={afiliado.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
        >
          <div className="p-4 flex-1 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs h-6 w-6 rounded-md shrink-0">
                {index + 1}
              </span>
              <h3 className="text-xs font-bold text-gray-900 uppercase leading-tight truncate">
                {afiliado.nombres} {afiliado.apellidos}
              </h3>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-bold text-gray-500 shrink-0">DPI:</span>
                <span className="font-mono font-medium truncate">
                  {afiliado.dpi || "—"}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-[10px]">
                  {calcularEdad(afiliado.nacimiento)}
                </span>
              </div>

              <div className="shrink-0">
                {afiliado.sexo === "M" ? (
                  <span className="flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] h-6 w-6 rounded-md">
                    M
                  </span>
                ) : (
                  <span className="flex items-center justify-center bg-pink-50 text-pink-700 border border-pink-200 font-bold text-[10px] h-6 w-6 rounded-md">
                    F
                  </span>
                )}
              </div>
            </div>

            {/* LÍNEA 3: WHATSAPP + UBICACIÓN */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <a
                href={generarLinkWhatsapp(afiliado.telefono || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 shrink-0 text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-bold font-mono">
                  {afiliado.telefono || "—"}
                </span>
              </a>

              <div className="h-4 w-px bg-gray-200 shrink-0"></div>

              {/* Ubicación: Ahora solo depende de afiliado.lugar_nombre */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span
                  className="truncate"
                  title={afiliado.lugar_nombre || "Ubicación no definida"}
                >
                  {afiliado.lugar_nombre || "—"}
                </span>
              </div>
            </div>

            {/* LÍNEA 4: PADRÓN */}
            <div className="pt-1">
              {afiliado.empadronado ? (
                <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center gap-2 text-green-800">
                  <Hash className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <div className="text-[10px]">
                    <span className="font-bold uppercase mr-1">Padrón:</span>
                    <span className="font-mono font-bold">
                      {afiliado.no_padron || "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-2 flex items-center gap-2 text-red-700">
                  <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-[10px] font-bold uppercase">
                    NO EMPADRONADO
                  </span>
                </div>
              )}
            </div>
          </div>

          {puedeVerAcciones && (
            <div className="bg-gray-50 p-3 border-t border-gray-100 flex gap-2 mt-auto">
              <Button
                variant="outline"
                className="flex-1 bg-white text-blue-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 h-8 text-xs"
                onClick={() => onEditar(afiliado)}
              >
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-white text-red-600 border-gray-200 hover:bg-red-50 hover:text-red-700 h-8 text-xs"
                onClick={() => eliminar(afiliado, onDataChange)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
