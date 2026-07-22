"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  fechaCalendarioAISO,
  formatearEntradaDMY,
  formatearFechaDMY,
  normalizarNacimientoForm,
  parseFechaCalendario,
  parseFechaDMYInput,
} from "@/utils/formatoFechaGT";
import { guardarAfiliadoAction } from "./actions";
import {
  useAfiliadosForm,
  useBuscadorLider,
  useInicializarFormulario,
} from "./hooks";
import { POLITICAS, type Afiliado, type AfiliadoFormData } from "./schemas";

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
  const nacimientoValor = watch("nacimiento");
  const [dpiErrorLider, setDpiErrorLider] = useState<string | null>(null);
  const [step, setStep] = useState<number>(isEditMode || isFirstMember ? 2 : 1);
  const [esMovil, setEsMovil] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );
  const [nacimientoTexto, setNacimientoTexto] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalViewport, setModalViewport] = useState<{
    maxHeight?: string;
    transform?: string;
  }>({});

  const scrollInputAlFoco = (el: HTMLElement) => {
    if (!esMovil) return;
    window.setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 350);
  };

  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setEsMovil(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtmlX = document.documentElement.style.overflowX;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflowX = prevHtmlX;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !esMovil) {
      setModalViewport({});
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const teclado = window.innerHeight - vv.height;
      if (teclado > 80) {
        setModalViewport({
          maxHeight: `${Math.floor(vv.height * 0.9)}px`,
          transform: `translateY(-${Math.min(teclado * 0.35, 120)}px)`,
        });
      } else {
        setModalViewport({});
      }
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setModalViewport({});
    };
  }, [isOpen, esMovil, step]);

  useEffect(() => {
    if (!isOpen || step !== 1 || isEditMode || isFirstMember) return;
    const t = window.setTimeout(
      () => {
        const input = document.getElementById(
          "dpi-validar-input",
        ) as HTMLInputElement | null;
        input?.focus({ preventScroll: true });
      },
      esMovil ? 400 : 150,
    );
    return () => window.clearTimeout(t);
  }, [isOpen, step, esMovil, isEditMode, isFirstMember]);

  useEffect(() => {
    if (!isOpen) return;
    const v = nacimientoValor || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const dmy = formatearFechaDMY(v);
      setNacimientoTexto(dmy === "—" ? "" : dmy);
      return;
    }
    setNacimientoTexto(v);
  }, [isOpen, nacimientoValor, step]);

  useEffect(() => {
    if (isOpen) {
      setStep(isEditMode || isFirstMember ? 2 : 1);
      setDpiErrorLider(null);
    }
  }, [isOpen, isEditMode, isFirstMember]);

  const buscador = useBuscadorLider(lideres, setValue);

  useEffect(() => {
    if (dpiActual && dpiActual.length === 13) {
      if (!isEditMode || (isEditMode && dpiActual !== afiliadoAEditar?.dpi)) {
        const afiliadoExistente = afiliados.find((a) => a.dpi === dpiActual);
        if (afiliadoExistente) {
          const liderNombre = afiliadoExistente.lider_nombre || "Sin Asignar";
          setDpiErrorLider(liderNombre);
          if (step === 1) {
            // Se eliminó la alerta invasiva
          }
        } else {
          setDpiErrorLider(null);
        }
      }
    } else {
      setDpiErrorLider(null);
    }
  }, [dpiActual, afiliados, isEditMode, afiliadoAEditar, step]);

  const irSiguientePaso = () => {
    if (!dpiActual || dpiActual.length !== 13) {
      toast.error("Por favor ingresa un DPI válido de 13 dígitos");
      return;
    }
    if (dpiErrorLider) {
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
    const nacimientoNorm = normalizarNacimientoForm(formData.nacimiento);
    if (!parseFechaCalendario(nacimientoNorm)) {
      setError("nacimiento", {
        type: "manual",
        message: "Use formato dd/mm/aaaa",
      });
      toast.error("Fecha de nacimiento inválida");
      return;
    }

    const datosProcesados = {
      ...formData,
      nacimiento: nacimientoNorm,
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

  const handleNacimientoMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatearEntradaDMY(e.target.value);
    setNacimientoTexto(formatted);

    if (!formatted) {
      setValue("nacimiento", "", { shouldValidate: true });
      return;
    }

    if (formatted.length === 10) {
      const p = parseFechaDMYInput(formatted);
      if (p) {
        setValue("nacimiento", fechaCalendarioAISO(p), {
          shouldValidate: true,
        });
        return;
      }
    }

    setValue("nacimiento", formatted, { shouldValidate: false });
  };

  const mensajeDpiDuplicado = dpiErrorLider ? (
    <div className="text-center space-y-1">
      <p className="text-xs font-bold text-red-500">
        El DPI ya está registrado en la célula del líder:
      </p>
      <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 leading-tight">
        {dpiErrorLider}
      </p>
    </div>
  ) : null;

  if (!isOpen) return null;

  const fieldClass = "text-base sm:text-sm h-11 sm:h-10";
  const selectClass =
    "w-full h-11 sm:h-10 px-3 border dark:border-neutral-700 rounded-md text-base sm:text-sm bg-white dark:bg-neutral-900";
  const labelClass =
    "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block leading-none mb-1";

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 overflow-hidden overscroll-none px-4 py-4 sm:p-4 ${
        step === 1 && esMovil ? "items-start pt-[8vh]" : "items-center"
      } sm:items-center`}
    >
      <motion.div
        ref={modalRef}
        style={modalViewport}
        className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg min-w-0 mx-auto p-4 sm:p-6 max-h-[88dvh] sm:max-h-[90vh] overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-bold uppercase leading-tight">
            {isEditMode
              ? "Editar Afiliado"
              : step === 1
                ? "Validar DPI"
                : "Nuevo Afiliado"}
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
                id="dpi-validar-input"
                {...register("dpi")}
                type="tel"
                placeholder="DPI (13 dígitos)"
                maxLength={13}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                onFocus={(e) => scrollInputAlFoco(e.currentTarget)}
                className={`h-12 text-base sm:text-lg text-center font-bold tracking-widest ${dpiErrorLider ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
              />
              {mensajeDpiDuplicado}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="uppercase font-bold text-xs w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={irSiguientePaso}
                disabled={!!dpiErrorLider || !dpiActual || dpiActual.length !== 13}
                className="bg-blue-600 hover:bg-blue-700 text-white uppercase font-bold text-xs w-full sm:w-auto"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 min-w-0 max-w-full overflow-x-hidden"
          >
            {!isEditMode && (
              <div className="space-y-1">
                <Input
                  {...register("dpi")}
                  placeholder="Ingrese el DPI (Primero los 13 dígitos)"
                  maxLength={13}
                  className={`${fieldClass} ${dpiErrorLider ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
                />
                {mensajeDpiDuplicado}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <Input
                  {...register("nombres")}
                  placeholder="Nombres"
                  readOnly={isFirstMember}
                  className={`${fieldClass} ${isFirstMember ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                />
                {errors.nombres && (
                  <p className="text-[10px] font-bold text-red-500">
                    {errors.nombres.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <Input
                  {...register("apellidos")}
                  placeholder="Apellidos"
                  readOnly={isFirstMember}
                  className={`${fieldClass} ${isFirstMember ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                />
                {errors.apellidos && (
                  <p className="text-[10px] font-bold text-red-500">
                    {errors.apellidos.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Input
                {...register("telefono")}
                placeholder="Teléfono"
                className={fieldClass}
              />
              {errors.telefono && (
                <p className="text-[10px] font-bold text-red-500">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end min-w-0">
              <div className="space-y-1 min-w-0">
                <label className={labelClass}>Nacimiento</label>
                {esMovil ? (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    value={nacimientoTexto}
                    onChange={handleNacimientoMobile}
                    className={`${fieldClass} min-w-0 w-full max-w-full`}
                    autoComplete="bday"
                  />
                ) : (
                  <Input
                    type="date"
                    {...register("nacimiento")}
                    className={`${fieldClass} min-w-0 w-full max-w-full`}
                  />
                )}
                {errors.nacimiento && (
                  <p className="text-[10px] font-bold text-red-500">
                    {errors.nacimiento.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <label className={labelClass}>Sexo</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
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
                {errors.lugar_id && (
                  <p className="text-[10px] font-bold text-red-500">
                    {errors.lugar_id.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <select {...register("politica")} className={selectClass}>
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
              <Input
                {...register("no_padron")}
                placeholder="No. Padrón"
                className={fieldClass}
              />
              {errors.no_padron && (
                <p className="text-[10px] font-bold text-red-500">
                  {errors.no_padron.message}
                </p>
              )}
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
                  disabled={isSubmitting || !!dpiErrorLider}
                  className={`text-xs font-bold uppercase flex-1 sm:flex-none sm:px-8 h-11 sm:h-10 ${dpiErrorLider ? "bg-gray-400 text-gray-200" : "bg-green-600 text-white hover:bg-green-700"}`}
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
