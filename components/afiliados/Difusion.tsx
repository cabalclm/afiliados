"use client";

import { useState, useMemo, Fragment } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, LayoutGroup } from "framer-motion";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";
import { Megaphone, X, Search, Check, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { enviarMensajeAction } from "../dashboard/actions/mensajes";
import MensajesEnviados from "./MensajesEnviados";

const PUBLICOS = [
  {
    value: "Todos",
    label: "Todos (Global)",
    desc: "Todos los usuarios",
    theme: {
      border: "border-slate-500",
      ring: "ring-slate-500",
      bg: "bg-slate-50 dark:bg-slate-950/40",
      text: "text-slate-700 dark:text-slate-300",
      hover: "hover:border-slate-400 dark:hover:border-slate-500",
    },
  },
  {
    value: "Alto",
    label: "Alto",
    desc: "Superaron la meta",
    theme: {
      border: "border-green-500",
      ring: "ring-green-500",
      bg: "bg-green-50 dark:bg-green-950/40",
      text: "text-green-700 dark:text-green-300",
      hover: "hover:border-green-400 dark:hover:border-green-600",
    },
  },
  {
    value: "Cumple",
    label: "Cumple",
    desc: "Llegaron a la meta exacta",
    theme: {
      border: "border-blue-500",
      ring: "ring-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
      hover: "hover:border-blue-400 dark:hover:border-blue-600",
    },
  },
  {
    value: "Medio",
    label: "Medio",
    desc: "Cerca de la meta",
    theme: {
      border: "border-yellow-500",
      ring: "ring-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
      text: "text-yellow-700 dark:text-yellow-300",
      hover: "hover:border-yellow-400 dark:hover:border-yellow-600",
    },
  },
  {
    value: "Bajo",
    label: "Bajo",
    desc: "Lejos de la meta",
    theme: {
      border: "border-red-500",
      ring: "ring-red-500",
      bg: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-300",
      hover: "hover:border-red-400 dark:hover:border-red-600",
    },
  },
  {
    value: "Usuarios Específicos",
    label: "Específicos",
    desc: "Tú eliges a quién",
    theme: {
      border: "border-purple-500",
      ring: "ring-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      text: "text-purple-700 dark:text-purple-300",
      hover: "hover:border-purple-400 dark:hover:border-purple-600",
    },
  },
];

function nombreCompleto(u: { nombres?: string; apellidos?: string }) {
  return `${u.nombres || ""} ${u.apellidos || ""}`.trim();
}

export default function Difusion({ usuarios }: { usuarios: any[] }) {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [publicoObjetivo, setPublicoObjetivo] = useState("Todos");
  const [usuariosEspecificos, setUsuariosEspecificos] = useState<string[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const usuariosLista = useMemo(() => {
    const term = busquedaUsuario.toLowerCase().trim();
    const filtrados = !term
      ? usuarios
      : usuarios.filter(
          (u) =>
            `${u.nombres || ""} ${u.apellidos || ""}`
              .toLowerCase()
              .includes(term) || (u.email || "").toLowerCase().includes(term),
        );

    return [...filtrados].sort((a, b) => {
      const aIdx = usuariosEspecificos.indexOf(a.id);
      const bIdx = usuariosEspecificos.indexOf(b.id);
      const aSel = aIdx !== -1;
      const bSel = bIdx !== -1;
      if (aSel && bSel) return aIdx - bIdx;
      if (aSel) return -1;
      if (bSel) return 1;
      return 0;
    });
  }, [usuarios, busquedaUsuario, usuariosEspecificos]);

  const resetForm = () => {
    setMensajeTexto("");
    setPublicoObjetivo("Todos");
    setUsuariosEspecificos([]);
    setBusquedaUsuario("");
  };

  const handleClose = () => {
    if (enviando) return;
    setIsOpen(false);
  };

  const toggleUsuario = (id: string) => {
    setUsuariosEspecificos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );
  };

  const toggleTodosVisibles = () => {
    const idsVisibles = usuariosLista.map((u) => u.id);
    const todosSeleccionados = idsVisibles.every((id) =>
      usuariosEspecificos.includes(id),
    );
    if (todosSeleccionados) {
      setUsuariosEspecificos((prev) =>
        prev.filter((id) => !idsVisibles.includes(id)),
      );
    } else {
      setUsuariosEspecificos((prev) =>
        Array.from(new Set([...prev, ...idsVisibles])),
      );
    }
  };

  const handleEnviar = async () => {
    if (!mensajeTexto.trim()) {
      toast.warning("Escribe un mensaje para enviar");
      return;
    }
    if (
      publicoObjetivo === "Usuarios Específicos" &&
      usuariosEspecificos.length === 0
    ) {
      toast.warning("Selecciona al menos un usuario específico");
      return;
    }

    setEnviando(true);
    try {
      await enviarMensajeAction(
        mensajeTexto,
        publicoObjetivo,
        usuariosEspecificos,
      );
      toast.success("Difusión enviada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["historial-mensajes"] });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Error al enviar la difusión: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  const esEspecificos = publicoObjetivo === "Usuarios Específicos";

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 mb-2">
        <div>
          <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            Difusión
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Envía avisos e instrucciones a tus usuarios
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold"
        >
          <Megaphone className="w-4 h-4" />
          Nueva Difusión
        </Button>
      </div>

      <MensajesEnviados lideres={usuarios} />

      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[150]" onClose={handleClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="w-full h-full max-w-none bg-white dark:bg-neutral-900 flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b dark:border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400">
                      <Megaphone className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                        Nueva Difusión
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Envía un mensaje a tu público objetivo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Mensaje
                    </label>
                    <textarea
                      value={mensajeTexto}
                      onChange={(e) => setMensajeTexto(e.target.value)}
                      className="w-full min-h-[110px] p-3 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-y text-gray-900 dark:text-gray-100"
                      placeholder="Escribe un mensaje de motivación, aviso o instrucción importante..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Público objetivo
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {PUBLICOS.map((p) => {
                        const activo = publicoObjetivo === p.value;
                        const t = p.theme;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              setPublicoObjetivo(p.value);
                              if (p.value !== "Usuarios Específicos") {
                                setUsuariosEspecificos([]);
                              }
                            }}
                            className={`text-left p-2 lg:p-2.5 rounded-lg border transition-all min-w-0 ${
                              activo
                                ? `${t.border} ${t.bg} ring-1 ${t.ring}`
                                : `border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 ${t.hover}`
                            }`}
                          >
                            <span
                              className={`block text-[10px] lg:text-xs font-bold leading-tight ${t.text}`}
                            >
                              {p.label}
                            </span>
                            <span className="block text-[9px] lg:text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">
                              {p.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {esEspecificos && (
                    <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2.5 bg-gray-50 dark:bg-neutral-800/60 border-b dark:border-neutral-700 gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 min-w-0">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Destinatarios</span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 rounded-full shrink-0">
                            {usuariosEspecificos.length}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={toggleTodosVisibles}
                          className="text-[10px] sm:text-xs font-bold text-green-600 dark:text-green-400 hover:underline shrink-0 whitespace-nowrap"
                        >
                          {usuariosLista.length > 0 &&
                          usuariosLista.every((u) =>
                            usuariosEspecificos.includes(u.id),
                          )
                            ? "Quitar todos"
                            : "Seleccionar todos"}
                        </button>
                      </div>

                      {/* Buscador */}
                      <div className="p-3 pb-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nombre..."
                            value={busquedaUsuario}
                            onChange={(e) => setBusquedaUsuario(e.target.value)}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>

                      {/* Lista */}
                      <LayoutGroup id="destinatarios-difusion">
                        <div className="max-h-[45vh] sm:max-h-[55vh] overflow-y-auto px-2 pb-2 sm:px-3 sm:pb-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {usuariosLista.map((u) => {
                            const isSelected = usuariosEspecificos.includes(u.id);
                            return (
                              <motion.button
                                key={u.id}
                                type="button"
                                layout
                                initial={false}
                                transition={{
                                  layout: {
                                    type: "spring",
                                    stiffness: 420,
                                    damping: 34,
                                  },
                                }}
                                onClick={() => toggleUsuario(u.id)}
                                className={`flex items-start sm:items-center gap-1.5 px-2 py-1.5 rounded-md border text-left min-w-0 transition-colors duration-200 ${
                                  isSelected
                                    ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                                    : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                }`}
                              >
                              <span className="min-w-0 flex-1">
                                <span className="sm:hidden">
                                  <span
                                    className={`block text-[10px] font-semibold leading-tight truncate ${
                                      isSelected
                                        ? "text-green-800 dark:text-green-200"
                                        : "text-gray-800 dark:text-gray-100"
                                    }`}
                                  >
                                    {u.nombres || ""}
                                  </span>
                                  <span
                                    className={`block text-[10px] leading-tight truncate ${
                                      isSelected
                                        ? "text-green-700 dark:text-green-300"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {u.apellidos || ""}
                                  </span>
                                </span>
                                <span className="hidden sm:block text-[11px] font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                                  {nombreCompleto(u)}
                                </span>
                              </span>
                              <span
                                className={`flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border shrink-0 ${
                                  isSelected
                                    ? "bg-green-600 border-green-600"
                                    : "border-gray-300 dark:border-neutral-600"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                                )}
                              </span>
                            </motion.button>
                          );
                        })}
                        {usuariosLista.length === 0 && (
                          <div className="col-span-2 sm:col-span-3 p-6 text-center text-xs text-gray-500">
                            No se encontraron usuarios
                          </div>
                        )}
                        </div>
                      </LayoutGroup>
                    </div>
                  )}

                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-neutral-800 shrink-0 bg-gray-50/50 dark:bg-neutral-900">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    disabled={enviando}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEnviar}
                    disabled={enviando || !mensajeTexto.trim()}
                    className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold"
                  >
                    <UserPlus className="w-4 h-4" />
                    {enviando ? "Enviando..." : "Enviar Difusión"}
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
