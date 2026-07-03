"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Search, X } from "lucide-react";
import {
  PiCrownDuotone,
  PiUsersThreeDuotone,
  PiShieldCheckDuotone,
  PiChatCircleDotsDuotone,
} from "react-icons/pi";

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
import ModalBienvenida from "./ModalBienvenida";
import Difusion from "./Difusion";
import { SignupForm } from "@/components/admin/sign-up/SignForm";
import type { Afiliado, Lider } from "./esquemas";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";

import { LIDER_SIMULADO, AFILIADOS_SIMULADOS } from "./datosSimulados";
import { obtenerAfiliadosAction } from "./actions/afiliados";

type Lugar = { id: number; nombre: string };
type Tab = "Lideres" | "Afiliados" | "Administrativos" | "Mensajes";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const TAB_THEMES: Record<
  Tab,
  {
    activeText: string;
    activeBorder: string;
    activeIconBg: string;
    activeIconText: string;
  }
> = {
  Lideres: {
    activeText: "text-orange-600 dark:text-orange-400",
    activeBorder: "border-orange-500 dark:border-orange-400",
    activeIconBg: "bg-orange-100 dark:bg-orange-950/60",
    activeIconText: "text-orange-600 dark:text-orange-400",
  },
  Afiliados: {
    activeText: "text-purple-600 dark:text-purple-400",
    activeBorder: "border-purple-500 dark:border-purple-400",
    activeIconBg: "bg-purple-100 dark:bg-purple-950/60",
    activeIconText: "text-purple-600 dark:text-purple-400",
  },
  Administrativos: {
    activeText: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-600 dark:border-blue-400",
    activeIconBg: "bg-blue-100 dark:bg-blue-950/60",
    activeIconText: "text-blue-600 dark:text-blue-400",
  },
  Mensajes: {
    activeText: "text-green-600 dark:text-green-400",
    activeBorder: "border-green-500 dark:border-green-400",
    activeIconBg: "bg-green-100 dark:bg-green-950/60",
    activeIconText: "text-green-600 dark:text-green-400",
  },
};

const tabBtnClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `flex flex-1 flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-[10px] md:text-base font-semibold min-w-0 transition-colors border-b-2 ${
    active
      ? `${theme.activeBorder} ${theme.activeText}`
      : "border-transparent text-gray-500 dark:text-gray-400"
  }`;
};

const tabIconClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `p-1.5 rounded-lg transition-colors shrink-0 ${
    active
      ? `${theme.activeIconBg} ${theme.activeIconText}`
      : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
  }`;
};

