"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import useUserData from "@/hooks/sesion/useUserData";
import { obtenerConfiguracionAction, actualizarConfiguracionAction } from "./actions/configuracion";

export default function ConfiguracionSistema() {
  const { rol, cargando: cargandoRol } = useUserData();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const canEdit = rol === "SUPER" || rol === "ADMIN";

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const [nombreCandidato, setNombreCandidato] = useState("");
  const [lugar, setLugar] = useState("");
  const [frase, setFrase] = useState("");

  const handleEdit = () => {
    if (config) {
      setNombreCandidato(config.nombre_candidato);
      setLugar(config.lugar);
      setFrase(config.frase || "");
      setIsEditing(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      if (!nombreCandidato || !lugar) {
        toast.warning("Complete los campos obligatorios");
        return;
      }
      await actualizarConfiguracionAction(nombreCandidato, lugar, frase);
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      setIsEditing(false);
      toast.success("Actualizado");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  if (isLoading || cargandoRol) return <div className="h-16 w-full bg-blue-50/50 animate-pulse rounded-xl mb-2" />;
  
  if (!config && !canEdit) return null;

  const currentConfig = config || { nombre_candidato: "", lugar: "", frase: "" };
  const isNew = !config;

  return (
    <div className="mb-2 w-full transition-all duration-300">
      {isEditing || (isNew && canEdit) ? (
        <div className="bg-white border border-blue-100 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-sm max-w-2xl mx-auto">
          <Input
            defaultValue={currentConfig.nombre_candidato}
            onChange={(e) => setNombreCandidato(e.target.value)}
            className="h-10 text-center font-bold text-blue-900"
            placeholder="NOMBRE DEL CANDIDATO"
          />
          <Input
             defaultValue={currentConfig.frase}
             onChange={(e) => setFrase(e.target.value)}
             className="h-9 text-center text-sm italic text-gray-500"
             placeholder="Frase o lema"
          />
          <Input
            defaultValue={currentConfig.lugar}
            onChange={(e) => setLugar(e.target.value)}
            className="h-9 text-center text-sm font-semibold uppercase tracking-widest"
            placeholder="Lugar"
          />
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-gray-400">
                Cancelar
              </Button>
            )}
            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Check size={16} className="mr-1" /> {isNew ? "Asignar" : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pb-5 w-full">
          <div className="flex flex-col relative group inline-flex max-w-full">
            <h1 className="text-2xl md:text-5xl font-bold text-center leading-tight bg-gradient-to-r from-blue-800 via-blue-400 to-blue-800 bg-[length:200%_auto] text-transparent bg-clip-text animate-text-shine">
              {currentConfig.nombre_candidato || "Sin nombre asignado"}
            </h1>
            
            {currentConfig.frase && (
              <p className="mt-1 text-base md:text-lg text-blue-500 font-medium italic opacity-80 text-center">
                "{currentConfig.frase}"
              </p>
            )}

            <div className="flex justify-end mt-1 w-full">
              <span className="text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                <span className="h-[1px] w-6 bg-blue-200"></span>
                {currentConfig.lugar || "Sin lugar"}
              </span>
            </div>

            {canEdit && (
              <button
                onClick={handleEdit}
                title="Editar Información"
                className="absolute -top-2 -right-10 p-2 text-blue-700 hover:text-blue-900 hover:bg-gray-100 transition-all rounded-md"
              >
                <Edit size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
