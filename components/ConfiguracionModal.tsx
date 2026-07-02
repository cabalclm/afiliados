"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { obtenerConfiguracionAction, actualizarConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { enviarMensajeAction } from "@/components/dashboard/actions/mensajes";

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
  
  const [activeTab, setActiveTab] = useState<"general" | "mensajes">("general");
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [publicoObjetivo, setPublicoObjetivo] = useState("Todos");
  const [usuariosEspecificos, setUsuariosEspecificos] = useState<string[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const dashboardData: any = queryClient.getQueryData(["dashboard-data"]);
  const usuarios = (dashboardData?.usuarios || []) as any[];
  const usuariosFiltrados = usuarios.filter(u => u.nombres?.toLowerCase().includes(busquedaUsuario.toLowerCase()));

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

  const handleEnviarMensaje = async () => {
    if (!mensajeTexto.trim()) {
      toast.warning("Escribe un mensaje para enviar");
      return;
    }
    
    if (publicoObjetivo === "Usuarios Específicos" && usuariosEspecificos.length === 0) {
      toast.warning("Debes seleccionar al menos un usuario específico");
      return;
    }
    
    setEnviandoMensaje(true);
    try {
      await enviarMensajeAction(mensajeTexto, publicoObjetivo, usuariosEspecificos);
      toast.success(`Mensaje enviado exitosamente a: ${publicoObjetivo}`);
      setMensajeTexto("");
      setPublicoObjetivo("Todos");
      setUsuariosEspecificos([]);
      setBusquedaUsuario("");
    } catch (error: any) {
      toast.error("Error al enviar mensaje: " + error.message);
    } finally {
      setEnviandoMensaje(false);
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
            
            <div className="flex border-b dark:border-neutral-800 mb-4">
              <button
                className={`flex-1 py-2 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === "general"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("general")}
              >
                General
              </button>
              <button
                className={`flex-1 py-2 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === "mensajes"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("mensajes")}
              >
                Mensajes Masivos
              </button>
            </div>
            
            {isLoading ? (
               <div className="h-32 w-full flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
            ) : activeTab === "general" ? (
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
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Mensaje para los usuarios
                  </label>
                  <textarea
                    value={mensajeTexto}
                    onChange={(e) => setMensajeTexto(e.target.value)}
                    className="w-full min-h-[100px] p-3 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-gray-900 dark:text-gray-100"
                    placeholder="Escribe un mensaje de motivación, aviso o instrucción importante..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Público Objetivo (Nivel de Compromiso)
                  </label>
                  <select
                    value={publicoObjetivo}
                    onChange={(e) => {
                      setPublicoObjetivo(e.target.value);
                      if (e.target.value !== "Usuarios Específicos") {
                        setUsuariosEspecificos([]);
                      }
                    }}
                    className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Todos">Todos (Global)</option>
                    <option value="Alto">Alto (Superaron la meta)</option>
                    <option value="Cumple">Cumple (Llegaron a la meta exacta)</option>
                    <option value="Medio">Medio (Cerca de la meta)</option>
                    <option value="Bajo">Bajo (Lejos de la meta)</option>
                    <option value="Usuarios Específicos">Usuarios Específicos</option>
                  </select>
                </div>
                
                {publicoObjetivo === "Usuarios Específicos" && (
                  <div className="border border-gray-200 dark:border-neutral-700 rounded-md p-3 mb-2 bg-gray-50/50 dark:bg-neutral-800/50">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Seleccionar Usuarios ({usuariosEspecificos.length})
                    </label>
                    <Input
                      placeholder="Buscar por nombre..."
                      value={busquedaUsuario}
                      onChange={(e) => setBusquedaUsuario(e.target.value)}
                      className="mb-2 h-9 text-sm"
                    />
                    <div className="max-h-32 overflow-y-auto flex flex-col gap-1 border border-gray-200 dark:border-neutral-700 rounded p-1 bg-white dark:bg-neutral-900">
                      {usuariosFiltrados.slice(0, 30).map(u => {
                        const isSelected = usuariosEspecificos.includes(u.id);
                        return (
                          <div 
                            key={u.id}
                            onClick={() => {
                              if (isSelected) {
                                setUsuariosEspecificos(prev => prev.filter(id => id !== u.id));
                              } else {
                                setUsuariosEspecificos(prev => [...prev, u.id]);
                              }
                            }}
                            className={`px-3 py-2 rounded text-sm cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold' : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}
                          >
                            <span className="truncate pr-2">{u.nombres}</span>
                            {isSelected && <Check size={16} className="shrink-0" />}
                          </div>
                        )
                      })}
                      {usuariosFiltrados.length === 0 && (
                        <div className="p-2 text-center text-xs text-gray-500">No se encontraron usuarios</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                  <strong>Nota:</strong> Al enviar este mensaje, cualquier mensaje anterior se desactivará. El nuevo mensaje bloqueará la pantalla de los usuarios seleccionados hasta que presionen "Continuar".
                </div>

                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleEnviarMensaje} 
                    disabled={enviandoMensaje || !mensajeTexto.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold h-12 text-base"
                  >
                    {enviandoMensaje ? "Enviando..." : "Enviar Mensaje Masivo"}
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
