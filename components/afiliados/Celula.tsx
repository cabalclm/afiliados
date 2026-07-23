"use client";

import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { Button } from "@/components/ui/button";
import TextoAnimado from "@/components/ui/Typeanimation";
import { Dialog, DialogPanel, TransitionChild } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
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
import { Fragment, useEffect, useState } from "react";
import type { Afiliado, Lider } from "./esquemas";
import { esUsuarioSede } from "./esquemas";
import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import type { FormatoVista } from "./Tabla";
import Tabla from "./Tabla";

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
  const [formatoVista, setFormatoVista] = useState<FormatoVista>("tarjetas");
  const [gifSede, setGifSede] = useState(() => elegirGifAleatorio());

  const esSimulado = !!lider?.simulado;
  const esSede = !!lider && esUsuarioSede(lider);
  const rolUpper = (rolUsuarioSesion || "").toUpperCase();
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  const esSedeSesion = rolUpper === "SEDE";
  /** SEDE: gestiona integrantes solo en la célula Sede; en el resto solo consulta. */
  const puedeGestionarIntegrantes = !esSedeSesion || esSede;

  useEffect(() => {
    if (!esSede) return;
    if (!isOpen && !embedded) return;
    setGifSede((prev) => elegirGifAleatorio(prev));
  }, [isOpen, embedded, lider?.id, esSede]);

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

  if (!lider) return null;

  const term = busqueda.trim().toLowerCase();
  const afiliadosFiltrados = term
    ? afiliadosDelLider.filter(
        (a: Afiliado) =>
          a.nombres.toLowerCase().includes(term) ||
          a.apellidos.toLowerCase().includes(term) ||
          a.dpi.includes(term),
      )
    : afiliadosDelLider;

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
    gifUrl = gifSede;
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
              className="shrink-0 h-8 gap-1.5 font-bold uppercase text-[10px] border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar Sede</span>
            </Button>
          )}
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          )}
        </div>

        <div className="flex bg-gray-200 dark:bg-neutral-800 p-1 rounded-lg gap-1 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActual(tab.id as Vista)}
              className={`flex items-center justify-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
                vistaActual === tab.id
                  ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-neutral-700"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
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
              <div className="mb-6 p-4 border dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:flex-1">
                  {esSede ? (
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                        Afiliados en sede
                      </span>
                      <span
                        className={`text-4xl md:text-5xl font-black leading-none ${textoColor}`}
                      >
                        {totalEnGrupo}
                      </span>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}

                  {!esSede && (
                    <div className="hidden md:block text-center mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-bold bg-gray-50 dark:bg-neutral-800 px-4 py-1 rounded-full border dark:border-neutral-700 inline-block">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 p-2 rounded-lg border dark:border-neutral-700 w-full md:w-auto shrink-0">
                  {!esSede && (
                    <div className="md:hidden flex-1">
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold leading-tight uppercase">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                  )}

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

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                {!ocultarBuscador && (
                  <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o DPI..."
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                )}
                <div
                  className={`flex items-center gap-2 w-full md:w-auto ${ocultarBuscador ? "ml-auto" : ""}`}
                >
                  <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg border dark:border-neutral-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormatoVista("tarjetas")}
                      title="Ver tarjetas"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        formatoVista === "tarjetas"
                          ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoVista("tabla")}
                      title="Ver tabla"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        formatoVista === "tabla"
                          ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <Table2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Lista</span>
                    </button>
                  </div>
                  {puedeGestionarIntegrantes && (
                    <Button
                      variant="outline"
                      className={`font-bold h-[42px] px-4 uppercase text-xs bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40 flex-1 md:flex-none ${
                        !esSede && totalEnGrupo === 0
                          ? "border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950/40 animate-pulse"
                          : ""
                      }`}
                      onClick={() =>
                        onAnadirAfiliado(lider.id, !esSede && totalEnGrupo === 0)
                      }
                    >
                      {!esSede && totalEnGrupo === 0 ? (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" /> Registrarme como
                          Líder
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" /> Añadir Integrante
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <Tabla
                lider={lider}
                afiliados={afiliadosFiltrados}
                onEditar={onEditar}
                onDataChange={onDataChange}
                rolUsuarioSesion={rolUsuarioSesion}
                formato={formatoVista}
              />
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
      <div className="w-full flex flex-col bg-white dark:bg-neutral-950 rounded-lg border dark:border-neutral-800 overflow-hidden">
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
