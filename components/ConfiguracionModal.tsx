"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { obtenerConfiguracionAction, actualizarConfiguracionAction } from "@/components/dashboard/actions/configuracion";

export default function ConfiguracionModal() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    enabled: isOpen,
  });

  const [nombreCandidato, setNombreCandidato] = useState("");
  const [lugar, setLugar] = useState("");
  const [frase, setFrase] = useState("");
  const [metaCelula, setMetaCelula] = useState(15);
  const [metaMinima, setMetaMinima] = useState(10);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Populate fields when data is loaded and modal is open
  if (config && isOpen && !nombreCandidato && !lugar && !frase) {
    if (config.nombre_candidato || config.lugar || config.frase || config.meta_celula) {
      setNombreCandidato(config.nombre_candidato || "");
      setLugar(config.lugar || "");
      setFrase(config.frase || "");
      setMetaCelula(config.meta_celula ?? 15);
      setMetaMinima(config.meta_celula_minima ?? 10);
    }
  }

  const handleSave = async () => {
    try {
      if (!nombreCandidato || !lugar) {
        toast.warning("Complete los campos obligatorios");
        return;
      }
      if (metaMinima >= metaCelula) {
        toast.warning("El límite inferior (Medio/Bajo) debe ser menor a la meta (Alto/Cumple)");
        return;
      }
      await actualizarConfiguracionAction(nombreCandidato, lugar, frase, metaCelula, metaMinima);
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      toast.success("Configuración general guardada");
      handleClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 p-0 rounded-full shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={handleOpen}
        title="Configuración de Candidato"
      >
        <Settings className="h-5 w-5 hover:rotate-90 transition-transform duration-300" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-400 text-center">
              Configuración del Sistema
            </h2>

            {isLoading ? (
               <div className="h-32 w-full flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Nombre del Candidato *</label>
                  <Input
                    value={nombreCandidato}
                    onChange={(e) => setNombreCandidato(e.target.value)}
                    className="h-10 font-medium"
                    placeholder="Ej. JUAN PEREZ"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Lugar *</label>
                  <Input
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="h-10 font-medium"
                    placeholder="Ej. CIUDAD"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Frase o Lema</label>
                  <Input
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    className="h-10 font-medium"
                    placeholder="Ej. El futuro es hoy"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Meta de Célula (Nivel Cumple)</label>
                    <Input
                      type="number"
                      value={metaCelula}
                      onChange={(e) => setMetaCelula(parseInt(e.target.value) || 0)}
                      className="h-10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Meta Mínima (Nivel Medio)</label>
                    <Input
                      type="number"
                      value={metaMinima}
                      onChange={(e) => setMetaMinima(parseInt(e.target.value) || 0)}
                      className="h-10 font-medium"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" className="rounded-full text-gray-600 dark:text-gray-300" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-full">
                    <Check size={16} className="mr-2" /> Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
