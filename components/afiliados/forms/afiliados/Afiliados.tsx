"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "@/lib/toast";
import Swal from "@/lib/swal";

import { guardarAfiliadoAction } from "./actions";
import { POLITICAS, type AfiliadoFormData, type Afiliado } from "./schemas";
import {
  useAfiliadosForm,
  useInicializarFormulario,
  useBuscadorLider,
} from "./hooks";

type Lugar = { id: number; nombre: string };
type Lider = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  afiliadoAEditar?: Afiliado | null;
  liderPredefinidoId?: string | null;
  lugares: Lugar[];
  lideres: Lider[];
  afiliados: Afiliado[];
  isFirstMember?: boolean;
  datosLider?: Lider | null;
}

export default function AfiliadosForm({
  isOpen,
  onClose,
  onSave,
  afiliadoAEditar,
  liderPredefinidoId,
  lugares,
  lideres,
  afiliados = [],
  isFirstMember = false,
  datosLider = null,
}: Props) {
  const isEditMode = !!afiliadoAEditar;
  const [mostrandoNuevaReligion, setMostrandoNuevaReligion] = useState(false);

  const form = useAfiliadosForm();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
  } = form;

  const sexoActual = watch("sexo");
  const religionActual = watch("religion");
  const dpiActual = watch("dpi");
  const [dpiError, setDpiError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(isEditMode || isFirstMember ? 2 : 1);

  useEffect(() => {
    if (isOpen) {
      setStep(isEditMode || isFirstMember ? 2 : 1);
      setDpiError(null);
    }
  }, [isOpen, isEditMode, isFirstMember]);

  const buscador = useBuscadorLider(lideres, setValue);

  useEffect(() => {
    if (dpiActual && dpiActual.length === 13) {
      if (!isEditMode || (isEditMode && dpiActual !== afiliadoAEditar?.dpi)) {
        const afiliadoExistente = afiliados.find(a => a.dpi === dpiActual);
        if (afiliadoExistente) {
          const liderNombre = afiliadoExistente.lider_nombre || "Sin Asignar";
          const msj = `El DPI ya está registrado en la célula del líder: ${liderNombre}`;
          setDpiError(msj);
          if (step === 1) {
            // Se eliminó la alerta invasiva
          }
        } else {
          setDpiError(null);
        }
      }
    } else {
      setDpiError(null);
    }
  }, [dpiActual, afiliados, isEditMode, afiliadoAEditar, step]);

  const irSiguientePaso = () => {
    if (!dpiActual || dpiActual.length !== 13) {
      toast.error("Por favor ingresa un DPI válido de 13 dígitos");
      return;
    }
    if (dpiError) {
       return;
    }
    setStep(2);
  };

  useInicializarFormulario(
    isOpen,
    afiliadoAEditar,
    liderPredefinidoId,
    lideres,
    form,
    buscador.setLiderSearch,
    buscador.setShowLiderSuggestions,
    isFirstMember,
    datosLider,
  );

  useEffect(() => {
    if (isOpen && isEditMode && afiliadoAEditar?.religion) {
      const valor = afiliadoAEditar.religion;
      const esEstandar = ["Católico", "Evangélico"].includes(valor);
      if (!esEstandar) {
        setValue("religion", valor);
      }
    }
  }, [isOpen, isEditMode, afiliadoAEditar, setValue]);

  const onSubmit = async (formData: AfiliadoFormData) => {
    const datosProcesados = {
      ...formData,
      religion: mostrandoNuevaReligion
        ? formData.religion_otra
        : formData.religion,
    };

    delete (datosProcesados as any).religion_otra;

    const res = await guardarAfiliadoAction(
      datosProcesados as AfiliadoFormData,
      afiliadoAEditar?.id,
    );
    if (res?.error) {
      if (res.field)
        setError(res.field as any, { type: "manual", message: res.error });
      else toast.error(`Error: ${res.error}`);
      return;
    }

    toast.success(
      `Afiliado ${isEditMode ? "actualizado" : "creado"} correctamente.`,
    );
    setMostrandoNuevaReligion(false);
    onSave();
    onClose();
  };

  const religionesExistentes = Array.from(
    new Set((afiliados || []).map((a) => a.religion).filter(Boolean)),
  ).filter((r) => r !== "Católico" && r !== "Evangélico");

  if (!isOpen) return null;

  const fieldClass = "text-base sm:text-sm h-11 sm:h-10";
  const selectClass =
    "w-full h-11 sm:h-10 px-3 border dark:border-neutral-700 rounded-md text-base sm:text-sm bg-white dark:bg-neutral-900";
  const labelClass =
    "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block leading-none mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <motion.div
        className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg p-4 sm:p-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-bold uppercase leading-tight">
            {isEditMode ? "Editar Afiliado" : step === 1 ? "Validar DPI" : "Nuevo Afiliado"}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                Ingrese el DPI del Afiliado
              </label>
              <Input 
                {...register("dpi")} 
                placeholder="DPI (13 dígitos)" 
                maxLength={13} 
                className={`h-12 text-base sm:text-lg text-center font-bold tracking-widest ${dpiError ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
                autoFocus
              />
              {dpiError && <p className="text-xs font-bold text-red-500 text-center">{dpiError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="uppercase font-bold text-xs">
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={irSiguientePaso} 
                disabled={!!dpiError || !dpiActual || dpiActual.length !== 13}
                className="bg-blue-600 hover:bg-blue-700 text-white uppercase font-bold text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isEditMode && (
              <div className="space-y-1">
                <Input 
                  {...register("dpi")} 
                  placeholder="Ingrese el DPI (Primero los 13 dígitos)" 
                  maxLength={13}
                  className={`${fieldClass} ${dpiError ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
                />
                {dpiError && <p className="text-[10px] font-bold text-red-500">{dpiError}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  {...register("nombres")}
                  placeholder="Nombres"
                  readOnly={isFirstMember}
                  className={`${fieldClass} ${isFirstMember ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                />
                {errors.nombres && <p className="text-[10px] font-bold text-red-500">{errors.nombres.message}</p>}
              </div>
              <div className="space-y-1">
                <Input
                  {...register("apellidos")}
                  placeholder="Apellidos"
                  readOnly={isFirstMember}
                  className={`${fieldClass} ${isFirstMember ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                />
                {errors.apellidos && <p className="text-[10px] font-bold text-red-500">{errors.apellidos.message}</p>}
              </div>
            </div>

          <div className="space-y-1">
              <Input {...register("telefono")} placeholder="Teléfono" className={fieldClass} />
              {errors.telefono && <p className="text-[10px] font-bold text-red-500">{errors.telefono.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className={labelClass}>
                Nacimiento
              </label>
              <Input
                type="date"
                {...register("nacimiento")}
                className={`${fieldClass} sm:h-9 sm:text-xs`}
              />
              {errors.nacimiento && <p className="text-[10px] font-bold text-red-500">{errors.nacimiento.message}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>
                Sexo
              </label>
              <div className="flex rounded-md border dark:border-neutral-700 p-1 bg-gray-50 dark:bg-neutral-800 h-11 sm:h-9">
                <button
                  type="button"
                  onClick={() => setValue("sexo", "M")}
                  className={`flex-1 rounded text-xs sm:text-[10px] font-black transition-all ${sexoActual === "M" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200"}`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setValue("sexo", "F")}
                  className={`flex-1 rounded text-xs sm:text-[10px] font-black transition-all ${sexoActual === "F" ? "bg-pink-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200"}`}
                >
                  F
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <select
                {...register("lugar_id", { valueAsNumber: true })}
                className={selectClass}
              >
                <option value={0}>Seleccione lugar...</option>
                {lugares.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
              </select>
              {errors.lugar_id && <p className="text-[10px] font-bold text-red-500">{errors.lugar_id.message}</p>}
            </div>
            <div className="space-y-1">
              <select
              {...register("politica")}
              className={selectClass}
            >
              <option value="">Interés Político...</option>
              {POLITICAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

          <Button
            type="button"
            variant="outline"
            className="w-full text-blue-600 border-blue-200 text-xs sm:text-[10px] font-bold uppercase h-11 sm:h-10 shadow-sm"
            onClick={() =>
              window.open(
                "https://tse.org.gt/reg-ciudadanos/sistema-de-estadisticas/consulta-de-afiliacion",
                "_blank",
              )
            }
          >
            Verificar en TSE
          </Button>

          <div className="space-y-1">
            <label className={labelClass}>No. Padrón</label>
            <Input {...register("no_padron")} placeholder="No. Padrón" className={fieldClass} />
            {errors.no_padron && <p className="text-[10px] font-bold text-red-500">{errors.no_padron.message}</p>}
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Religión</label>
            <div className="flex gap-2 min-h-11 sm:min-h-10">
              {!mostrandoNuevaReligion ? (
                <>
                  <select
                    {...register("religion")}
                    className={`flex-1 min-w-0 ${selectClass}`}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Católico">Católico</option>
                    <option value="Evangélico">Evangélico</option>
                    {religionesExistentes.map((r) => (
                      <option key={r as string} value={r as string}>
                        {r as string}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0 border-green-200 text-green-600 h-11 w-11 sm:h-10 sm:w-10"
                    onClick={() => setMostrandoNuevaReligion(true)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <div className="flex gap-2 w-full">
                  <Input
                    {...register("religion_otra")}
                    placeholder="Religión..."
                    className={`flex-1 min-w-0 ${fieldClass}`}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-red-500 h-11 w-11 sm:h-10 sm:w-10"
                    onClick={() => {
                      setMostrandoNuevaReligion(false);
                      setValue("religion_otra", "");
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <input
            type="hidden"
            {...register("lider_id")}
            value={liderPredefinidoId || ""}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t dark:border-neutral-800 mt-2">
            <Image
              src="/gif/afiliados/gif0.gif"
              alt="Animación"
              width={45}
              height={45}
              unoptimized
              className="hidden sm:block"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs font-bold uppercase flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!dpiError}
                className={`text-xs font-bold uppercase flex-1 sm:flex-none sm:px-8 h-11 sm:h-10 ${dpiError ? "bg-gray-400 text-gray-200" : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
        )}
      </motion.div>
    </div>
  );
}
