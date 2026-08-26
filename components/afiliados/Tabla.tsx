"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  XCircle,
  MessageCircle,
  IdCard,
  MoreVertical,
  Phone,
} from "lucide-react";
import { eliminar } from "./acciones";
import type { Afiliado, Lider } from "./esquemas";
import CarnetAfiliacion from "./CarnetAfiliacion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatearDpi,
  formatearTelefono,
  linkLlamada,
  linkWhatsapp,
  TelefonoInline,
} from "./contacto";
import {
  columnaNoFijaCelda,
  columnaNoFijaEncabezado,
  FONDO_CELDA_TABLA,
  FONDO_ENCABEZADO_TABLA,
} from "@/lib/tablaSticky";
import { calcularEdadLabel } from "@/utils/formatoFechaGT";

import type { TemaLista } from "./temaPestana";

export type FormatoVista = "tarjetas" | "tabla";

interface Props {
  lider: Lider;
  afiliados: Afiliado[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
  formato?: FormatoVista;
  tema?: TemaLista;
  embebido?: boolean;
}

function puedeEliminarAfiliado(rol: string) {
  const r = (rol || "").toUpperCase();
  if (r === "SEDE") return false;
  return r === "ADMINISTRADOR" || r === "ADMIN" || r === "SUPER";
}

function TelefonoFooter({
  telefono,
  onCarnet,
  tema,
}: {
  telefono: string;
  onCarnet: () => void;
  tema?: TemaLista;
}) {
  const barClass =
    tema?.telefonoBar ??
    "bg-gradient-to-b from-sky-50 to-blue-50 text-blue-800 dark:from-blue-950/40 dark:to-sky-950/30 dark:text-blue-200";
  const llamarClass =
    "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap border-l border-blue-100 bg-blue-50 px-2 py-1.5 text-[9px] font-bold uppercase text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 min-w-[3.75rem] md:gap-1.5 md:px-4 md:py-2 md:text-[11px] md:min-w-[5.25rem]";

  return (
    <div
      className={`flex items-stretch border-t ${tema ? "border-gray-200 dark:border-neutral-700" : "border-blue-100 dark:border-blue-900/50"}`}
    >
      {telefono ? (
        <>
          <div
            className={`flex min-w-0 flex-1 items-center justify-center px-1.5 py-1.5 text-[10px] font-semibold md:justify-start md:px-3 md:py-2 md:text-sm ${barClass}`}
          >
            <span className="truncate font-mono tracking-wide">
              {formatearTelefono(telefono)}
            </span>
          </div>
          <a
            href={linkLlamada(telefono)}
            className={llamarClass}
            title="Llamar"
          >
            <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Llamar
          </a>
          <a
            href={linkWhatsapp(telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 border-l border-green-200 bg-green-50 px-2 py-1.5 text-[9px] font-bold uppercase text-green-700 transition hover:bg-green-100 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 md:gap-1.5 md:px-3 md:text-[11px]"
            title="WhatsApp"
          >
            <MessageCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
            WhatsApp
          </a>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center px-2 py-1.5 text-[9px] text-gray-400 dark:text-gray-500 md:px-3 md:py-2 md:text-[11px]">
          Sin teléfono
        </div>
      )}
      <button
        type="button"
        onClick={onCarnet}
        className="inline-flex items-center justify-center gap-1 border-l border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[9px] font-bold uppercase text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 md:gap-1.5 md:px-3 md:text-[11px]"
        title="Carnet"
      >
        <IdCard className="h-3 w-3 md:h-3.5 md:w-3.5" />
        Carnet
      </button>
    </div>
  );
}

export default function Tabla({
  lider,
  afiliados,
  onEditar,
  onDataChange,
  rolUsuarioSesion,
  formato = "tarjetas",
  tema,
  embebido = false,
}: Props) {
  const [afiliadoCarnet, setAfiliadoCarnet] = useState<Afiliado | null>(null);
  const rolUpper = (rolUsuarioSesion || "").toUpperCase();
  const esSedeSesion = rolUpper === "SEDE";
  const esAdmin =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  const puedeEliminar = puedeEliminarAfiliado(rolUsuarioSesion);
  const puedeEditar = esAdmin || esSedeSesion || !esSedeSesion;

  if (afiliados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800/50 rounded border border-dashed border-gray-200 dark:border-neutral-700">
        <p className="text-sm">No hay afiliados en esta célula aún.</p>
      </div>
    );
  }

  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const nombreLider = normalizar(`${lider.nombres} ${lider.apellidos}`);

  const esAfiliadoLider = (afiliado: Afiliado) =>
    normalizar(`${afiliado.nombres} ${afiliado.apellidos}`) === nombreLider;

  const afiliadosOrdenados = [...afiliados].sort((a, b) => {
    const aEsLider = esAfiliadoLider(a);
    const bEsLider = esAfiliadoLider(b);
    if (aEsLider !== bEsLider) return aEsLider ? -1 : 1;

    const fechaA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const fechaB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (fechaA !== fechaB) return fechaA - fechaB;

    return normalizar(`${a.nombres} ${a.apellidos}`).localeCompare(
      normalizar(`${b.nombres} ${b.apellidos}`),
    );
  });

  const MenuAcciones = ({ afiliado }: { afiliado: Afiliado }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              tema
                ? tema.btnText
                : "text-gray-500 dark:text-gray-400"
            }`}
            aria-label="Acciones"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setAfiliadoCarnet(afiliado)}
          >
            <IdCard className="h-4 w-4" />
            Descargar carnet
          </DropdownMenuItem>
          {puedeEditar && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => onEditar(afiliado)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </>
          )}
          {puedeEliminar && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                onClick={() => eliminar(afiliado, onDataChange)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const theadClass = tema
    ? `${tema.theadBg} ${tema.theadText}`
    : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300";

  if (formato === "tabla") {
    return (
      <>
        <div className={embebido ? "overflow-x-auto" : "overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-700"}>
          <table className="min-w-full bg-white dark:bg-neutral-900 text-xs">
            <thead
              className={`${theadClass}${embebido ? " border-b border-black/5 dark:border-white/10" : ""}`}
            >
              <tr>
                <th
                  className={columnaNoFijaEncabezado(
                    tema ? tema.theadBg : FONDO_ENCABEZADO_TABLA,
                    `px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`,
                  )}
                >
                  No.
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Nombre
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  DPI
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Teléfono
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Edad
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Sexo
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Ubicación
                </th>
                <th className={`px-3 py-2.5 text-left font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Padrón
                </th>
                <th className={`px-3 py-2.5 text-right font-bold uppercase ${tema ? tema.theadText : ""}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {afiliadosOrdenados.map((afiliado, index) => (
                <tr
                  key={afiliado.id}
                  className={`group ${
                    tema
                      ? tema.filaHover
                      : "hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                  } ${
                    esAfiliadoLider(afiliado) && tema
                      ? tema.theadBg
                      : esAfiliadoLider(afiliado)
                        ? "bg-sky-100 dark:bg-sky-950/40"
                        : ""
                  }`}
                >
                  <td
                    className={columnaNoFijaCelda(
                      esAfiliadoLider(afiliado) && tema
                        ? `${tema.theadBg} group-hover:brightness-[0.98] dark:group-hover:brightness-110`
                        : esAfiliadoLider(afiliado)
                          ? "bg-sky-100 dark:bg-sky-950/40 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/40"
                          : tema
                            ? tema.filaHoverSticky
                            : FONDO_CELDA_TABLA,
                      "px-3 py-2 whitespace-nowrap font-bold text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold uppercase text-gray-900 dark:text-gray-100">
                    {esAfiliadoLider(afiliado) ? "Líder: " : ""}
                    {afiliado.nombres} {afiliado.apellidos}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold font-mono">
                    {afiliado.dpi ? formatearDpi(afiliado.dpi) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <TelefonoInline
                      telefono={afiliado.telefono || ""}
                      pillClassName={tema?.telefonoPill}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold">
                    {calcularEdadLabel(afiliado.nacimiento)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold">
                    {afiliado.sexo || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold">
                    {afiliado.lugar_nombre || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {afiliado.empadronado ? (
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                        {afiliado.no_padron || "—"}
                      </span>
                    ) : (
                      <span className="font-bold text-red-600 dark:text-red-400 uppercase">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <MenuAcciones afiliado={afiliado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CarnetAfiliacion
          afiliado={afiliadoCarnet}
          open={!!afiliadoCarnet}
          onClose={() => setAfiliadoCarnet(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {afiliadosOrdenados.map((afiliado, index) => {
          const esLider = esAfiliadoLider(afiliado);
          const telefono = afiliado.telefono || "";

          return (
            <article
              key={afiliado.id}
              className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-neutral-900 ${
                tema?.cardBorder ??
                "border-sky-200 dark:border-sky-800/60"
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-3 ${
                  tema?.theadBg ?? "bg-sky-50 dark:bg-sky-950/30"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h3
                    className={`truncate text-xs font-bold uppercase leading-snug ${
                      esLider
                        ? "text-gray-900 dark:text-gray-100"
                        : tema?.theadText ?? "text-slate-800 dark:text-sky-100"
                    }`}
                  >
                    {index + 1}. {esLider ? "Líder: " : ""}
                    {afiliado.nombres} {afiliado.apellidos}
                  </h3>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded border border-white/60 bg-white/70 px-2 py-0.5 dark:border-white/10 dark:bg-black/20">
                  <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">
                    {calcularEdadLabel(afiliado.nacimiento)}
                  </span>
                </span>
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                    afiliado.sexo === "M"
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800/50 dark:bg-pink-900/20 dark:text-pink-400"
                  }`}
                >
                  {afiliado.sexo || "—"}
                </span>
                {(puedeEditar || puedeEliminar) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                        tema
                          ? tema.btnText
                          : "text-slate-600 dark:text-sky-200"
                      }`}
                      aria-label="Acciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {puedeEditar && (
                      <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onClick={() => onEditar(afiliado)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {puedeEliminar && (
                      <>
                        {puedeEditar && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                          onClick={() => eliminar(afiliado, onDataChange)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <span>
                    <span className="font-bold text-gray-500 dark:text-gray-400">
                      DPI:
                    </span>{" "}
                    <span className="font-mono font-medium">
                      {afiliado.dpi ? formatearDpi(afiliado.dpi) : "—"}
                    </span>
                  </span>
                  <span className="text-xs leading-none text-gray-500 dark:text-gray-400" aria-hidden>
                    ●
                  </span>
                  {afiliado.empadronado ? (
                    <span>
                      <span className="font-bold text-gray-500 dark:text-gray-400">
                        Padrón:
                      </span>{" "}
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                        {afiliado.no_padron || "—"}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold uppercase text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      No empadronado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate text-left">
                    {afiliado.lugar_nombre || "—"}
                  </span>
                </div>
              </div>

              <footer className="mt-auto">
                <TelefonoFooter
                  telefono={telefono}
                  onCarnet={() => setAfiliadoCarnet(afiliado)}
                  tema={tema}
                />
              </footer>
            </article>
          );
        })}
      </div>
      <CarnetAfiliacion
        afiliado={afiliadoCarnet}
        open={!!afiliadoCarnet}
        onClose={() => setAfiliadoCarnet(null)}
      />
    </>
  );
}
