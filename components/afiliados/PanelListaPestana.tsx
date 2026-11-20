"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import type { TemaLista } from "./temaPestana";

type Props = {
  tema: TemaLista;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  acciones?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  contenidoSinPadding?: boolean;
};

export default function PanelListaPestana({
  tema,
  placeholder,
  value,
  onChange,
  acciones,
  extra,
  children,
  footer,
  contenidoSinPadding = false,
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${tema.borderPanel} bg-white/90 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:bg-neutral-900/90`}
    >
      <div
        className={`flex flex-col gap-3 border-b border-black/5 p-3 dark:border-white/10 ${tema.theadBg} ${
          acciones
            ? "sm:flex-row sm:items-end sm:pb-3 sm:pt-7"
            : "sm:flex-row sm:items-center"
        }`}
      >
        <div className="flex min-h-10 flex-1 min-w-0 items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`h-10 w-full rounded-xl border border-gray-200 bg-white/90 py-2 pl-9 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 dark:border-neutral-700 dark:bg-neutral-900/80 focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus-visible:ring-2 ${tema.focusRing}`}
            />
          </div>
          {extra}
        </div>
        {acciones ? (
          <div className="flex w-full min-w-0 shrink-0 items-center sm:w-auto">
            {acciones}
          </div>
        ) : null}
      </div>
      <div className={contenidoSinPadding ? undefined : "px-3 pb-3 pt-3"}>
        {children}
      </div>
      {footer ? (
        <div className="border-t border-gray-100 dark:border-neutral-800 px-3 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
