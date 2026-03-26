"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Search, X } from "lucide-react";

import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import ConfiguracionSistema from "../dashboard/ConfiguracionSistema";

import Lideres from "./Lideres";
import AfiliadosGeneral from "./AfiliadosGeneral";
import Form from "./forms/afiliados/Afiliados";
import Celula from "./Celula";
import { SignupForm } from "@/components/admin/sign-up/SignForm";
import type { Afiliado, Lider } from "./esquemas";
import useUserData from "@/hooks/sesion/useUserData";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";

import { listarUsuariosAction } from "./actions/usuarios";
import { obtenerAfiliadosAction } from "./actions/afiliados";
import { obtenerLugaresAction } from "./actions/lugares";

type Lugar = { id: number; nombre: string };
type Tab = "Lideres" | "Afiliados" | "Administrativos";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Ver() {
  const { rol, cargando: cargandoRol, userId } = useUserData();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [lideres, setLideres] = useState<Lider[]>([]);
  const [administrativos, setAdministrativos] = useState<Lider[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Lideres");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCelulaOpen, setIsCelulaOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(
    null,
  );
  const [liderAEditar, setLiderAEditar] = useState<Lider | null>(null);
  const [liderParaCelula, setLiderParaCelula] = useState<Lider | null>(null);
  const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<
    string | null
  >(null);

  const [isFirstMemberAddition, setIsFirstMemberAddition] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // TanStack Query para afiliados globales (se activa solo si es necesario)
  const { data: afiliados = [], isLoading: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled: isEstadisticasOpen || activeTab === "Afiliados" || isCelulaOpen,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Al recargar datos, invalidamos el caché de TanStack para forzar actualización
      queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
      queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });

      const pLideres = listarUsuariosAction("LIDER");
      
      // Filtramos qué administrativos pedir según el rol
      const rolesAdmin = rol === "SUPER" ? ["ADMINISTRADOR", "SUPER"] : ["ADMINISTRADOR"];
      const pAdmins = listarUsuariosAction(rolesAdmin);
      
      const pLugares = obtenerLugaresAction();

      const [lideresData, adminsData, lugaresData] = await Promise.all([
        pLideres,
        pAdmins,
        pLugares
      ]);
      
      const allLideres = (
        Array.isArray(lideresData)
          ? lideresData
          : (lideresData as any)?.data || []
      ) as Lider[];
      
      if (rol === "LIDER" && userId) {
        const myLider = allLideres.find((l) => l.id === userId);
        const otherLideres = allLideres.filter((l) => l.id !== userId);
        setLideres(myLider ? [myLider, ...otherLideres] : allLideres);
      } else {
        setLideres(allLideres);
      }
      
      setLugares(
        (Array.isArray(lugaresData)
          ? lugaresData
          : (lugaresData as any)?.data || []) as Lugar[],
      );

      setAdministrativos(
        (Array.isArray(adminsData)
          ? adminsData
          : (adminsData as any)?.data || []) as Lider[],
      );
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cargandoRol && rol) fetchData();
  }, [rol, cargandoRol]);

  const handleOpenCreateLiderModal = () => {
    setLiderAEditar(null);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setIsSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    queryClient.invalidateQueries({ queryKey: ["lideres"] });
    queryClient.invalidateQueries({ queryKey: ["administrativos"] });
    fetchData();
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
  };

  const handleOpenAnadirAfiliadoModal = (
    liderId: string,
    isFirstMember = false,
  ) => {
    setIsCelulaOpen(false);
    setAfiliadoParaEditar(null);
    setLiderParaNuevoAfiliado(liderId);
    setIsFirstMemberAddition(isFirstMember);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (afiliado: Afiliado) => {
    setIsCelulaOpen(false);
    setAfiliadoParaEditar(afiliado);
    setLiderParaNuevoAfiliado(null);
    setIsFirstMemberAddition(false);
    setIsFormOpen(true);
  };

  const handleOpenCelulaModal = (lider: Lider) => {
    if (!lider) return;
    setLiderParaCelula(lider);
    setIsCelulaOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    if (liderParaCelula) setIsCelulaOpen(true);
  };

  const handleCloseCelulaModal = () => {
    setIsCelulaOpen(false);
    setLiderParaCelula(null);
  };

  const handleSaveAndCloseForm = async () => {
    setIsFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
    
    await fetchData();
    
    if (liderParaCelula) {
      const updatedLider = lideres.find((l) => l.id === liderParaCelula.id);
      if (updatedLider) {
        setLiderParaCelula(updatedLider);
        setIsCelulaOpen(true);
      }
    }
  };

  return (
    <>
      <div className="px-2 md:px-6">
        <ConfiguracionSistema />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-2xl font-bold text-black md:text-3xl whitespace-nowrap">
              Gestión de Datos 📊
            </h1>
          </div>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto">
            <Button
              onClick={() => setIsEstadisticasOpen(true)}
              variant="outline"
              className="gap-2 w-full text-xs md:text-xl"
            >
              📊 Estadísticas Generales
            </Button>
            {(rol === "ADMINISTRADOR" || rol === "SUPER") && (
              <Button
                onClick={handleOpenCreateLiderModal}
                className="gap-2 w-full text-xl"
              >
                🦸 Nuevo Líder
              </Button>
            )}
          </div>
        </div>

        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("Lideres")}
            className={`px-4 py-2 text-base font-semibold ${activeTab === "Lideres" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
          >
            👥 Líderes
          </button>
          <button
            onClick={() => setActiveTab("Afiliados")}
            className={`px-4 py-2 text-base font-semibold ${activeTab === "Afiliados" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
          >
            ✅ Miembros
          </button>
          {(rol === "ADMINISTRADOR" || rol === "SUPER") && (
            <button
              onClick={() => setActiveTab("Administrativos")}
              className={`px-4 py-2 text-base font-semibold ${activeTab === "Administrativos" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              🛡️ Administrativos
            </button>
          )}
        </div>

        {activeTab === "Lideres" && (
          <Lideres
            lideres={lideres}
            onVerCelula={handleOpenCelulaModal}
            onEditar={handleOpenEditLiderModal}
            rolUsuarioSesion={rol}
            onDataChange={fetchData}
            searchTerm={searchTerm}
            idUsuarioSesion={userId}
            isLoading={loading}
          />
        )}
        {activeTab === "Afiliados" && (
          <AfiliadosGeneral
            afiliados={afiliados}
            lideres={lideres}
            onEditar={handleOpenEditModal}
            onDataChange={fetchData}
            searchTerm={searchTerm}
          />
        )}
        {activeTab === "Administrativos" && (
          <Lideres
            lideres={administrativos}
            onVerCelula={handleOpenCelulaModal}
            onEditar={handleOpenEditLiderModal}
            rolUsuarioSesion={rol}
            onDataChange={fetchData}
            searchTerm={searchTerm}
            idUsuarioSesion={userId}
            isLoading={loading}
            hideMeta
            showRole={true}
          />
        )}
      </div>

      <Transition show={isEstadisticasOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsEstadisticasOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-0 md:p-4">
            <DialogPanel className="w-screen h-screen bg-white flex flex-col">
              <div className="flex justify-between items-center px-6 py-3 border-b shrink-0 bg-white z-10">
                <div className="flex flex-col">
                  <h3 className="text-base md:text-xl font-bold uppercase leading-none">
                    Estadísticas Generales 📊
                  </h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">
                    Análisis global de {afiliados.length} registros
                  </p>
                </div>

                <Button
                  onClick={() => setIsEstadisticasOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0 h-8 w-8"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/30 py-4 md:p-8">
                <div className="max-w-[1600px] mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full pt-4">
                    <div className="bg-white flex flex-col min-h-[450px]">
                      <EstadisticasEdades afiliados={afiliados} />
                    </div>

                    <div className="bg-white flex flex-col min-h-[450px]">
                      <EstadisticasEmpadronados afiliados={afiliados} />
                    </div>

                    <div className="bg-white flex flex-col min-h-[450px]">
                      <EstadisticasReligiones afiliados={afiliados} />
                    </div>

                    <div className="bg-white flex flex-col min-h-[450px]">
                      <EstadisticasPoliticas afiliados={afiliados} />
                    </div>

                    <div className="bg-white flex flex-col min-h-[450px] md:col-span-2">
                      <EstadisticasLugares afiliados={afiliados} />
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      <Celula
        isOpen={isCelulaOpen}
        onClose={handleCloseCelulaModal}
        lider={liderParaCelula}
        onEditar={handleOpenEditModal}
        onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
        onDataChange={fetchData}
        rolUsuarioSesion={rol ?? ""}
      />

      <Form
        isOpen={isFormOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveAndCloseForm}
        afiliadoAEditar={afiliadoParaEditar}
        liderPredefinidoId={liderParaNuevoAfiliado}
        lugares={lugares}
        lideres={lideres}
        afiliados={afiliados}
        isFirstMember={isFirstMemberAddition}
        datosLider={lideres.find((l) => l.id === liderParaNuevoAfiliado)}
      />

      <Transition show={isSignupModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={handleCloseSignupModal}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <DialogPanel className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all p-4 md:p-8">
                <SignupForm
                  initialData={liderAEditar}
                  onSuccess={handleSignupSuccess}
                  onClose={handleCloseSignupModal}
                  isModal={true}
                />
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
