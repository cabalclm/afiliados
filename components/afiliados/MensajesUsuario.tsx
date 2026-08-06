"use client";

import {
  contarMensajesPendientesAction,
  marcarLeidoAction,
  obtenerMensajesUsuarioAction,
} from "@/components/dashboard/actions/mensajes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatearFechaHoraMensaje } from "@/utils/formatoFechaGT";
import type { TemaLista } from "./temaPestana";

type MensajeUsuario = {
  id: string;
  titulo?: string | null;
  mensaje: string;
  publico_objetivo: string;
  created_at?: string;
  leido: boolean;
  leido_en?: string | null;
};

interface Props {
  userId: string;
  nivelCompromiso: string;
  tema: TemaLista;
}

function renderMensaje(texto: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = texto.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-blue-600 underline break-all hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MetaEntregaLectura({
  mensaje,
  tema,
}: {
  mensaje: MensajeUsuario;
  tema: TemaLista;
}) {
  return (
    <div className="mt-3 flex flex-col items-end gap-0.5 text-right text-[10px] leading-snug text-gray-400 dark:text-zinc-500">
      <p>
        <span className="font-bold uppercase tracking-wide">Entregado:</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatearFechaHoraMensaje(mensaje.created_at)}
        </span>
      </p>
      {mensaje.leido && mensaje.leido_en && (
        <p className={tema.btnText}>
          <span className="font-bold uppercase tracking-wide">Leído:</span>{" "}
          <span className="font-semibold tabular-nums">
            {formatearFechaHoraMensaje(mensaje.leido_en)}
          </span>
        </p>
      )}
    </div>
  );
}

function MensajesSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="space-y-2">
            <div className="h-4 w-2/5 rounded bg-gray-200 dark:bg-neutral-700" />
            <div className="h-3 w-full rounded bg-gray-100 dark:bg-neutral-800" />
            <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MensajesUsuario({
  userId,
  nivelCompromiso,
  tema,
}: Props) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(15);
  const marcadosRef = useRef(new Set<string>());

  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ["mensajes-usuario", userId, nivelCompromiso],
    queryFn: () => obtenerMensajesUsuarioAction(userId, nivelCompromiso),
    enabled: !!userId,
  });

  const { data: pendientes = 0 } = useQuery({
    queryKey: ["mensajes-pendientes", userId, nivelCompromiso],
    queryFn: () => contarMensajesPendientesAction(userId, nivelCompromiso),
    enabled: !!userId,
  });

  const marcarLeido = useMutation({
    mutationFn: (mensajeId: string) => marcarLeidoAction(mensajeId, userId),
    onMutate: async (mensajeId) => {
      await queryClient.cancelQueries({
        queryKey: ["mensajes-usuario", userId, nivelCompromiso],
      });
      const prev = queryClient.getQueryData<MensajeUsuario[]>([
        "mensajes-usuario",
        userId,
        nivelCompromiso,
      ]);
      const ahora = new Date().toISOString();
      queryClient.setQueryData<MensajeUsuario[]>(
        ["mensajes-usuario", userId, nivelCompromiso],
        (old) =>
          (old ?? []).map((m) =>
            m.id === mensajeId
              ? { ...m, leido: true, leido_en: ahora }
              : m,
          ),
      );
      return { prev };
    },
    onError: (_err, _mensajeId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(
          ["mensajes-usuario", userId, nivelCompromiso],
          ctx.prev,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mensajes-usuario", userId] });
      queryClient.invalidateQueries({
        queryKey: ["mensajes-pendientes", userId],
      });
    },
  });

  const mensajesOrdenados = useMemo(
    () =>
      [...(mensajes as MensajeUsuario[])].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      ),
    [mensajes],
  );

  const totalPages =
    itemsPerPage === "all"
      ? 1
      : Math.max(1, Math.ceil(mensajesOrdenados.length / itemsPerPage));

  const mensajesPagina = useMemo(() => {
    if (itemsPerPage === "all") return mensajesOrdenados;
    const start = (currentPage - 1) * itemsPerPage;
    return mensajesOrdenados.slice(start, start + itemsPerPage);
  }, [mensajesOrdenados, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, mensajesOrdenados.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    mensajesPagina.forEach((mensaje) => {
      if (mensaje.leido || marcadosRef.current.has(mensaje.id)) return;
      marcadosRef.current.add(mensaje.id);
      marcarLeido.mutate(mensaje.id);
    });
  }, [mensajesPagina]);

  if (isLoading) {
    return <MensajesSkeleton />;
  }

  if (mensajesOrdenados.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center">
        <Mail className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
          No tienes mensajes por ahora.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {pendientes > 0 && (
        <p
          className={`border-b border-gray-100 px-3 py-2 text-center text-[10px] font-bold uppercase dark:border-neutral-800 ${tema.btnText}`}
        >
          {pendientes} sin leer
        </p>
      )}

      <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
        {mensajesPagina.map((mensaje) => (
          <li key={mensaje.id}>
            <article
              className={`rounded-xl border px-3 py-3 ${
                mensaje.leido
                  ? "border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  : `${tema.cardBorder} bg-white dark:bg-neutral-900`
              }`}
            >
              <p
                className={`text-xs font-bold uppercase md:text-sm ${
                  mensaje.leido
                    ? "text-gray-700 dark:text-zinc-300"
                    : "text-gray-900 dark:text-zinc-100"
                }`}
              >
                {mensaje.titulo?.trim() || "Mensaje"}
              </p>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                {renderMensaje(mensaje.mensaje)}
              </div>
              <MetaEntregaLectura mensaje={mensaje} tema={tema} />
            </article>
          </li>
        ))}
      </ul>

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
          className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300"
          aria-label="Cantidad por página"
        >
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={45}>45</option>
          <option value="all">Todos</option>
        </select>
      </div>
    </div>
  );
}
