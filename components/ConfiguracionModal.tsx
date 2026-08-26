"use client";

import {
  actualizarConfiguracionAction,
  obtenerConfiguracionAction,
} from "@/components/dashboard/actions/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Settings, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

const NIVELES = [
  {
    key: "bajo",
    nombre: "Bajo",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  {
    key: "medio",
    nombre: "Medio",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    dot: "bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  {
    key: "cumple",
    nombre: "Cumple",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  {
    key: "alto",
    nombre: "Alto",
    bg: "bg-green-50 dark:bg-green-950/30",
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
  },
] as const;

function descripcionNivel(
  key: (typeof NIVELES)[number]["key"],
  min: number,
  cel: number,
) {
  switch (key) {
    case "bajo":
      return `Menos de ${min} afiliados`;
    case "medio":
      return `De ${min} a ${Math.max(min, cel - 1)} afiliados`;
    case "cumple":
      return `Exactamente ${cel} afiliados`;
    case "alto":
      return `Más de ${cel} afiliados`;
  }
}

function SkeletonField() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-neutral-700" />
      <div className="h-11 w-full rounded-lg bg-gray-200 dark:bg-neutral-700" />
    </div>
  );
}

export default function ConfiguracionModal() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    enabled: isOpen,
  });

  const [nombreCandidato, setNombreCandidato] = useState("");
  const [lugar, setLugar] = useState("");
  const [frase, setFrase] = useState("");
  const [metaGeneral, setMetaGeneral] = useState(3000);
  const [metaCelula, setMetaCelula] = useState(15);
  const [metaMinima, setMetaMinima] = useState(10);
  const [metaPlanilla, setMetaPlanilla] = useState(100);
  const [metaPlanillaMinima, setMetaPlanillaMinima] = useState(67);

  useEffect(() => {
    if (!config || !isOpen) return;
    setNombreCandidato(config.nombre_candidato || "");
    setLugar(config.lugar || "");
    setFrase(config.frase || "");
    setMetaGeneral(config.meta_general ?? 3000);
    setMetaCelula(config.meta_celula ?? 15);
    setMetaMinima(config.meta_celula_minima ?? 10);
    setMetaPlanilla(config.meta_planilla ?? 100);
    setMetaPlanillaMinima(config.meta_planilla_minima ?? 67);
  }, [config, isOpen]);

  const handleClose = () => {
    if (isSaving) return;
    setIsOpen(false);
  };

  const handleSave = async () => {
    try {
      if (!nombreCandidato || !lugar) {
        toast.warning("Complete los campos obligatorios");
        return;
      }
      if (metaGeneral <= 0) {
        toast.warning("El objetivo general debe ser mayor a 0");
        return;
      }
      if (metaMinima >= metaCelula) {
        toast.warning(
          "La meta mínima debe ser menor que la meta",
        );
        return;
      }
      if (metaPlanilla <= 0) {
        toast.warning("La meta de planilla debe ser mayor a 0");
        return;
      }
      if (metaPlanillaMinima >= metaPlanilla) {
        toast.warning(
          "La meta mínima de planilla debe ser menor que la meta de planilla",
        );
        return;
      }

      setIsSaving(true);
      await actualizarConfiguracionAction(
        nombreCandidato,
        lugar,
        frase,
        metaCelula,
        metaMinima,
        metaGeneral,
        metaPlanilla,
        metaPlanillaMinima,
      );
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      toast.success("Configuración general guardada");
      handleClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-11 text-base rounded-lg border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus-visible:ring-[#06c]";

  const numberInputClass =
    "h-12 w-24 sm:w-28 text-center text-xl font-bold tabular-nums rounded-lg bg-white dark:bg-neutral-800 focus-visible:ring-[#06c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-11 md:h-12 md:w-12 p-0 rounded-full shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsOpen(true)}
        title="Configuración de Candidato"
      >
        <Settings className="h-6 w-6 md:h-7 md:w-7 hover:rotate-90 transition-transform duration-300" />
      </Button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-2"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-2"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-2xl transition-all">
                  {/* Header */}
                  <div className="relative bg-gradient-to-br from-[#06c] to-blue-800 px-6 py-6 text-white">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSaving}
                      className="absolute top-5 right-5 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 pr-10">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Settings className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          Configuración del Sistema
                        </h2>
                        <p className="text-sm text-blue-100 mt-1">
                          Datos del candidato y metas de afiliación
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-6 max-h-[80vh] overflow-y-auto space-y-6">
                    {isLoading ? (
                      <>
                        <SkeletonField />
                        <SkeletonField />
                        <SkeletonField />
                        <SkeletonField />
                        <SkeletonField />
                      </>
                    ) : (
                      <>
                        {/* Candidato */}
                        <section className="space-y-4">
                          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-neutral-700 pb-2">
                            Datos del candidato
                          </h3>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Nombre del candidato <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={nombreCandidato}
                                onChange={(e) => setNombreCandidato(e.target.value)}
                                className={inputClass}
                                placeholder="Ej. Juan Pérez"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Lugar <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={lugar}
                                onChange={(e) => setLugar(e.target.value)}
                                className={inputClass}
                                placeholder="Ej. Concepción Las Minas"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Frase o lema
                            </Label>
                            <Input
                              value={frase}
                              onChange={(e) => setFrase(e.target.value)}
                              className={inputClass}
                              placeholder="Frase o lema de campaña"
                            />
                          </div>
                        </section>

                        {/* Metas */}
                        <section className="space-y-4">
                          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-neutral-700 pb-2">
                            Metas de afiliación
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 p-4">
                            <div className="flex-1 min-w-[180px]">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Objetivo total de campaña
                              </p>
                            </div>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              value={metaGeneral}
                              onChange={(e) =>
                                setMetaGeneral(parseInt(e.target.value, 10) || 0)
                              }
                              className={cn(numberInputClass, "w-32 sm:w-36 border-gray-300 dark:border-neutral-600")}
                              placeholder="3250"
                            />
                          </div>

                          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            Líderes y empleados
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
                              <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                  Meta mínima
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  De <strong className="text-red-600 dark:text-red-400">Bajo</strong> a{" "}
                                  <strong className="text-yellow-600 dark:text-yellow-400">Medio</strong>
                                </p>
                              </div>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={metaMinima}
                                onChange={(e) =>
                                  setMetaMinima(parseInt(e.target.value) || 0)
                                }
                                className={cn(
                                  numberInputClass,
                                  "shrink-0 text-yellow-700 dark:text-yellow-400 border-yellow-400 dark:border-yellow-600",
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                              <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                  Meta
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  <strong className="text-blue-600 dark:text-blue-400">Cumple</strong> o{" "}
                                  <strong className="text-green-600 dark:text-green-400">Alto</strong>
                                </p>
                              </div>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={metaCelula}
                                onChange={(e) =>
                                  setMetaCelula(parseInt(e.target.value) || 0)
                                }
                                className={cn(
                                  numberInputClass,
                                  "shrink-0 text-blue-700 dark:text-blue-400 border-blue-400 dark:border-blue-600",
                                )}
                              />
                            </div>
                          </div>

                          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            Planilla
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
                              <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                  Meta mínima
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  De <strong className="text-red-600 dark:text-red-400">Bajo</strong> a{" "}
                                  <strong className="text-yellow-600 dark:text-yellow-400">Medio</strong>
                                </p>
                              </div>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={metaPlanillaMinima}
                                onChange={(e) =>
                                  setMetaPlanillaMinima(
                                    parseInt(e.target.value, 10) || 0,
                                  )
                                }
                                className={cn(
                                  numberInputClass,
                                  "shrink-0 text-yellow-700 dark:text-yellow-400 border-yellow-400 dark:border-yellow-600",
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                              <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                  Meta
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  <strong className="text-blue-600 dark:text-blue-400">Cumple</strong> o{" "}
                                  <strong className="text-green-600 dark:text-green-400">Alto</strong>
                                </p>
                              </div>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={metaPlanilla}
                                onChange={(e) =>
                                  setMetaPlanilla(parseInt(e.target.value, 10) || 0)
                                }
                                className={cn(
                                  numberInputClass,
                                  "shrink-0 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-600",
                                )}
                              />
                            </div>
                          </div>

                          {metaCelula > 0 && (
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                              Necesitas al menos{" "}
                              <span className="text-[#06c] dark:text-blue-400">
                                {Math.ceil(metaGeneral / metaCelula).toLocaleString()}
                              </span>{" "}
                              líderes/empleados para alcanzar la meta
                            </p>
                          )}

                          <hr className="border-gray-200 dark:border-neutral-700" />

                          {/* Clasificación por nivel */}
                          <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                            <div className="bg-gray-100 dark:bg-neutral-800 px-4 py-2.5">
                              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                Clasificación por nivel
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 dark:bg-neutral-700">
                              {NIVELES.map((nivel) => (
                                <div
                                  key={nivel.key}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3",
                                    nivel.bg,
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-3 w-3 shrink-0 rounded-full",
                                      nivel.dot,
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-sm font-bold w-16 shrink-0",
                                      nivel.text,
                                    )}
                                  >
                                    {nivel.nombre}
                                  </span>
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    <span className="block">
                                      Líderes/empleados:{" "}
                                      {descripcionNivel(
                                        nivel.key,
                                        metaMinima,
                                        metaCelula,
                                      )}
                                    </span>
                                    <span className="block text-emerald-700 dark:text-emerald-400">
                                      Planilla:{" "}
                                      {descripcionNivel(
                                        nivel.key,
                                        metaPlanillaMinima,
                                        metaPlanilla,
                                      )}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-neutral-800 px-6 py-5 bg-gray-50 dark:bg-neutral-900/80">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSaving}
                      className="rounded-lg px-6 h-11 text-base"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || isLoading}
                      className="rounded-lg px-6 h-11 text-base gap-2 min-w-[130px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
