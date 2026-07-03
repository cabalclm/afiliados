import { createElement } from "react";
import { toast as rtToast, type ToastOptions } from "react-toastify";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const COLORES = {
  success: "#16a34a",
  error: "#dc2626",
  warning: "#ca8a04",
  info: "#2563eb",
} as const;

const ICONOS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

type ToastTipo = keyof typeof COLORES;

function opcionesToast(tipo: ToastTipo, options?: ToastOptions): ToastOptions {
  const Icono = ICONOS[tipo];
  return {
    ...options,
    style: {
      background: COLORES[tipo],
      color: "#ffffff",
      boxShadow: "none",
      ...options?.style,
    },
    icon: createElement(Icono, {
      className: "w-5 h-5 text-white shrink-0",
      strokeWidth: 2.25,
    }) as ToastOptions["icon"],
    className: ["toast-solid", options?.className].filter(Boolean).join(" "),
  };
}

export const toast = {
  success: (mensaje: string, options?: ToastOptions) =>
    rtToast.success(mensaje, opcionesToast("success", options)),
  error: (mensaje: string, options?: ToastOptions) =>
    rtToast.error(mensaje, opcionesToast("error", options)),
  warning: (mensaje: string, options?: ToastOptions) =>
    rtToast.warning(mensaje, opcionesToast("warning", options)),
  info: (mensaje: string, options?: ToastOptions) =>
    rtToast.info(mensaje, opcionesToast("info", options)),
};
