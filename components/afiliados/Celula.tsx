"use client";

import { useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import type { Afiliado, Lider } from "./esquemas";
import Tabla from "./Tabla";
import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import TextoAnimado from "@/components/ui/Typeanimation";
import Image from "next/image";
import { Dialog, TransitionChild, DialogPanel } from "@headlessui/react";
import { Users, BarChart3, X, UserPlus, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lider: Lider | null;
  onEditar: (afiliado: Afiliado) => void;
  onAnadirAfiliado: (liderId: string, isFirstMember?: boolean) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
  afiliadosSimulados?: Afiliado[];
  embedded?: boolean;
}

type Vista = "miembros" | "estadisticas";

export default function Celula({
  isOpen,
  onClose,
  lider,
  onEditar,
  onAnadirAfiliado,
  onDataChange,
  rolUsuarioSesion,
  afiliadosSimulados,
  embedded = false,
}: Props) {
  const [vistaActual, setVistaActual] = useState<Vista>("miembros");
  const [busqueda, setBusqueda] = useState("");

  const esSimulado = !!lider?.simulado;

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
    ? afiliadosSimulados ?? []
    : afiliadosQuery;
  const isLoading = esSimulado ? false : isLoadingQuery;

  if (!lider) return null;

  const afiliadosFiltrados =
    busqueda.length >= 2
      ? afiliadosDelLider.filter(
          (a: Afiliado) =>
            a.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.dpi.includes(busqueda),
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

  if (totalEnGrupo > META_CELULA) {
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
      <div className="flex justify-between items-center px-2 py-3 border-b dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h3 className="text-sm md:text-xl font-bold uppercase truncate dark:text-white">
            {lider.nombres} {lider.apellidos}
          </h3>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
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

      <div className="px-2 py-2 border-b dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex justify-center">
        <div className="flex bg-gray-200 dark:bg-neutral-800 p-1 rounded-lg gap-1 w-full max-w-md">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActual(tab.id as Vista)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold transition-all ${
                vistaActual === tab.id
                  ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-neutral-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
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
                  <div key={i} className="bg-gray-200 dark:bg-neutral-800 h-44 rounded-lg border border-gray-100 dark:border-neutral-700"></div>
                ))}
              </div>
            </div>
          ) : vistaActual === "miembros" ? (
            <>
              <div className="mb-6 p-4 border dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                      Nivel de compromiso: <span className={textoColor}>{nivelCompromiso}</span>
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

                  <div className="shrink-0">
                    <Image
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
                <Button
                  className={`font-bold h-12 px-6 shadow-md transition-transform hover:scale-105 w-full md:w-auto uppercase text-xs ${
                    totalEnGrupo === 0
                      ? "bg-green-600 animate-pulse"
                      : "bg-blue-700"
                  }`}
                  onClick={() =>
                    onAnadirAfiliado(lider.id, totalEnGrupo === 0)
                  }
                >
                  {totalEnGrupo === 0 ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" /> Registrarme
                      como Líder
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" /> Añadir
                      Integrante
                    </>
                  )}
                </Button>
              </div>

              <Tabla
                lider={lider}
                afiliados={afiliadosFiltrados}
                onEditar={onEditar}
                onDataChange={onDataChange}
                rolUsuarioSesion={rolUsuarioSesion}
              />
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full pt-4">
              <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <EstadisticasEmpadronados
                  afiliados={afiliadosDelLider}
                />
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
