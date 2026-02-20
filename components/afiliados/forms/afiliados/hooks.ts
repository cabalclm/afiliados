import { useState, useEffect, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { afiliadoSchema, type AfiliadoFormData } from "./schemas";

type Lider = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
};
type AfiliadoType = any;

export function useAfiliadosForm() {
  return useForm<AfiliadoFormData>({
    resolver: zodResolver(afiliadoSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      telefono: "",
      dpi: "",
      nacimiento: "",
      sexo: "M",
      lugar_id: 0,
      lider_id: null,
      politica: "",
      no_padron: "",
    },
  });
}

export function useInicializarFormulario(
  isOpen: boolean,
  afiliadoAEditar: AfiliadoType | null | undefined,
  liderPredefinidoId: string | null | undefined,
  lideres: Lider[],
  methods: UseFormReturn<AfiliadoFormData>,
  setLiderSearch: (val: string) => void,
  setShowLiderSuggestions: (val: boolean) => void,
  isFirstMember: boolean = false,
  datosLider: any | null = null,
) {
  useEffect(() => {
    if (isOpen) {
      if (afiliadoAEditar) {
        methods.reset({
          ...afiliadoAEditar,
          nacimiento: afiliadoAEditar.nacimiento
            ? new Date(afiliadoAEditar.nacimiento).toISOString().split("T")[0]
            : "",
          religion: afiliadoAEditar.religion || "",
          religion_otra: "",
          lugar_id: afiliadoAEditar.lugar_id,
          no_padron: afiliadoAEditar.no_padron || "",
          politica: afiliadoAEditar.politica || "",
        } as AfiliadoFormData);

        const currentLider = lideres.find(
          (l) => l.id === afiliadoAEditar.lider_id,
        );
        setLiderSearch(
          currentLider
            ? `${currentLider.nombres} ${currentLider.apellidos}`
            : "",
        );
      } else {
        const nombresIniciales = isFirstMember && datosLider ? datosLider.nombres : "";
        const apellidosIniciales = isFirstMember && datosLider ? datosLider.apellidos : "";
        const telefonoInicial = isFirstMember && datosLider?.telefono ? datosLider.telefono : "";

        methods.reset({
          nombres: nombresIniciales,
          apellidos: apellidosIniciales,
          telefono: telefonoInicial,
          dpi: "",
          lider_id: liderPredefinidoId || null,
          nacimiento: "",
          sexo: "M",
          lugar_id: 0,
          no_padron: "",
          politica: "",
          religion: "",
          religion_otra: "",
        });

        if (liderPredefinidoId) {
          const preLider = lideres.find((l) => l.id === liderPredefinidoId);
          setLiderSearch(preLider ? `${preLider.nombres} ${preLider.apellidos}` : "");
        } else {
          setLiderSearch("");
        }
      }
      setShowLiderSuggestions(false);
    }
  }, [isOpen, afiliadoAEditar, liderPredefinidoId, methods, lideres, setLiderSearch, setShowLiderSuggestions, isFirstMember, datosLider]);
}

export function useBuscadorLider(lideres: Lider[], setValue: any) {
  const [liderSearch, setLiderSearch] = useState("");
  const [liderSuggestions, setLiderSuggestions] = useState<Lider[]>([]);
  const [showLiderSuggestions, setShowLiderSuggestions] = useState(false);

  const handleLiderSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setLiderSearch(term);

    if (!term.trim()) {
      setLiderSuggestions([]);
      setShowLiderSuggestions(false);
      setValue("lider_id", null);
    } else {
      const filtered = lideres.filter((l) =>
        `${l.nombres} ${l.apellidos}`
          .toLowerCase()
          .includes(term.toLowerCase()),
      );
      setLiderSuggestions(filtered);
      setShowLiderSuggestions(true);
    }
  };

  const seleccionarLider = (lider: Lider) => {
    setLiderSearch(`${lider.nombres} ${lider.apellidos}`);
    setValue("lider_id", lider.id);
    setShowLiderSuggestions(false);
  };

  return {
    liderSearch,
    setLiderSearch,
    liderSuggestions,
    showLiderSuggestions,
    setShowLiderSuggestions,
    handleLiderSearchChange,
    seleccionarLider,
  };
}

export function useClickOutside(callback: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [callback]);
  return ref;
}
