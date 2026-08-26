"use client";

import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { Button } from "@/components/ui/button";
import TextoAnimado from "@/components/ui/Typeanimation";
import { Dialog, DialogPanel, TransitionChild } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  ArrowLeft,
  ChartColumn,
  ChartColumnIncreasing,
  ChevronsLeft,
  LayoutDashboard,
  LayoutGrid,
  List,
  Mail,
  MailOpen,
  Pencil,
  SquarePen,
  Table2,
  UserPlus,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import HoverMorphIcon from "@/components/ui/HoverMorphIcon";
import type { Afiliado, Lider } from "./esquemas";
import { esUsuarioSede } from "./esquemas";
import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import type { FormatoVista } from "./Tabla";
import Tabla from "./Tabla";
import {
  clasesBotonEntrar,
  temaDesdeLider,
  textoHoverDeTema,
} from "./temaPestana";
import MensajesUsuario from "./MensajesUsuario";

function BtnAtrasMorph({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HoverMorphIcon
        idle={ChevronsLeft}
        hover={ArrowLeft}
        size={16}
        active={hovered}
      />
      Atrás
    </button>
  );
}

function BtnAccionMorph({
  label,
  idle,
  hover,
  onClick,
  className,
  size = 16,
}: {
  label: string;
  idle: unknown;
  hover: unknown;
  onClick: () => void;
  className?: string;
  size?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HoverMorphIcon
        idle={idle}
        hover={hover}
        size={size}
        active={hovered}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SwitchTabMorph({
  label,
  idle,
  hover,
  activo,
  activoClass,
  inactivoClass,
  onClick,
}: {
  label: string;
  idle: unknown;
  hover: unknown;
  activo: boolean;
  activoClass: string;
  inactivoClass: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[10px] font-bold transition-colors whitespace-nowrap sm:gap-2 sm:px-3 sm:text-xs md:flex-initial md:px-4 md:py-2.5 md:text-sm ${
        activo ? activoClass : inactivoClass
      }`}
    >
      <HoverMorphIcon
        idle={idle}
        hover={hover}
        size={18}
        active={hovered || activo}
        className="md:[&_svg]:h-5 md:[&_svg]:w-5"
      />
      <span>{label}</span>
    </button>
  );
}

const GIFS_DISPONIBLES = [
  "/gif/afiliados/gif0.gif",
  "/gif/afiliados/gif1.gif",
  "/gif/afiliados/gif2.gif",
  "/gif/afiliados/gif3.gif",
  "/gif/afiliados/gif4.gif",
  "/gif/afiliados/gif5.gif",
  "/gif/afiliados/logo.gif",
  "/gif/afiliados/pensando.gif",
  "/gif/afiliados/fire.gif",
  "/gif/afiliados/risa.gif",
  "/gif/afiliados/payaso.gif",
  "/gif/afiliados/calculando.gif",
];

function elegirGifAleatorio(excluido?: string) {
  const opciones = excluido
    ? GIFS_DISPONIBLES.filter((g) => g !== excluido)
    : GIFS_DISPONIBLES;
  return (
    opciones[Math.floor(Math.random() * opciones.length)] || GIFS_DISPONIBLES[0]
  );
}

function normalizarNombreAfiliado(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function ordenarAfiliados(afiliados: Afiliado[], lider: Lider) {
  const nombreLider = normalizarNombreAfiliado(
    `${lider.nombres} ${lider.apellidos}`,
  );
  const esAfiliadoLider = (afiliado: Afiliado) =>
    normalizarNombreAfiliado(`${afiliado.nombres} ${afiliado.apellidos}`) ===
    nombreLider;

  return [...afiliados].sort((a, b) => {
    const aEsLider = esAfiliadoLider(a);
    const bEsLider = esAfiliadoLider(b);
    if (aEsLider !== bEsLider) return aEsLider ? -1 : 1;

    const fechaA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const fechaB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (fechaA !== fechaB) return fechaA - fechaB;

    return normalizarNombreAfiliado(`${a.nombres} ${a.apellidos}`).localeCompare(
      normalizarNombreAfiliado(`${b.nombres} ${b.apellidos}`),
    );
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lider: Lider | null;
  onEditar: (afiliado: Afiliado) => void;
  /** Editar perfil del líder/sede (solo admin/super). */
  onEditarUsuario?: (lider: Lider) => void;
  onAnadirAfiliado: (liderId: string, isFirstMember?: boolean) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
  afiliadosSimulados?: Afiliado[];
  embedded?: boolean;
  /** Si se pasa, muestra botón Atrás en modo embebido (p. ej. al abrir desde un líder). */
  onBack?: () => void;
  /** Búsqueda controlada desde la barra de la pestaña. */
  busqueda?: string;
  onBusquedaChange?: (valor: string) => void;
  ocultarBuscador?: boolean;
}

type Vista = "miembros" | "estadisticas" | "mensajes";

const vistaEase = [0.25, 0.46, 0.45, 0.94] as const;

export default function Celula({
  isOpen,
  onClose,
  lider,
  onEditar,
  onEditarUsuario,
  onAnadirAfiliado,
  onDataChange,
  rolUsuarioSesion,
  afiliadosSimulados,
  embedded = false,
  onBack,
  busqueda: busquedaProp,
  onBusquedaChange,
  ocultarBuscador = false,
}: Props) {
  const [vistaActual, setVistaActual] = useState<Vista>("miembros");
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const busqueda = busquedaProp ?? busquedaLocal;
  const setBusqueda = onBusquedaChange ?? setBusquedaLocal;
  const [formatoVista, setFormatoVista] = useState<FormatoVista>("tabla");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(15);

  const esSimulado = !!lider?.simulado;
  const esSede = !!lider && esUsuarioSede(lider);
  const rolUpper = (rolUsuarioSesion || "").toUpperCase();
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  const esSedeSesion = rolUpper === "SEDE";
  const puedeGestionarIntegrantes = true;

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const META_CELULA = config?.meta_celula ?? 15;
  const META_MINIMA = config?.meta_celula_minima ?? 10;

  const { data: afiliadosQuery = [], isLoading: isLoadingQuery } = useQuery({
    queryKey: ["afiliados-lider", lider?.id],
    queryFn: async () => {
      console.time(`⏱️ fetch /api/afiliados?liderId=${lider?.id}`);
      const res = await fetch(`/api/afiliados?liderId=${lider?.id}`);
      const data = await res.json();
      console.timeEnd(`⏱️ fetch /api/afiliados?liderId=${lider?.id}`);
      if (!res.ok) throw new Error(data.error || "Error cargando afiliados");
      return data;
    },
    enabled: (isOpen || embedded) && !!lider?.id && !esSimulado,
  });

  const afiliadosDelLider = esSimulado
    ? (afiliadosSimulados ?? [])
    : afiliadosQuery;
  const isLoading = esSimulado ? false : isLoadingQuery;

  const term = busqueda.trim().toLowerCase();
  const afiliadosFiltrados = useMemo(() => {
    if (!term) return afiliadosDelLider;
    return afiliadosDelLider.filter(
      (a: Afiliado) =>
        a.nombres.toLowerCase().includes(term) ||
        a.apellidos.toLowerCase().includes(term) ||
        a.dpi.includes(term),
    );
  }, [afiliadosDelLider, term]);

  const afiliadosOrdenados = useMemo(
    () => (lider ? ordenarAfiliados(afiliadosFiltrados, lider) : []),
    [afiliadosFiltrados, lider],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, itemsPerPage, lider?.id, formatoVista]);

  const effectiveItemsPerPage =
    itemsPerPage === "all"
      ? Math.max(afiliadosOrdenados.length, 1)
      : itemsPerPage;
  const totalPages = Math.max(
    1,
    Math.ceil(afiliadosOrdenados.length / effectiveItemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const afiliadosPaginados = useMemo(() => {
    if (itemsPerPage === "all") return afiliadosOrdenados;
    const startIndex = (currentPage - 1) * effectiveItemsPerPage;
    return afiliadosOrdenados.slice(
      startIndex,
      startIndex + effectiveItemsPerPage,
    );
  }, [
    afiliadosOrdenados,
    currentPage,
    itemsPerPage,
    effectiveItemsPerPage,
  ]);

  if (!lider) return null;

  const tema = temaDesdeLider(lider, esSede);
  /** Mismo estilo que el botón Entrar de la lista, con color del rol. */
  const btnAtrasClass = clasesBotonEntrar(tema);
  const totalEnGrupo = afiliadosDelLider.length;
  const objetivo = META_CELULA;
  const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);

  let nivelCompromiso = "";
  let textoColor = "";
  let colorBarra = "";
  let gifUrl = "/gif/afiliados/gif1.gif";
  let mensaje = "";

  if (esSede) {
    textoColor = "text-blue-600 dark:text-blue-400";
    colorBarra = "bg-blue-600";
    mensaje = "";
  } else if (totalEnGrupo > META_CELULA) {
    nivelCompromiso = "Alto";
    colorBarra = "bg-green-500";
    textoColor = "text-green-600 dark:text-green-400";
    mensaje = `🏆 ¡Objetivo superado! ${totalEnGrupo} miembros. ¡Excelente trabajo!`;
    gifUrl = "/gif/afiliados/gif5.gif";
  } else if (totalEnGrupo === META_CELULA) {
    nivelCompromiso = "Cumple";
    colorBarra = "bg-blue-600";
    textoColor = "text-blue-600 dark:text-blue-400";
    mensaje = `🏆 ¡Objetivo alcanzado! ${totalEnGrupo} miembros. ¡Excelente trabajo!`;
    gifUrl = "/gif/afiliados/gif5.gif";
  } else if (totalEnGrupo >= META_MINIMA && totalEnGrupo < META_CELULA) {
    nivelCompromiso = "Medio";
    colorBarra = "bg-yellow-500";
    textoColor = "text-yellow-600 dark:text-yellow-400";
    mensaje = `😎 ¡Casi llegamos a la meta! Somos ${totalEnGrupo} de ${objetivo}.`;
    gifUrl = "/gif/afiliados/gif3.gif";
  } else {
    nivelCompromiso = "Bajo";
    colorBarra = "bg-red-500";
    textoColor = "text-red-600 dark:text-red-400";
    mensaje = `🚀 ¡Vamos por buen camino! Somos ${totalEnGrupo} de ${objetivo}.`;
    gifUrl = "/gif/afiliados/gif2.gif";

    if (totalEnGrupo === 1) {
      mensaje = `🎉 ¡Líder registrado! Añade a tus familiares y amigos.`;
    } else if (totalEnGrupo === 0 && !isLoading) {
      mensaje = `👋 ¡Hola ${lider.nombres}! Inicia tu grupo registrándote a ti mismo.`;
      colorBarra = "bg-gray-300";
      textoColor = "text-gray-500 dark:text-gray-400";
    }
  }

  const TABS = [
    {
      id: "miembros" as const,
      label: "Afiliados",
      idle: Users,
      hover: UsersRound,
    },
    {
      id: "estadisticas" as const,
      label: "Estadísticas",
      idle: ChartColumn,
      hover: ChartColumnIncreasing,
    },
    {
      id: "mensajes" as const,
      label: "Mensajes",
      idle: Mail,
      hover: MailOpen,
    },
  ];

  const switchTrackClass =
    "flex min-w-0 gap-1 rounded-lg bg-gray-200/70 p-1 dark:bg-neutral-700/60";
  const switchActivoClass = `${tema.activeToggle} shadow-sm`;
  const switchInactivoClass = `text-gray-500 dark:text-gray-400 ${textoHoverDeTema(tema)}`;

  const panelContent = (
    <>
      <div className="sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white px-2 pt-1 pb-2 md:py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
          <div className="relative flex w-full items-center justify-center md:hidden">
            <h3
              className={`max-w-[88%] truncate text-center text-lg font-bold uppercase ${tema.btnText}`}
            >
              {lider.nombres} {lider.apellidos}
            </h3>
            {isLoading && (
              <Loader2 className="absolute right-0 h-4 w-4 shrink-0 animate-spin text-blue-600" />
            )}
          </div>

          <div className="hidden min-w-0 items-center gap-2 md:flex md:flex-1">
            {embedded && onBack && (
              <BtnAtrasMorph
                onClick={onBack}
                className={btnAtrasClass}
              />
            )}

            <h3
              className={`min-w-0 flex-1 truncate text-2xl font-bold uppercase ${tema.btnText}`}
            >
              {lider.nombres} {lider.apellidos}
            </h3>

            {esSede && esAdminOSuper && onEditarUsuario && (
              <BtnAccionMorph
                label="Editar Sede"
                idle={Pencil}
                hover={SquarePen}
                size={20}
                onClick={() => onEditarUsuario(lider)}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-blue-400 bg-blue-50 px-3 font-bold uppercase text-sm text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70"
              />
            )}

            {isLoading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
            )}

            {!embedded && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="inline-flex h-10 w-10 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </Button>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            {embedded && onBack && (
              <BtnAtrasMorph
                onClick={onBack}
                className={`${btnAtrasClass} md:hidden`}
              />
            )}

            <div className={`${switchTrackClass} min-w-0 flex-1 md:flex-initial`}>
              {TABS.map((tab) => (
                <SwitchTabMorph
                  key={tab.id}
                  label={tab.label}
                  idle={tab.idle}
                  hover={tab.hover}
                  activo={vistaActual === tab.id}
                  activoClass={switchActivoClass}
                  inactivoClass={switchInactivoClass}
                  onClick={() => setVistaActual(tab.id)}
                />
              ))}
            </div>

            {!embedded && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 md:hidden"
              >
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-2 ${embedded ? "py-2" : ""}`}>
        <div className="w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isLoading ? "loading" : vistaActual}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: vistaEase }}
            >
          {isLoading ? (
            <div className="flex flex-col gap-4 py-4 w-full animate-pulse">
              <div className="w-full h-32 bg-gray-200 dark:bg-neutral-800 rounded-xl mb-6"></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="w-full md:w-96 h-10 bg-gray-200 dark:bg-neutral-800 rounded-md"></div>
                <div className="w-full md:w-48 h-12 bg-gray-200 dark:bg-neutral-800 rounded-md"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-neutral-800 h-44 rounded-lg border border-gray-100 dark:border-neutral-700"
                  ></div>
                ))}
              </div>
            </div>
          ) : vistaActual === "miembros" ? (
            <>
              {!esSede && (
                <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row">
                  <div className="w-full md:flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                        Nivel de compromiso:{" "}
                        <span className={textoColor}>{nivelCompromiso}</span>
                      </span>
                      <span className={`text-sm font-black ${textoColor}`}>
                        {totalEnGrupo} / {objetivo}
                      </span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full border bg-gray-100 shadow-inner dark:border-neutral-700 dark:bg-neutral-800">
                      <div
                        className={`${colorBarra} h-full transition-all duration-1000`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>

                    <div className="mt-2 hidden text-center md:block">
                      <span className="inline-block rounded-full border bg-gray-50 px-4 py-1 text-xs font-bold text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-3 rounded-lg border bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-800 md:w-auto">
                    <div className="flex-1 md:hidden">
                      <span className="text-[10px] font-bold uppercase leading-tight text-gray-700 dark:text-gray-300">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>

                    <div className="mx-auto shrink-0 md:mx-0">
                      <Image
                        key={gifUrl}
                        src={gifUrl}
                        alt="Status"
                        width={100}
                        height={100}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!ocultarBuscador && (
                <p className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                  Total:{" "}
                  <span className={`tabular-nums ${tema.btnText}`}>
                    {afiliadosOrdenados.length.toLocaleString()}
                  </span>
                </p>
              )}

              <div
                className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 border-t-4 ${tema.borderTop}`}
              >
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center">
                  <div
                    className={`order-1 flex w-full min-w-0 gap-2 sm:order-2 sm:w-auto sm:shrink-0 ${ocultarBuscador ? "sm:ml-auto" : ""}`}
                  >
                    <div
                      className={`${switchTrackClass} flex h-11 w-2/3 min-w-0 shrink-0 items-center sm:w-auto [&_button]:sm:flex-initial`}
                    >
                      <SwitchTabMorph
                        label="Lista"
                        idle={Table2}
                        hover={List}
                        activo={formatoVista === "tabla"}
                        activoClass={switchActivoClass}
                        inactivoClass={switchInactivoClass}
                        onClick={() => setFormatoVista("tabla")}
                      />
                      <SwitchTabMorph
                        label="Tarjetas"
                        idle={LayoutGrid}
                        hover={LayoutDashboard}
                        activo={formatoVista === "tarjetas"}
                        activoClass={switchActivoClass}
                        inactivoClass={switchInactivoClass}
                        onClick={() => setFormatoVista("tarjetas")}
                      />
                    </div>
                    {puedeGestionarIntegrantes && (
                      <BtnAccionMorph
                        label={
                          !esSede && totalEnGrupo === 0
                            ? "Registrarme"
                            : "Añadir"
                        }
                        idle={UserPlus}
                        hover={UserRoundPlus}
                        onClick={() =>
                          onAnadirAfiliado(
                            lider.id,
                            !esSede && totalEnGrupo === 0,
                          )
                        }
                        className={`flex h-11 w-1/3 min-w-0 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-semibold uppercase whitespace-nowrap transition-all duration-300 ease-in-out sm:w-auto sm:min-w-[6.5rem] sm:px-3 sm:text-xs ${
                          !esSede && totalEnGrupo === 0
                            ? "animate-pulse border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-950/70"
                            : `${tema.btnPrimary} ${tema.btnHover}`
                        }`}
                      />
                    )}
                  </div>
                  {!ocultarBuscador && (
                    <div className="relative order-2 min-w-0 w-full sm:order-1 sm:min-w-[12rem] sm:flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o DPI..."
                        className={`h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 ${tema.focusRing}`}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={formatoVista}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: vistaEase }}
                      className={
                        formatoVista === "tabla" ? "px-0 pb-0" : "p-3 pt-2"
                      }
                    >
                      <Tabla
                        lider={lider}
                        afiliados={afiliadosPaginados}
                        onEditar={onEditar}
                        onDataChange={onDataChange}
                        rolUsuarioSesion={rolUsuarioSesion}
                        formato={formatoVista}
                        tema={tema}
                        embebido
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {afiliadosOrdenados.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 px-3 py-3 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        aria-label="Página anterior"
                        className={`rounded p-1 disabled:cursor-not-allowed disabled:opacity-30 ${tema.pagination} ${tema.btnHover}`}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || itemsPerPage === "all"}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="min-w-[3rem] text-center font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        type="button"
                        aria-label="Página siguiente"
                        className={`rounded p-1 disabled:cursor-not-allowed disabled:opacity-30 ${tema.pagination} ${tema.btnHover}`}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={
                          currentPage === totalPages || itemsPerPage === "all"
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemsPerPage(val === "all" ? "all" : parseInt(val, 10));
                      }}
                      className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300"
                      aria-label="Cantidad por página"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={45}>45</option>
                      <option value="all">Todos</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          ) : vistaActual === "mensajes" ? (
            <div
              className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 border-t-4 ${tema.borderTop}`}
            >
              <MensajesUsuario
                userId={lider.id}
                nivelCompromiso={nivelCompromiso}
                tema={tema}
              />
            </div>
          ) : (
            <div className="flex w-full flex-col gap-6 pt-4">
              <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="flex h-full flex-col justify-start rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <EstadisticasEdades afiliados={afiliadosDelLider} />
                </div>
                <div className="flex h-full flex-col justify-start rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <EstadisticasReligiones afiliados={afiliadosDelLider} />
                </div>
                <div className="flex h-full flex-col justify-start rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <EstadisticasPoliticas afiliados={afiliadosDelLider} />
                </div>
              </div>
              <div className="flex w-full flex-col justify-start rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <EstadisticasLugares afiliados={afiliadosDelLider} />
              </div>
            </div>
          )}

          {!embedded && (
            <div className="mt-8 mb-4 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full md:w-auto md:min-w-[220px] h-12 text-sm font-bold uppercase"
              >
                Cerrar
              </Button>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col overflow-hidden">
        {panelContent}
      </div>
    );
  }

  return (
    <Fragment>
      <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-0">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-10 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-10 scale-95"
          >
            <DialogPanel className="w-screen h-screen bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
              {panelContent}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Fragment>
  );
}
