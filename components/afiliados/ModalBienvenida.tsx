"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";
import { Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { obtenerMensajePendienteAction, marcarLeidoAction, contarMensajesPendientesAction } from "@/components/dashboard/actions/mensajes";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

function formatearFechaLectura(fecha: Date) {
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dia = dias[fecha.getDay()];
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const yy = String(fecha.getFullYear()).slice(-2);
  let horas = fecha.getHours();
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;
  return `${dia} ${dd}/${mm}/${yy} a las ${horas}:${minutos} ${ampm}`;
}

function colorToastLectura(nivel: string) {
  switch (nivel) {
    case "Alto":
      return { bg: "#16a34a", color: "#ffffff" };
    case "Cumple":
      return { bg: "#2563eb", color: "#ffffff" };
    case "Medio":
      return { bg: "#ca8a04", color: "#ffffff" };
    default:
      return { bg: "#dc2626", color: "#ffffff" };
  }
}

interface ModalBienvenidaProps {
  userId: string;
  conteoAfiliados: number;
  nombreLider: string;
}

export default function ModalBienvenida({ userId, conteoAfiliados, nombreLider }: ModalBienvenidaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajeTitulo, setMensajeTitulo] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [mensajeId, setMensajeId] = useState("");
  const [pendientesTotal, setPendientesTotal] = useState(0);

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const META_CELULA = config?.meta_celula ?? 15;
  const META_MINIMA = config?.meta_celula_minima ?? 10;

  let nivelCompromiso = "";
  let colorFondo = "";
  let textoColor = "";
  let gifUrl = "";

  if (conteoAfiliados > META_CELULA) {
    nivelCompromiso = "Alto";
    colorFondo = "bg-green-50 dark:bg-green-900/20 border-green-500";
    textoColor = "text-green-700 dark:text-green-400";
    gifUrl = "/gif/afiliados/gif5.gif";
  } else if (conteoAfiliados === META_CELULA) {
    nivelCompromiso = "Cumple";
    colorFondo = "bg-blue-50 dark:bg-blue-900/20 border-blue-500";
    textoColor = "text-blue-700 dark:text-blue-400";
    gifUrl = "/gif/afiliados/gif3.gif";
  } else if (conteoAfiliados >= META_MINIMA && conteoAfiliados < META_CELULA) {
    nivelCompromiso = "Medio";
    colorFondo = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500";
    textoColor = "text-yellow-700 dark:text-yellow-400";
    gifUrl = "/gif/afiliados/logo.gif";
  } else {
    nivelCompromiso = "Bajo";
    colorFondo = "bg-red-50 dark:bg-red-900/20 border-red-500";
    textoColor = "text-red-700 dark:text-red-400";
    gifUrl = "/gif/afiliados/pensando.gif";
  }

  const renderMensaje = (texto: string) => {
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
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-bold break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const cargarSiguienteMensaje = async () => {
    const [mensaje, total] = await Promise.all([
      obtenerMensajePendienteAction(userId, nivelCompromiso),
      contarMensajesPendientesAction(userId, nivelCompromiso),
    ]);

    if (mensaje) {
      setMensajeTitulo(mensaje.titulo || "");
      setMensajeTexto(mensaje.mensaje);
      setMensajeId(mensaje.id);
      setPendientesTotal(total);
      setIsOpen(true);
      return true;
    }

    setMensajeTitulo("");
    setMensajeTexto("");
    setMensajeId("");
    setPendientesTotal(0);
    setIsOpen(false);
    return false;
  };

  useEffect(() => {
    async function checkMensaje() {
      if (config && userId) {
        try {
          await cargarSiguienteMensaje();
        } catch (error) {
          console.error("Error al obtener mensaje pendiente", error);
        }
      }
    }
    checkMensaje();
  }, [config, userId, nivelCompromiso]);

  const { mutate: handleContinuar, isPending } = useMutation({
    mutationFn: () => marcarLeidoAction(mensajeId, userId),
    onSuccess: async () => {
      const { bg, color } = colorToastLectura(nivelCompromiso);
      toast.success(
        `Se guardó la lectura del mensaje el ${formatearFechaLectura(new Date())}`,
        {
          className: "toast-lectura-mensaje",
          style: {
            background: bg,
            color,
            boxShadow: "none",
          },
        },
      );
      await cargarSiguienteMensaje();
    },
    onError: (error: any) => {
      toast.error("Error al marcar como leído: " + error.message);
    }
  });

  return (
    <Transition show={isOpen} as={Fragment}>
      {/* onClose vacio previene cerrar el modal al hacer click afuera o esc */}
      <Dialog as="div" className="relative z-[100]" onClose={() => {}}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className={`w-full max-w-lg transform overflow-hidden rounded-2xl ${colorFondo} border-4 p-6 text-left align-middle transition-all relative flex flex-col items-center`}>
                {pendientesTotal > 1 && (
                  <p className="w-full text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                    Tienes {pendientesTotal} mensajes sin leer · del más reciente al más antiguo
                  </p>
                )}
                <div className="p-3 md:p-4 rounded-xl bg-white/95 dark:bg-black/80 backdrop-blur-md w-full text-left border border-gray-200 dark:border-gray-800 mb-4">
                  {mensajeTitulo && (
                    <p className={`font-bold text-sm mb-2 ${textoColor}`}>
                      {mensajeTitulo}
                    </p>
                  )}
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                    {renderMensaje(mensajeTexto)}
                  </p>
                </div>

                <div className="flex w-full items-center gap-2 md:gap-4 mb-2">
                  <div className="flex-1 w-full px-2">
                    <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 px-1 mb-1.5">
                      <span className="text-left">Tu nivel de compromiso es:</span>
                      <span className={`uppercase font-black text-right ml-2 ${textoColor}`}>{nivelCompromiso}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-300 dark:border-gray-700 mb-1.5">
                      <div 
                        className={`h-3 rounded-full ${conteoAfiliados > META_CELULA ? 'bg-green-500' : conteoAfiliados === META_CELULA ? 'bg-blue-500' : conteoAfiliados >= META_MINIMA ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-1000 ease-out relative overflow-hidden`} 
                        style={{ width: `${Math.min(100, Math.max(0, (conteoAfiliados / META_CELULA) * 100))}%` }}
                      >
                         <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-400 px-1">
                      <span>Registrados:</span>
                      <span className={`uppercase font-black text-right ml-2 ${textoColor}`}>{conteoAfiliados}/{META_CELULA}</span>
                    </div>
                  </div>

                  <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden flex justify-center items-center">
                    <Image
                      src={gifUrl}
                      alt={`Nivel ${nivelCompromiso}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => handleContinuar()}
                  disabled={isPending}
                  className={`mt-2 w-full flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 text-lg ${
                    nivelCompromiso === 'Alto' ? 'bg-green-600 hover:bg-green-700' :
                    nivelCompromiso === 'Cumple' ? 'bg-blue-600 hover:bg-blue-700' :
                    nivelCompromiso === 'Medio' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:scale-100`}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Entendido, Continuar"
                  )}
                </button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