export default function Ver() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Lideres");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCelulaOpen, setIsCelulaOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupFormKey, setSignupFormKey] = useState(0);

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
  const [liderSimulado, setLiderSimulado] = useState<Lider | null>(null);

  // =====================================================
  // UN SOLO fetch que trae TODO: sesión + usuarios + lugares
  // Usa API Route (JSON puro) en vez de Server Action (RSC lento)
  // =====================================================
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      console.time("⏱️ fetch /api/dashboard");
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      console.timeEnd("⏱️ fetch /api/dashboard");
      if (!res.ok || data.error) {
        toast.error(data.error || "Error al cargar datos");
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const session = dashboardData?.session;
  const rol = session?.rol || "";
  const userId = session?.id || "";

  const puedeCrearLider =
    rol === "ADMINISTRADOR" || rol === "SUPER" || rol === "DOCUMENTADOR";
  const puedeSimular =
    rol === "ADMINISTRADOR" || rol === "SUPER" || rol === "DOCUMENTADOR";
  const esAdminOSuper = rol === "ADMINISTRADOR" || rol === "SUPER";
  const esLider = rol === "LIDER";
  const vistaCompleta = esAdminOSuper || rol === "DOCUMENTADOR";

  const handleSimular = () => {
    setLiderSimulado((prev) => (prev ? null : LIDER_SIMULADO));
  };

  // TanStack Query para afiliados globales (se activa solo si es necesario)
  const { data: afiliados = [], isLoading: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled:
      isEstadisticasOpen ||
      activeTab === "Afiliados" ||
      isCelulaOpen ||
      esLider,
  });

  // Derivar líderes, admins, lugares de la respuesta unificada
  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter((u) => u.rol === "LIDER");
  const miPerfilGlobal = allUsers.find((l) => l.id === userId);
  const rolesAdmin =
    rol === "SUPER" ? ["ADMINISTRADOR", "SUPER"] : ["ADMINISTRADOR"];
  const administrativos = allUsers.filter((u) =>
    rolesAdmin.includes(u.rol || ""),
  );
  const lugares = (dashboardData?.lugares || []) as Lugar[];

  const lideres = (() => {
    if (rol === "LIDER" && userId) {
      const myLider = allLideres.find((l) => l.id === userId);
      const otherLideres = allLideres.filter((l) => l.id !== userId);
      return myLider ? [myLider, ...otherLideres] : allLideres;
    }
    return allLideres;
  })();

  const lideresVisibles = (() => {
    const base = liderSimulado ? [liderSimulado, ...lideres] : lideres;
    return base.filter((l) => l.rol !== "DOCUMENTADOR");
  })();

  const cargandoLideres = isDashboardLoading;
  const cargandoMiembros = isLoadingAfiliados || cargandoLideres;

  const fetchData = async () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
  };

  const handleOpenCreateLiderModal = () => {
    setLiderAEditar(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setSignupFormKey((k) => k + 1);
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
    if (!esLider) setIsCelulaOpen(false);
    setAfiliadoParaEditar(null);
    setLiderParaNuevoAfiliado(liderId);
    setIsFirstMemberAddition(isFirstMember);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (afiliado: Afiliado) => {
    if (!esLider) setIsCelulaOpen(false);
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

    if (esLider) return;

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
      {!isDashboardLoading && userId && (
        <ModalBienvenida
          userId={userId}
          conteoAfiliados={miPerfilGlobal?.conteoAfiliados || 0}
          nombreLider={miPerfilGlobal?.nombres || "Usuario"}
        />
      )}
      <div className="px-2 md:px-6 max-w-full overflow-x-hidden min-w-0 w-full">
        <ConfiguracionSistema />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 min-w-0">
          <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
            <div className={`relative min-w-0 ${puedeSimular ? "group" : ""}`}>
              <h1
                className={`text-lg font-bold text-black dark:text-white md:text-3xl truncate md:whitespace-nowrap ${
                  puedeSimular
                    ? "cursor-pointer underline decoration-transparent underline-offset-[6px] decoration-2 transition-[text-decoration-color] duration-300 ease-in-out group-hover:decoration-black dark:group-hover:decoration-white"
                    : ""
                }`}
                onClick={puedeSimular ? handleSimular : undefined}
              >
                Gestión de Datos 📊
              </h1>
              {puedeSimular && (
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 scale-95 whitespace-nowrap rounded-md bg-gray-900/95 dark:bg-gray-100 dark:text-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg translate-y-1 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                  Click para simular un registro
                </span>
              )}
            </div>
          </div>
          {vistaCompleta && (
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre"
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto">
            {!esLider && (
              <Button
                onClick={() => setIsEstadisticasOpen(true)}
                variant="outline"
                className="gap-2 w-full text-xs md:text-xl"
              >
                📊 Estadísticas Generales
              </Button>
            )}
            {puedeCrearLider && (
              <Button
                onClick={handleOpenCreateLiderModal}
                className="gap-2 w-full text-sm md:text-xl"
              >
                Nuevo Líder
              </Button>
            )}
          </div>
        </div>

        {isDashboardLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
            <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-gray-100 dark:bg-neutral-800 rounded-lg"
                />
              ))}
            </div>
          </div>
        ) : esLider ? (
          miPerfilGlobal ? (
            <Celula
              embedded
              isOpen
              onClose={() => {}}
              lider={miPerfilGlobal}
              onEditar={handleOpenEditModal}
              onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
              onDataChange={fetchData}
              rolUsuarioSesion={rol}
            />
          ) : (
            <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">
              No se encontró tu perfil de líder.
            </div>
          )
        ) : (
          <>
            <div className="flex border-b dark:border-neutral-800 mb-6 w-full min-w-0">
              <button
                onClick={() => setActiveTab("Lideres")}
                className={tabBtnClass(activeTab === "Lideres", "Lideres")}
              >
                <span
                  className={tabIconClass(activeTab === "Lideres", "Lideres")}
                >
                  <PiCrownDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </span>
                <span className="truncate">Líderes</span>
              </button>
              <button
                onClick={() => setActiveTab("Afiliados")}
                className={tabBtnClass(activeTab === "Afiliados", "Afiliados")}
              >
                <span
                  className={tabIconClass(
                    activeTab === "Afiliados",
                    "Afiliados",
                  )}
                >
                  <PiUsersThreeDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </span>
                <span className="truncate">Miembros</span>
              </button>
              {esAdminOSuper && (
                <button
                  onClick={() => setActiveTab("Administrativos")}
                  className={tabBtnClass(
                    activeTab === "Administrativos",
                    "Administrativos",
                  )}
                >
                  <span
                    className={tabIconClass(
                      activeTab === "Administrativos",
                      "Administrativos",
                    )}
                  >
                    <PiShieldCheckDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  </span>
                  <span className="truncate">Administrativos</span>
                </button>
              )}
              {esAdminOSuper && (
                <button
                  onClick={() => setActiveTab("Mensajes")}
                  className={tabBtnClass(activeTab === "Mensajes", "Mensajes")}
                >
                  <span
                    className={tabIconClass(
                      activeTab === "Mensajes",
                      "Mensajes",
                    )}
                  >
                    <PiChatCircleDotsDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  </span>
                  <span className="truncate">Mensajes</span>
                </button>
              )}
            </div>

            {activeTab === "Lideres" && (
              <Lideres
                lideres={lideresVisibles}
                onVerCelula={handleOpenCelulaModal}
                onEditar={handleOpenEditLiderModal}
                rolUsuarioSesion={rol}
                onDataChange={fetchData}
                searchTerm={searchTerm}
                idUsuarioSesion={userId}
                isLoading={cargandoLideres}
              />
            )}
            {activeTab === "Afiliados" && (
              <AfiliadosGeneral
                afiliados={afiliados}
                lideres={lideres}
                onEditar={handleOpenEditModal}
                onDataChange={fetchData}
                searchTerm={searchTerm}
                isLoading={cargandoMiembros}
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
                isLoading={cargandoLideres}
                hideMeta
                showRole={true}
              />
            )}
            {activeTab === "Mensajes" && esAdminOSuper && (
              <Difusion usuarios={allUsers} />
            )}
          </>
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
            <DialogPanel className="w-screen h-screen bg-white dark:bg-neutral-900 flex flex-col">
              <div className="flex justify-between items-center px-6 py-3 border-b dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900 z-10">
                <div className="flex flex-col">
                  <h3 className="text-base md:text-xl font-bold uppercase leading-none text-gray-900 dark:text-gray-100">
                    Estadísticas Generales 📊
                  </h3>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-1">
                    Análisis global de {afiliados.length} registros
                  </p>
                </div>

                <Button
                  onClick={() => setIsEstadisticasOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0 h-8 w-8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-neutral-950 py-4 md:p-8">
                <div className="max-w-[1600px] mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full pt-4">
                    <div className="bg-white dark:bg-neutral-900 flex flex-col min-h-[450px] rounded-lg border dark:border-neutral-800">
                      <EstadisticasEdades afiliados={afiliados} />
                    </div>

                    <div className="bg-white dark:bg-neutral-900 flex flex-col min-h-[450px] rounded-lg border dark:border-neutral-800">
                      <EstadisticasEmpadronados afiliados={afiliados} />
                    </div>

                    <div className="bg-white dark:bg-neutral-900 flex flex-col min-h-[450px] rounded-lg border dark:border-neutral-800">
                      <EstadisticasReligiones afiliados={afiliados} />
                    </div>

                    <div className="bg-white dark:bg-neutral-900 flex flex-col min-h-[450px] rounded-lg border dark:border-neutral-800">
                      <EstadisticasPoliticas afiliados={afiliados} />
                    </div>

                    <div className="bg-white dark:bg-neutral-900 flex flex-col min-h-[450px] md:col-span-2 rounded-lg border dark:border-neutral-800">
                      <EstadisticasLugares afiliados={afiliados} />
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      {!esLider && (
        <Celula
          isOpen={isCelulaOpen}
          onClose={handleCloseCelulaModal}
          lider={liderParaCelula}
          onEditar={handleOpenEditModal}
          onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
          onDataChange={fetchData}
          rolUsuarioSesion={rol ?? ""}
          afiliadosSimulados={AFILIADOS_SIMULADOS}
        />
      )}

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
              <DialogPanel className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all p-4 md:p-8">
                <SignupForm
                  key={signupFormKey}
                  initialData={liderAEditar}
                  onSuccess={handleSignupSuccess}
                  onClose={handleCloseSignupModal}
                  isModal={true}
                  rolSesion={rol}
                />
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
