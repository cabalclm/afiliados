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
import {
  Users,
  PieChart,
  BarChart3,
  MapPin,
  Target,
  X,
  UserPlus,
  Search,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lider: Lider | null;
  afiliados: Afiliado[];
  onEditar: (afiliado: Afiliado) => void;
  onAnadirAfiliado: (liderId: string, isFirstMember?: boolean) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
}

type Vista = "miembros" | "estadisticas";

export default function Celula({
  isOpen,
  onClose,
  lider,
  afiliados,
  onEditar,
  onAnadirAfiliado,
  onDataChange,
  rolUsuarioSesion,
}: Props) {
  const [vistaActual, setVistaActual] = useState<Vista>("miembros");
  const [busqueda, setBusqueda] = useState("");

  if (!lider) return null;

  const afiliadosDelLider =
    afiliados?.filter((a) => a.lider_id === lider.id) || [];

  const afiliadosFiltrados =
    busqueda.length >= 2
      ? afiliadosDelLider.filter(
          (a) =>
            a.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.dpi.includes(busqueda),
        )
      : afiliadosDelLider;

  const totalEnGrupo = afiliadosDelLider.length;
  const objetivo = 15;
  const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);

  let mensaje = "";
  let colorBarra = "bg-blue-600";
  let gifUrl = "/gif/afiliados/gif1.gif";

  if (totalEnGrupo === 0) {
    mensaje = `👋 ¡Hola ${lider.nombres}! Inicia tu grupo registrándote a ti mismo.`;
    colorBarra = "bg-gray-300";
  } else if (totalEnGrupo === 1) {
    mensaje = `🎉 ¡Líder registrado! Añade a tus familiares y amigos.`;
  } else if (totalEnGrupo <= 10) {
    mensaje = `🚀 ¡Vamos por buen camino! Somos ${totalEnGrupo} de ${objetivo}.`;
    colorBarra = "bg-yellow-600";
    gifUrl = "/gif/afiliados/gif2.gif";
  } else if (totalEnGrupo < 15) {
    mensaje = `😎 ¡Casi llegamos a la meta! Somos ${totalEnGrupo} de ${objetivo}.`;
    colorBarra = "bg-purple-600";
    gifUrl = "/gif/afiliados/gif3.gif";
  } else {
    mensaje = `🏆 ¡Objetivo alcanzado! ${totalEnGrupo} afiliados. ¡Excelente trabajo!`;
    colorBarra = "bg-green-500";
    gifUrl = "/gif/afiliados/gif5.gif";
  }

  const TABS = [
    { id: "miembros", label: "Miembros", icon: Users },
    { id: "estadisticas", label: "Estadísticas Generales", icon: BarChart3 },
  ];

  return (
    <Fragment>
      <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-10 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-10 scale-95"
          >
            <DialogPanel className="w-screen h-screen bg-white flex flex-col">
              {/* HEADER */}
              <div className="flex flex-col md:flex-row justify-between items-center px-6 py-3 border-b shrink-0 gap-4 bg-white z-10">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold uppercase">
                    {lider.nombres} {lider.apellidos}
                  </h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">
                    Gestión de Célula
                  </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto max-w-full">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setVistaActual(tab.id as Vista)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-[9px] font-bold transition-all whitespace-nowrap ${
                        vistaActual === tab.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </Button>
              </div>
              {/* CONTENIDO */}
              <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4 md:p-8">
                <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4 md:p-8">
                  <div className="max-w-[1600px] mx-auto">
                    {vistaActual === "miembros" ? (
                      <>
                        <div className="mb-6 p-5 border rounded-xl bg-white shadow-sm flex items-center gap-6">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold text-gray-700">
                                Progreso de Célula
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {totalEnGrupo} / {objetivo}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                              <div
                                className={`${colorBarra} h-full transition-all duration-1000`}
                                style={{ width: `${progreso}%` }}
                              ></div>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-600 font-bold bg-gray-50 px-4 py-1 rounded-full border inline-block">
                                <TextoAnimado textos={[mensaje]} />
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg border hidden sm:block">
                            <Image
                              src={gifUrl}
                              alt="Status"
                              width={80}
                              height={80}
                              unoptimized
                              className="object-contain"
                            />
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
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={busqueda}
                              onChange={(e) => setBusqueda(e.target.value)}
                            />
                          </div>
                          <Button
                            className={`font-bold h-12 px-6 shadow-md transition-transform hover:scale-105 w-full md:w-auto ${
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
                                <UserPlus className="w-5 h-5 mr-2" /> Iniciar mi
                                Grupo (Soy el Líder)
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-5 h-5 mr-2" /> Añadir
                                Nuevo Integrante
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
                      <div className="flex flex-wrap justify-center gap-6 w-full pt-4">
                        <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-[500px] min-h-[500px] flex flex-col">
                          <EstadisticasEmpadronados
                            afiliados={afiliadosDelLider}
                          />
                        </div>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-[500px] min-h-[500px] flex flex-col">
                          <EstadisticasReligiones
                            afiliados={afiliadosDelLider}
                          />
                        </div>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-[500px] min-h-[500px] flex flex-col">
                          <EstadisticasEdades afiliados={afiliadosDelLider} />
                        </div>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-[500px] min-h-[500px] flex flex-col">
                          <EstadisticasPoliticas
                            afiliados={afiliadosDelLider}
                          />
                        </div>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-[1000px] min-h-[500px] flex flex-col">
                          <EstadisticasLugares afiliados={afiliadosDelLider} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Fragment>
  );
}
