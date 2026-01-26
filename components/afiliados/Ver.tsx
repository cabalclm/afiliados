"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Search, X, PieChart, BarChart3, MapPin, Target } from "lucide-react";

import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";

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
type Tab = "Lideres" | "Afiliados";
type VistaEstadistica = "padron" | "edades" | "lugares" | "politicas";

export default function Ver() {
  const { rol, cargando: cargandoRol, userId } = useUserData();
  const router = useRouter();

  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Lideres");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCelulaOpen, setIsCelulaOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const [vistaEstadisticaActual, setVistaEstadisticaActual] =
    useState<VistaEstadistica>("padron");

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

  const STATS_TABS = [
    { id: "padron", label: "Padrón", icon: PieChart },
    { id: "edades", label: "Demografía", icon: BarChart3 },
    { id: "lugares", label: "Ubicación", icon: MapPin },
    { id: "politicas", label: "Intereses", icon: Target },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lideresData, afiliadosData, lugaresData] = await Promise.all([
        listarUsuariosAction("LIDER"),
        obtenerAfiliadosAction(),
        obtenerLugaresAction(),
      ]);
      const allLideres = (lideresData || []) as Lider[];
      if (rol === "LIDER" && userId) {
        const myLider = allLideres.find((l) => l.id === userId);
        const otherLideres = allLideres.filter((l) => l.id !== userId);
        setLideres(myLider ? [myLider, ...otherLideres] : allLideres);
      } else {
        setLideres(allLideres);
      }
      setAfiliados((afiliadosData || []) as Afiliado[]);
      setLugares((lugaresData || []) as Lugar[]);
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
    await fetchData();
    if (liderParaCelula) {
      const updatedLider = lideres.find((l) => l.id === liderParaCelula.id);
      if (updatedLider) {
        setLiderParaCelula(updatedLider);
        setIsCelulaOpen(true);
      }
    }
  };

  if (loading || cargandoRol)
    return <div className="text-center py-10">Cargando...</div>;

  return (
    <>
      <div className="p-2 md:px-6 md:py-2">
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
              placeholder="Buscar por nombre o DPI..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto">
            <Button
              onClick={() => setIsEstadisticasOpen(true)}
              variant="outline"
              className="gap-2 w-full text-xl"
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
            ✅ Afiliados
          </button>
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
      </div>

      <Transition show={isEstadisticasOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsEstadisticasOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-hidden flex flex-col">
            <DialogPanel className="w-screen h-screen bg-white flex flex-col shadow-none max-w-none">
              <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0 gap-4 bg-white z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Estadísticas Generales 📊
                  </h3>
                  <p className="text-sm text-gray-500">
                    Análisis global de {afiliados.length} registros
                  </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto max-w-full scrollbar-hide">
                  {STATS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() =>
                        setVistaEstadisticaActual(tab.id as VistaEstadistica)
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${vistaEstadisticaActual === tab.id ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setIsEstadisticasOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-gray-100 shrink-0"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </Button>
              </div>
              <div className="flex-1 p-4 md:p-6 flex flex-col h-full overflow-hidden bg-gray-50/30">
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative p-4 md:p-6">
                  {vistaEstadisticaActual === "padron" && (
                    <EstadisticasEmpadronados afiliados={afiliados} />
                  )}
                  {vistaEstadisticaActual === "edades" && (
                    <EstadisticasEdades afiliados={afiliados} />
                  )}
                  {vistaEstadisticaActual === "lugares" && (
                    <EstadisticasLugares afiliados={afiliados} />
                  )}
                  {vistaEstadisticaActual === "politicas" && (
                    <EstadisticasPoliticas afiliados={afiliados} />
                  )}
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
        afiliados={afiliados}
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
