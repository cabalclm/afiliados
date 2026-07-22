"use client";

import { useState, useMemo, Fragment, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";
import {
  Megaphone,
  X,
  Search,
  Check,
  Users,
  UserPlus,
  Globe2,
  Trophy,
  Briefcase,
  CircleDot,
  UserRoundSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { enviarMensajeAction } from "../dashboard/actions/mensajes";
import MensajesEnviados from "./MensajesEnviados";

type PublicoOption = {
  value: string;
  label: string;
  icon: ReactNode;
  text: string;
  border: string;
  bg: string;
  ring: string;
  iconWrap: string;
};

const OPCION_TODOS: PublicoOption = {
  value: "Todos",
  label: "Todos",
  icon: <Globe2 className="w-4 h-4" />,
  text: "text-slate-700 dark:text-slate-200",
  border: "border-slate-500",
  bg: "bg-slate-50 dark:bg-slate-950/40",
  ring: "ring-slate-500",
  iconWrap: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const OPCIONES_ROL: PublicoOption[] = [
  {
    value: "Lideres",
    label: "Líderes",
    icon: <Trophy className="w-4 h-4" />,
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-500",
    iconWrap:
      "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
  },
  {
    value: "Empleados",
    label: "Empleados",
    icon: <Briefcase className="w-4 h-4" />,
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ring: "ring-violet-500",
    iconWrap:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  },
];

/** Orden requerido: Bajo → Medio → Cumple → Alto */
const OPCIONES_NIVEL: PublicoOption[] = [
  {
    value: "Bajo",
    label: "Bajo",
    icon: <CircleDot className="w-4 h-4" />,
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-500",
    iconWrap: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
  },
  {
    value: "Medio",
    label: "Medio",
    icon: <CircleDot className="w-4 h-4" />,
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-500",
    iconWrap:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  },
  {
    value: "Cumple",
    label: "Cumple",
    icon: <CircleDot className="w-4 h-4" />,
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-500",
    iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  },
  {
    value: "Alto",
    label: "Alto",
    icon: <CircleDot className="w-4 h-4" />,
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500",
    bg: "bg-green-50 dark:bg-green-950/40",
    ring: "ring-green-500",
    iconWrap:
      "bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400",
  },
];

const OPCION_ESPECIFICOS: PublicoOption = {
  value: "Usuarios Específicos",
  label: "Específicos",
  icon: <UserRoundSearch className="w-4 h-4" />,
  text: "text-teal-600 dark:text-teal-400",
  border: "border-teal-500",
  bg: "bg-teal-50 dark:bg-teal-950/40",
  ring: "ring-teal-500",
  iconWrap: "bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400",
};

function PublicoChip({
  option,
  activo,
  onSelect,
}: {
  option: PublicoOption;
  activo: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-left transition-all min-w-0 ${
        activo
          ? `${option.border} ${option.bg} ring-1 ${option.ring}`
          : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-600"
      }`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${option.iconWrap}`}
      >
        {option.icon}
      </span>
      <span className={`text-sm font-bold truncate ${option.text}`}>
        {option.label}
      </span>
      {activo && (
        <Check
          className={`w-4 h-4 ml-auto shrink-0 ${option.text}`}
          strokeWidth={2.5}
        />
      )}
    </button>
  );
}

function GrupoLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
      {children}
    </p>
  );
}

