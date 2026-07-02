"use client";

import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { obtenerHistorialMensajesAction } from "../dashboard/actions/mensajes";
import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";
import { X, CheckCircle2, Clock } from "lucide-react";

export default function MensajesEnviados({ lideres }: { lideres: any[] }) {
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<any | null>(null);

  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ["historial-mensajes"],
    queryFn: () => obtenerHistorialMensajesAction(),
  });

  const getNombreUsuario = (id: string) => {
    const user = lideres.find((l) => l.id === id);
    return user ? user.nombres : "Usuario Desconocido";
  };

  // Formateador de fecha "Visto el Lun 10/10/26 a las 07:00 PM"
  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    
    let formateada = d.toLocaleString('es-ES', opciones);
    formateada = formateada.replace(',', ' a las');
    // Hacer mayúscula la primera letra del día
    formateada = formateada.charAt(0).toUpperCase() + formateada.slice(1);
    
    return formateada;
  };

  return (
    <div className="w-full mt-6">
      
      {isLoading ? (
        <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>
      ) : mensajes.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
          <p className="text-gray-500 font-semibold">No hay mensajes enviados.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mensajes.map((m: any) => (
            <div 
              key={m.id} 
              onClick={() => setMensajeSeleccionado(m)}
              className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${m.activo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400'}`}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 mb-4 font-medium">{m.mensaje}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 font-bold border-t dark:border-neutral-800 pt-3 mt-auto">
                <span className="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md">{m.publico_objetivo}</span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  {m.sis_mensajes_lecturas?.length || 0} Vistas
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Pantalla Completa */}
      <Transition show={!!mensajeSeleccionado} as={Fragment}>
        <Dialog as="div" className="relative z-[200]" onClose={() => setMensajeSeleccionado(null)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </TransitionChild>
          
          <div className="fixed inset-0 flex items-center justify-center p-0 md:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            >
              <DialogPanel className="w-full h-full md:h-[90vh] max-w-4xl bg-gray-50 dark:bg-neutral-950 md:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                {/* Header Fijo */}
                <div className="flex justify-between items-center px-6 py-4 border-b dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 z-10 shadow-sm">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Detalles del Mensaje
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Enviado el {mensajeSeleccionado && formatearFecha(mensajeSeleccionado.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setMensajeSeleccionado(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  {mensajeSeleccionado && (
                    <div className="max-w-3xl mx-auto relative">
                      
                      {/* Tarjeta del Mensaje */}
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-neutral-800 mb-8">
                        <div className="mb-6">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                            Contenido del mensaje:
                          </span>
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg md:text-xl font-medium leading-relaxed">
                            {mensajeSeleccionado.mensaje}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="bg-blue-50 border border-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center">
                            Público: {mensajeSeleccionado.publico_objetivo}
                          </div>
                          <div className="bg-gray-50 border border-gray-100 dark:border-neutral-800 dark:bg-neutral-800/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center">
                            Vistas Totales: {mensajeSeleccionado.sis_mensajes_lecturas?.length || 0}
                          </div>
                        </div>
                      </div>

                      {/* Lista de Vistas */}
                      <h4 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-4 px-2">
                        Reporte de Vistas
                      </h4>

                      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                        {(() => {
                          const lecturas = mensajeSeleccionado.sis_mensajes_lecturas || [];
                          
                          if (mensajeSeleccionado.publico_objetivo === "Usuarios Específicos") {
                            const especificos = mensajeSeleccionado.usuarios_especificos || [];
                            return (
                              <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {especificos.map((uid: string) => {
                                  const lecturaInfo = lecturas.find((l: any) => l.user_id === uid);
                                  return (
                                    <li key={uid} className="flex justify-between items-center p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                                      <span className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base">
                                        {getNombreUsuario(uid)}
                                      </span>
                                      {lecturaInfo ? (
                                        <div className="flex flex-col items-end">
                                          <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold mb-0.5">
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Visto
                                          </div>
                                          <span className="text-[11px] text-gray-500 font-medium">el {formatearFecha(lecturaInfo.leido_en)}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center text-gray-400 text-sm font-bold bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                                          <Clock className="w-4 h-4 mr-1.5" />
                                          No visto aún
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          } else {
                            if (lecturas.length === 0) {
                              return <div className="p-12 text-center text-gray-500 font-semibold">Nadie ha visto este mensaje aún.</div>;
                            }
                            return (
                              <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {lecturas.map((l: any, idx: number) => (
                                  <li key={idx} className="flex justify-between items-center p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base">
                                      {getNombreUsuario(l.user_id)}
                                    </span>
                                    <div className="flex flex-col items-end">
                                      <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold mb-0.5">
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                        Visto
                                      </div>
                                      <span className="text-[11px] text-gray-500 font-medium">el {formatearFecha(l.leido_en)}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                        })()}
                      </div>
                      
                      {/* Espacio final */}
                      <div className="h-16 md:h-8"></div>
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
