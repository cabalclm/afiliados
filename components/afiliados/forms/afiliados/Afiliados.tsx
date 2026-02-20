"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";

import { guardarAfiliadoAction } from "./actions";
import { POLITICAS, type AfiliadoFormData } from "./schemas";
import {
  useAfiliadosForm,
  useInicializarFormulario,
  useBuscadorLider,
  useClickOutside,
} from "./hooks";

type Lugar = { id: number; nombre: string };
type Lider = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
};
type AfiliadoType = any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  afiliadoAEditar?: AfiliadoType | null;
  liderPredefinidoId?: string | null;
  lugares: Lugar[];
  lideres: Lider[];
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
  isFirstMember = false,
  datosLider = null,
}: Props) {
  const isEditMode = !!afiliadoAEditar;
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

  const liderInputRef = useClickOutside(() =>
    buscador.setShowLiderSuggestions(false),
  );

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

  const onSubmit = async (formData: AfiliadoFormData) => {
    const res = await guardarAfiliadoAction(formData, afiliadoAEditar?.id);
    if (res?.error) {
      if (res.field)
        setError(res.field as any, { type: "manual", message: res.error });
      else toast.error(`Error: ${res.error}`);
      return;
    }
    toast.success(
      `Afiliado ${isEditMode ? "actualizado" : "creado"} correctamente.`,
    );
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditMode
              ? "Editar Afiliado"
              : isFirstMember
                ? "Registrarme como Miembro"
                : "Nuevo Afiliado"}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {isFirstMember && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100">
            Hola <strong>{datosLider?.nombres}</strong>, completa tus datos a
            continuación.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("nombres")}
              placeholder="Nombres"
              readOnly={isFirstMember}
              className={`${errors.nombres && "border-red-500"} ${isFirstMember ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            <Input
              {...register("apellidos")}
              placeholder="Apellidos"
              readOnly={isFirstMember}
              className={`${errors.apellidos && "border-red-500"} ${isFirstMember ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("telefono")}
              placeholder="Teléfono"
              className={errors.telefono && "border-red-500"}
            />
            <Input
              {...register("dpi")}
              placeholder="DPI"
              className={errors.dpi && "border-red-500"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Fecha Nacimiento
              </label>
              <Input
                type="date"
                {...register("nacimiento")}
                className={errors.nacimiento && "border-red-500"}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Sexo
              </label>
              <div className="flex rounded-md border p-1 bg-gray-100">
                <button
                  type="button"
                  onClick={() => setValue("sexo", "M")}
                  className={`flex-1 rounded py-2 text-sm font-semibold ${sexoActual === "M" ? "bg-blue-500 text-white shadow" : "text-gray-600"}`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setValue("sexo", "F")}
                  className={`flex-1 rounded py-2 text-sm font-semibold ${sexoActual === "F" ? "bg-pink-500 text-white shadow" : "text-gray-600"}`}
                >
                  F
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              {...register("lugar_id", { valueAsNumber: true })}
              className="w-full h-10 px-3 border rounded-md border-gray-300"
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
              className={`w-full h-10 px-3 border rounded-md ${errors.politica ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Seleccione Política...</option>
              {POLITICAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors gap-2 font-semibold"
              onClick={() =>
                window.open(
                  "https://tse.org.gt/reg-ciudadanos/sistema-de-estadisticas/consulta-de-afiliacion",
                  "_blank",
                )
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              Verificar Empadronamiento en TSE
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                No. Padrón
              </label>
              <Input
                {...register("no_padron")}
                placeholder="Ingrese No. Padrón"
                className={errors.no_padron ? "border-red-500" : ""}
              />
              {errors.no_padron && (
                <span className="text-xs text-red-500">
                  {errors.no_padron.message as string}
                </span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Religión
              </label>
              <select
                {...register("religion")}
                className="w-full h-10 px-3 border rounded-md border-gray-300"
              >
                <option value="">Seleccione religión...</option>
                <option value="Católico">Católico</option>
                <option value="Evangélico">Evangélico</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {religionActual === "Otro" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Especifique su religión
              </label>
              <Input
                {...register("religion_otra")}
                placeholder="Ingrese su religión"
              />
            </div>
          )}

          <input
            type="hidden"
            {...register("lider_id")}
            value={liderPredefinidoId || ""}
          />

          <div className="flex justify-between items-center pt-4">
            <Image
              src="/gif/afiliados/gif0.gif"
              alt="Animación"
              width={60}
              height={60}
              unoptimized
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700"
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