export default function Difusion({ usuarios }: { usuarios: any[] }) {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [publicoObjetivo, setPublicoObjetivo] = useState("Todos");
  const [usuariosEspecificos, setUsuariosEspecificos] = useState<string[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const esEspecificos = publicoObjetivo === "Usuarios Específicos";
  const terminoBusqueda = busquedaUsuario.trim();
  const hayBusqueda = terminoBusqueda.length > 0;

  const usuariosPorId = useMemo(() => {
    const map = new Map<string, any>();
    usuarios.forEach((u) => map.set(u.id, u));
    return map;
  }, [usuarios]);

  const seleccionados = useMemo(
    () =>
      usuariosEspecificos
        .map((id) => usuariosPorId.get(id))
        .filter(Boolean),
    [usuariosEspecificos, usuariosPorId],
  );

  const resultadosBusqueda = useMemo(() => {
    if (!hayBusqueda) return [];
    const term = terminoBusqueda.toLowerCase();
    return usuarios
      .filter(
        (u) =>
          `${u.nombres || ""} ${u.apellidos || ""}`
            .toLowerCase()
            .includes(term) || (u.email || "").toLowerCase().includes(term),
      )
      .sort((a, b) =>
        `${a.nombres || ""} ${a.apellidos || ""}`.localeCompare(
          `${b.nombres || ""} ${b.apellidos || ""}`,
          "es",
        ),
      );
  }, [usuarios, hayBusqueda, terminoBusqueda]);

  const resetForm = () => {
    setTitulo("");
    setMensajeTexto("");
    setPublicoObjetivo("Todos");
    setUsuariosEspecificos([]);
    setBusquedaUsuario("");
  };

  const handleClose = () => {
    if (enviando) return;
    setIsOpen(false);
  };

  const cambiarPublico = () => {
    setPublicoObjetivo("Todos");
    setUsuariosEspecificos([]);
    setBusquedaUsuario("");
  };

  const toggleUsuario = (id: string) => {
    setUsuariosEspecificos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const seleccionarResultados = () => {
    const ids = resultadosBusqueda.map((u) => u.id);
    const todosSeleccionados =
      ids.length > 0 && ids.every((id) => usuariosEspecificos.includes(id));
    if (todosSeleccionados) {
      setUsuariosEspecificos((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setUsuariosEspecificos((prev) =>
        Array.from(new Set([...prev, ...ids])),
      );
    }
  };

  const handleEnviar = async () => {
    if (!mensajeTexto.trim()) {
      toast.warning("Escribe un mensaje para enviar");
      return;
    }
    if (esEspecificos && usuariosEspecificos.length === 0) {
      toast.warning("Selecciona al menos un usuario específico");
      return;
    }

    setEnviando(true);
    try {
      const { push } = await enviarMensajeAction({
        titulo: titulo.trim() || undefined,
        mensaje: mensajeTexto,
        publico_objetivo: publicoObjetivo,
        usuarios_especificos: usuariosEspecificos,
      });

      const n = push?.enviadas ?? 0;
      toast.success(
        n > 0
          ? `Difusión enviada. Notificación push a ${n} dispositivo${n === 1 ? "" : "s"}.`
          : "Difusión enviada. (Ningún destinatario tiene notificaciones activas en este momento)",
      );
      queryClient.invalidateQueries({ queryKey: ["historial-mensajes"] });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Error al enviar la difusión: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  const resultadosTodosSeleccionados =
    resultadosBusqueda.length > 0 &&
    resultadosBusqueda.every((u) => usuariosEspecificos.includes(u.id));

  const renderUsuarioRow = (u: any, selected: boolean) => (
    <button
      key={u.id}
      type="button"
      onClick={() => toggleUsuario(u.id)}
      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left border-b border-gray-100 dark:border-neutral-800 last:border-b-0 transition-colors ${
        selected
          ? "bg-green-50/80 dark:bg-green-950/30"
          : "hover:bg-gray-50 dark:hover:bg-neutral-800/60"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-semibold leading-tight truncate ${
            selected
              ? "text-green-800 dark:text-green-200"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {u.nombres || "—"}
        </span>
        <span
          className={`block text-xs leading-tight truncate ${
            selected
              ? "text-green-700 dark:text-green-300"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {u.apellidos || ""}
        </span>
      </span>
      <span
        className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${
          selected
            ? "bg-green-600 border-green-600"
            : "border-gray-300 dark:border-neutral-600"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
    </button>
  );

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

          <div className="fixed inset-0 flex items-stretch md:items-center justify-center p-0 md:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:scale-95"
            >
              <DialogPanel className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl lg:max-w-3xl bg-white dark:bg-neutral-900 flex flex-col shadow-2xl overflow-hidden md:rounded-2xl">
                <div className="flex justify-between items-center px-5 py-4 border-b dark:border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                        Nueva Difusión
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Envía un mensaje a tu público objetivo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Título{" "}
                      <span className="font-normal text-gray-400">
                        (encabezado de la notificación)
                      </span>
                    </label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      maxLength={60}
                      placeholder="Ej. Aviso importante"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Mensaje
                    </label>
                    <textarea
                      value={mensajeTexto}
                      onChange={(e) => setMensajeTexto(e.target.value)}
                      className="w-full min-h-[100px] p-3 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-y text-gray-900 dark:text-gray-100"
                      placeholder="Escribe un mensaje de motivación, aviso o instrucción importante..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Público objetivo
                      </label>
                      {esEspecificos && (
                        <button
                          type="button"
                          onClick={cambiarPublico}
                          className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline whitespace-nowrap"
                        >
                          ← Cambiar público
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence initial={false} mode="popLayout">
                        {!esEspecificos && (
                          <motion.div
                            key="grupos-publico"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="space-y-3 overflow-hidden"
                          >
                            <div>
                              <GrupoLabel>General</GrupoLabel>
                              <PublicoChip
                                option={OPCION_TODOS}
                                activo={publicoObjetivo === OPCION_TODOS.value}
                                onSelect={() => {
                                  setPublicoObjetivo(OPCION_TODOS.value);
                                  setUsuariosEspecificos([]);
                                  setBusquedaUsuario("");
                                }}
                              />
                            </div>

                            <div>
                              <GrupoLabel>Por rol</GrupoLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {OPCIONES_ROL.map((opt) => (
                                  <PublicoChip
                                    key={opt.value}
                                    option={opt}
                                    activo={publicoObjetivo === opt.value}
                                    onSelect={() => {
                                      setPublicoObjetivo(opt.value);
                                      setUsuariosEspecificos([]);
                                      setBusquedaUsuario("");
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <GrupoLabel>Por nivel de compromiso</GrupoLabel>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {OPCIONES_NIVEL.map((opt) => (
                                  <PublicoChip
                                    key={opt.value}
                                    option={opt}
                                    activo={publicoObjetivo === opt.value}
                                    onSelect={() => {
                                      setPublicoObjetivo(opt.value);
                                      setUsuariosEspecificos([]);
                                      setBusquedaUsuario("");
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div layout>
                        <GrupoLabel>Selección manual</GrupoLabel>
                        <PublicoChip
                          option={OPCION_ESPECIFICOS}
                          activo={esEspecificos}
                          onSelect={() =>
                            setPublicoObjetivo(OPCION_ESPECIFICOS.value)
                          }
                        />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {esEspecificos && (
                      <motion.div
                        key="destinatarios"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border-b dark:border-neutral-700 gap-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 min-w-0">
                            <Users className="w-4 h-4 shrink-0" />
                            Destinatarios
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 rounded-full shrink-0">
                              {usuariosEspecificos.length}
                            </span>
                          </span>
                          {hayBusqueda && (
                            <button
                              type="button"
                              onClick={seleccionarResultados}
                              className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline shrink-0 whitespace-nowrap"
                            >
                              {resultadosTodosSeleccionados
                                ? "Quitar resultados"
                                : "Seleccionar resultados"}
                            </button>
                          )}
                        </div>

                        {seleccionados.length > 0 && (
                          <div className="border-b dark:border-neutral-700">
                            <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Seleccionados
                            </p>
                            <div className="max-h-36 overflow-y-auto">
                              {seleccionados.map((u) =>
                                renderUsuarioRow(u, true),
                              )}
                            </div>
                          </div>
                        )}

                        <div className="p-3 pb-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Escribe un nombre para buscar..."
                              value={busquedaUsuario}
                              onChange={(e) =>
                                setBusquedaUsuario(e.target.value)
                              }
                              className="pl-9 h-9 text-sm"
                            />
                          </div>
                        </div>

                        {!hayBusqueda ? (
                          <p className="px-3 pb-4 pt-1 text-center text-xs text-gray-400">
                            Escribe un nombre para mostrar usuarios
                          </p>
                        ) : resultadosBusqueda.length === 0 ? (
                          <p className="px-3 pb-4 pt-1 text-center text-xs text-gray-500">
                            No se encontraron usuarios
                          </p>
                        ) : (
                          <div className="max-h-52 overflow-y-auto border-t dark:border-neutral-800">
                            {resultadosBusqueda.map((u) =>
                              renderUsuarioRow(
                                u,
                                usuariosEspecificos.includes(u.id),
                              ),
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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
