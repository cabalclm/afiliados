"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Search,
  UserRound,
  X,
} from "lucide-react";
import type { Afiliado, Lider } from "./esquemas";
import { formatearDpi, formatearTelefono } from "./contacto";
import { calcularEdadLabel, formatearFechaDMY } from "@/utils/formatoFechaGT";

type Props = {
  open: boolean;
  onClose: () => void;
  afiliados: Afiliado[];
  lideres: Lider[];
};

const MAX_RESULTADOS = 50;

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function FilaCopiable({
  etiqueta,
  valor,
  copiar,
  mono = false,
  copiado,
  onCopiar,
}: {
  etiqueta: string;
  valor: string;
  copiar?: string;
  mono?: boolean;
  copiado: boolean;
  onCopiar: (texto: string) => void;
}) {
  const vacio = !valor || valor === "—";
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400 sm:w-28">
        {etiqueta}
      </span>
      <span
        className={`min-w-0 flex-1 break-words text-sm font-semibold uppercase text-gray-900 dark:text-gray-100 ${
          mono ? "font-mono normal-case" : ""
        }`}
      >
        {valor || "—"}
      </span>
      <div className="relative shrink-0">
        <span
          role="status"
          className={`pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg transition-all duration-200 dark:bg-white dark:text-gray-900 ${
            copiado
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0"
          }`}
        >
          ¡Copiado!
          <span className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-gray-900 dark:bg-white" />
        </span>
        <button
          type="button"
          disabled={vacio}
          onClick={() => onCopiar(copiar ?? valor)}
          aria-label={`Copiar ${etiqueta}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-sky-950/40"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function BuscarPersonaModal({
  open,
  onClose,
  afiliados,
  lideres,
}: Props) {
  const [consulta, setConsulta] = useState("");
  const [seleccionado, setSeleccionado] = useState<Afiliado | null>(null);
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contenidoRef = useRef<HTMLDivElement | null>(null);
  const [alturaContenido, setAlturaContenido] = useState<number | null>(null);
  const [observando, setObservando] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!observando) return;
    setAlturaContenido(observando.offsetHeight);
    const ro = new ResizeObserver(() =>
      setAlturaContenido(observando.offsetHeight),
    );
    ro.observe(observando);
    return () => ro.disconnect();
  }, [observando]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() =>
        setObservando(contenidoRef.current),
      );
      return () => cancelAnimationFrame(id);
    }
    setObservando(null);
    setAlturaContenido(null);
    setConsulta("");
    setSeleccionado(null);
    setCopiadoKey(null);
  }, [open]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copiar = async (key: string, texto: string) => {
    const ok = await copiarTexto(texto);
    if (!ok) return;
    setCopiadoKey(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiadoKey(null), 1500);
  };

  const nombreLider = useMemo(() => {
    const mapa = new Map<string, string>();
    lideres.forEach((l) =>
      mapa.set(l.id, `${l.nombres} ${l.apellidos}`.trim()),
    );
    afiliados.forEach((a) => {
      if (a.lider_id && !mapa.has(a.lider_id) && a.lider_nombre) {
        mapa.set(a.lider_id, a.lider_nombre);
      }
    });
    return mapa;
  }, [lideres, afiliados]);

  const liderDe = (a: Afiliado) =>
    (a.lider_id && nombreLider.get(a.lider_id)) || a.lider_nombre || "—";

  const { resultados, total } = useMemo(() => {
    const q = normalizar(consulta);
    const qDigitos = consulta.replace(/\s+/g, "");
    const filtrados = afiliados.filter((a) => {
      if (!q) return false;
      const nombre = normalizar(`${a.nombres} ${a.apellidos}`);
      const dpi = (a.dpi || "").replace(/\s+/g, "");
      const padron = normalizar(a.no_padron || "");
      return (
        nombre.includes(q) ||
        (qDigitos.length > 0 && dpi.includes(qDigitos)) ||
        padron.includes(q)
      );
    });
    filtrados.sort((a, b) =>
      normalizar(`${a.nombres} ${a.apellidos}`).localeCompare(
        normalizar(`${b.nombres} ${b.apellidos}`),
        "es",
      ),
    );
    return {
      resultados: filtrados.slice(0, MAX_RESULTADOS),
      total: filtrados.length,
    };
  }, [afiliados, consulta]);

  const hayCriterio = Boolean(consulta.trim());

  const detalle = seleccionado
    ? [
        { k: "nombres", etiqueta: "Nombres", valor: seleccionado.nombres },
        { k: "apellidos", etiqueta: "Apellidos", valor: seleccionado.apellidos },
        {
          k: "dpi",
          etiqueta: "DPI",
          valor: seleccionado.dpi ? formatearDpi(seleccionado.dpi) : "—",
          copiar: seleccionado.dpi || "",
          mono: true,
        },
        {
          k: "padron",
          etiqueta: "Padrón",
          valor: seleccionado.no_padron || "—",
          copiar: seleccionado.no_padron || "",
          mono: true,
        },
        {
          k: "telefono",
          etiqueta: "Teléfono",
          valor: seleccionado.telefono
            ? formatearTelefono(seleccionado.telefono)
            : "—",
          copiar: (seleccionado.telefono || "").replace(/\D/g, ""),
          mono: true,
        },
        {
          k: "nacimiento",
          etiqueta: "Nacimiento",
          valor: formatearFechaDMY(seleccionado.nacimiento),
          mono: true,
        },
        {
          k: "edad",
          etiqueta: "Edad",
          valor: calcularEdadLabel(seleccionado.nacimiento) || "—",
        },
        {
          k: "ubicacion",
          etiqueta: "Ubicación",
          valor: seleccionado.lugar_nombre || "—",
        },
      ]
    : [];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[60]">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-stretch justify-center overflow-y-auto sm:items-center sm:p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl shadow-blue-900/20 dark:bg-neutral-900 sm:h-auto sm:max-w-2xl sm:rounded-3xl sm:border sm:border-white/60 sm:bg-white/90 sm:backdrop-blur-xl sm:dark:border-white/10 sm:dark:bg-neutral-900/90">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/15"
              />

              <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-black/5 px-5 py-4 dark:border-white/10">
                <div className="flex min-w-0 items-center gap-2">
                  {seleccionado ? (
                    <button
                      type="button"
                      onClick={() => setSeleccionado(null)}
                      aria-label="Volver a resultados"
                      className="-ml-2 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {seleccionado
                        ? "Pertenece a la célula de:"
                        : "Buscar persona"}
                    </h2>
                    {seleccionado ? (
                      <p className="text-sm font-bold uppercase leading-snug text-sky-700 dark:text-sky-400">
                        {liderDe(seleccionado)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Por nombre, DPI o número de padrón
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!seleccionado ? (
                <div className="relative shrink-0 px-5 pt-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={consulta}
                      onChange={(e) => setConsulta(e.target.value)}
                      placeholder="Buscar por nombre, DPI o padrón"
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-11 pr-4 text-base outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15 dark:border-neutral-700 dark:bg-neutral-900/60 dark:focus:border-sky-400"
                    />
                  </div>
                </div>
              ) : null}

              <div
                className={`relative min-h-0 flex-1 ${seleccionado ? "" : "mt-4"} overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:flex-none sm:[height:var(--alt)]`}
                style={
                  {
                    "--alt":
                      alturaContenido != null
                        ? `${alturaContenido}px`
                        : undefined,
                  } as React.CSSProperties
                }
              >
                <div ref={contenidoRef} className="flex h-full flex-col sm:h-auto">
                  <div className={`min-h-0 flex-1 overflow-y-auto border-t border-black/5 dark:border-white/10 sm:flex-none ${
                      seleccionado ? "sm:max-h-[85vh]" : "sm:max-h-[45vh]"
                    }`}>
                    {seleccionado ? (
                      <div className="divide-y divide-gray-100 py-1 dark:divide-neutral-800">
                        {detalle.map((d) => (
                          <FilaCopiable
                            key={d.k}
                            etiqueta={d.etiqueta}
                            valor={d.valor}
                            copiar={d.copiar}
                            mono={d.mono}
                            copiado={copiadoKey === d.k}
                            onCopiar={(t) => copiar(d.k, t)}
                          />
                        ))}
                      </div>
                    ) : !hayCriterio ? (
                      <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        <UserRound className="h-8 w-8 opacity-40" />
                        Escribe un nombre, DPI o padrón para buscar.
                      </div>
                    ) : resultados.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No se encontraron personas.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {resultados.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => setSeleccionado(a)}
                              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-sky-50/60 dark:hover:bg-sky-950/20 sm:gap-4"
                            >
                              <div className="min-w-0 flex-1 leading-snug">
                                <p className="truncate text-sm font-bold uppercase text-gray-900 dark:text-gray-100">
                                  {a.nombres}
                                </p>
                                <p className="truncate text-sm uppercase text-gray-600 dark:text-gray-300">
                                  {a.apellidos}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                                  {a.dpi ? formatearDpi(a.dpi) : "—"}
                                  <span className="mx-1.5 text-gray-300">·</span>
                                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                                    Padrón {a.no_padron || "—"}
                                  </span>
                                </p>
                              </div>
                              <div className="hidden shrink-0 rounded-xl bg-sky-50 px-3 py-1.5 text-xs dark:bg-sky-950/40 sm:block sm:max-w-[16rem] sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                                  Célula de
                                </p>
                                <p className="truncate font-semibold uppercase text-gray-800 dark:text-gray-100">
                                  {liderDe(a)}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {!seleccionado && hayCriterio && total > 0 ? (
                    <div className="relative shrink-0 border-t border-black/5 px-5 py-2.5 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                      {total} resultado{total === 1 ? "" : "s"}
                      {total > MAX_RESULTADOS
                        ? ` (mostrando los primeros ${MAX_RESULTADOS})`
                        : ""}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="relative shrink-0 border-t border-black/5 bg-white/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-neutral-900/80 sm:hidden">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 w-full rounded-xl border border-gray-200 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
