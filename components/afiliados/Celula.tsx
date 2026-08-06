"use client";

import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { Button } from "@/components/ui/button";
import TextoAnimado from "@/components/ui/Typeanimation";
import { Dialog, DialogPanel, TransitionChild } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Pencil,
  Search,
  Table2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { Afiliado, Lider } from "./esquemas";
import { esUsuarioSede } from "./esquemas";
import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import type { FormatoVista } from "./Tabla";
import Tabla from "./Tabla";
import { temaDesdeLider } from "./temaPestana";

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

type Vista = "miembros" | "estadisticas";

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
    { id: "miembros", label: "Miembros", icon: Users },
    { id: "estadisticas", label: "Estadísticas Generales", icon: BarChart3 },
  ];

  const panelContent = (
    <>
      <div className="flex items-center gap-2 px-2 py-3 border-b dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950 sticky top-0 z-20">
        {embedded && onBack && (
          <Button
            type="button"
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="shrink-0 h-9 gap-1.5 font-bold uppercase text-[10px] text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
        )}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-sm md:text-xl font-bold uppercase truncate dark:text-white">
            {lider.nombres} {lider.apellidos}
          </h3>
          {esSede && esAdminOSuper && onEditarUsuario && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditarUsuario(lider)}
              className="shrink-0 h-10 md:h-11 gap-2 font-bold uppercase text-xs md:text-sm border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70"
            >
              <Pencil className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Editar Sede</span>
            </Button>
          )}
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          )}
        </div>

        <div className="flex bg-gray-200 dark:bg-neutral-800 p-1 md:p-1.5 rounded-lg gap-1 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActual(tab.id as Vista)}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-md text-sm md:text-base font-bold transition-all whitespace-nowrap ${
                vistaActual === tab.id
                  ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-neutral-700"
              }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {!embedded && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 h-10 w-10 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-2 ${embedded ? "py-2" : ""}`}>
        <div className="w-full">
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
                <div className="mb-6 p-4 border dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                        Nivel de compromiso:{" "}
                        <span className={textoColor}>{nivelCompromiso}</span>
                      </span>
                      <span className={`text-sm font-black ${textoColor}`}>
                        {totalEnGrupo} / {objetivo}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-4 overflow-hidden shadow-inner border dark:border-neutral-700">
                      <div
                        className={`${colorBarra} h-full transition-all duration-1000`}
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>

                    <div className="hidden md:block text-center mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-bold bg-gray-50 dark:bg-neutral-800 px-4 py-1 rounded-full border dark:border-neutral-700 inline-block">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 p-2 rounded-lg border dark:border-neutral-700 w-full md:w-auto shrink-0">
                    <div className="md:hidden flex-1">
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold leading-tight uppercase">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>

                    <div className="shrink-0 mx-auto md:mx-0">
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
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Total:{" "}
                  <span className={`tabular-nums ${tema.btnText}`}>
                    {afiliadosOrdenados.length.toLocaleString()}
                  </span>
                </p>
              )}

              <div
                className={`overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm border-t-4 ${tema.borderTop}`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 ${tema.theadBg}`}
                >
                  <div
                    className={`flex w-full gap-2 order-1 sm:order-2 sm:w-auto sm:flex-shrink-0 ${ocultarBuscador ? "sm:ml-auto" : ""}`}
                  >
                    <div
                      className={`flex w-1/2 sm:w-auto sm:shrink-0 sm:min-w-[15.5rem] min-w-0 h-11 items-center justify-center gap-0.5 sm:gap-1 rounded-lg border bg-white dark:bg-neutral-900 px-1 sm:px-2.5 text-xs sm:text-sm font-bold uppercase ${tema.btnOutline}`}
                    >
                      <button
                        type="button"
                        onClick={() => setFormatoVista("tabla")}
                        title="Ver lista"
                        className={`inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 sm:gap-2 min-w-0 sm:min-w-fit px-1 sm:px-2 py-1.5 rounded-md whitespace-nowrap transition-all duration-300 ease-in-out ${
                          formatoVista === "tabla"
                            ? tema.btnText
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                      >
                        <Table2 className="w-4 h-4 shrink-0" />
                        <span className="truncate sm:overflow-visible sm:text-clip">
                          Lista
                        </span>
                      </button>
                      <span className="text-gray-300 dark:text-neutral-600 shrink-0 px-0.5">
                        |
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormatoVista("tarjetas")}
                        title="Ver tarjetas"
                        className={`inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 sm:gap-2 min-w-0 sm:min-w-fit px-1 sm:px-2 py-1.5 rounded-md whitespace-nowrap transition-all duration-300 ease-in-out ${
                          formatoVista === "tarjetas"
                            ? tema.btnText
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4 shrink-0" />
                        <span className="truncate sm:overflow-visible sm:text-clip">
                          Tarjetas
                        </span>
                      </button>
                    </div>
                    {puedeGestionarIntegrantes && (
                      <button
                        type="button"
                        className={`flex w-1/2 sm:w-auto sm:shrink-0 sm:min-w-[11rem] min-w-0 h-11 items-center justify-center gap-1.5 rounded-lg border bg-white dark:bg-neutral-900 px-2 sm:px-3.5 text-[11px] sm:text-sm font-semibold uppercase whitespace-nowrap transition-all duration-300 ease-in-out ${
                          !esSede && totalEnGrupo === 0
                            ? "border-green-500 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950/50 animate-pulse"
                            : `${tema.btnOutline} ${tema.btnHover}`
                        }`}
                        onClick={() =>
                          onAnadirAfiliado(lider.id, !esSede && totalEnGrupo === 0)
                        }
                      >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span className="truncate sm:overflow-visible sm:text-clip">
                          {!esSede && totalEnGrupo === 0
                            ? "Registrarme"
                            : "Añadir Integrante"}
                        </span>
                      </button>
                    )}
                  </div>
                  {!ocultarBuscador && (
                    <div className="relative w-full order-2 sm:order-1 sm:flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o DPI..."
                        className={`pl-9 pr-4 py-2.5 h-11 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg w-full text-sm focus:outline-none focus:ring-2 ${tema.focusRing}`}
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
                  <div className="flex flex-wrap items-center justify-center gap-4 px-3 py-3 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        aria-label="Página anterior"
                        className={`p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed ${tema.pagination} ${tema.btnHover}`}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || itemsPerPage === "all"}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums min-w-[3rem] text-center">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        type="button"
                        aria-label="Página siguiente"
                        className={`p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed ${tema.pagination} ${tema.btnHover}`}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || itemsPerPage === "all"}
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
                      className="text-sm border border-gray-200 dark:border-neutral-700 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full pt-4">
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <EstadisticasEmpadronados afiliados={afiliadosDelLider} />
              </div>
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <EstadisticasReligiones afiliados={afiliadosDelLider} />
              </div>
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <EstadisticasEdades afiliados={afiliadosDelLider} />
              </div>
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <EstadisticasPoliticas afiliados={afiliadosDelLider} />
              </div>
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col md:col-span-2">
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
