"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";

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
  const buscador = useBuscadorLider(lideres, setValue);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 font-sans">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold uppercase">
            {isEditMode ? "Editar Afiliado" : "Nuevo Afiliado"}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("nombres")}
              placeholder="Nombres"
              readOnly={isFirstMember}
              className={isFirstMember ? "bg-gray-100" : ""}
            />
            <Input
              {...register("apellidos")}
              placeholder="Apellidos"
              readOnly={isFirstMember}
              className={isFirstMember ? "bg-gray-100" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input {...register("telefono")} placeholder="Teléfono" />
            <Input {...register("dpi")} placeholder="DPI" />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase block leading-none">
                Nacimiento
              </label>
              <Input
                type="date"
                {...register("nacimiento")}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase block leading-none">
                Sexo
              </label>
              <div className="flex rounded-md border p-1 bg-gray-50 h-9">
                <button
                  type="button"
                  onClick={() => setValue("sexo", "M")}
                  className={`flex-1 rounded text-[10px] font-black transition-all ${sexoActual === "M" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200"}`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setValue("sexo", "F")}
                  className={`flex-1 rounded text-[10px] font-black transition-all ${sexoActual === "F" ? "bg-pink-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200"}`}
                >
                  F
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              {...register("lugar_id", { valueAsNumber: true })}
              className="w-full h-10 px-3 border rounded-md text-sm bg-white"
            >
              <option value={0}>Seleccione lugar...</option>
              {lugares.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
            <select
              {...register("politica")}
              className="w-full h-10 px-3 border rounded-md text-sm bg-white"
            >
              <option value="">Interés Político...</option>
              {POLITICAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full text-blue-600 border-blue-200 text-[10px] font-bold uppercase h-10 shadow-sm"
            onClick={() =>
              window.open(
                "https://tse.org.gt/reg-ciudadanos/sistema-de-estadisticas/consulta-de-afiliacion",
                "_blank",
              )
            }
          >
            Verificar en TSE
          </Button>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                No. Padrón
              </label>
              <Input {...register("no_padron")} placeholder="No. Padrón" />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Religión
              </label>
              <div className="flex gap-2 h-10">
                {!mostrandoNuevaReligion ? (
                  <>
                    <select
                      {...register("religion")}
                      className="flex-1 px-3 border rounded-md text-sm bg-white"
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
                      className="shrink-0 border-green-200 text-green-600 h-10 w-10"
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
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-red-500 h-10 w-10"
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
          </div>

          <input
            type="hidden"
            {...register("lider_id")}
            value={liderPredefinidoId || ""}
          />

          <div className="flex justify-between items-center pt-4 border-t mt-2">
            <Image
              src="/gif/afiliados/gif0.gif"
              alt="Animación"
              width={45}
              height={45}
              unoptimized
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs font-bold uppercase"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700 text-xs font-bold uppercase px-8 h-10"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
