"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Search, X, Building2 } from "lucide-react";
import {
  PiCrownDuotone,
  PiUsersThreeDuotone,
  PiShieldCheckDuotone,
  PiChatCircleDotsDuotone,
  PiBriefcaseDuotone,
  PiBuildingsDuotone,
} from "react-icons/pi";

import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasEmpadronados from "./estadisticas/Empadronados";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";
import ConfiguracionSistema from "../dashboard/ConfiguracionSistema";

import Lideres from "./Lideres";
import AfiliadosGeneral from "./AfiliadosGeneral";
import MetaGeneral from "./MetaGeneral";
import Form from "./forms/afiliados/Afiliados";
import Celula from "./Celula";
import ModalBienvenida from "./ModalBienvenida";
import Difusion from "./Difusion";
import { SignupForm } from "@/components/admin/sign-up/SignForm";
import type { Afiliado, Lider } from "./esquemas";
import { esUsuarioSede } from "./esquemas";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";

import { LIDER_SIMULADO, AFILIADOS_SIMULADOS } from "./datosSimulados";
import { obtenerAfiliadosAction } from "./actions/afiliados";

type Lugar = { id: number; nombre: string };
type Tab =
  | "Sede"
  | "Lideres"
  | "Afiliados"
  | "Trabajadores"
  | "Administrativos"
  | "Mensajes";

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
  Sede: {
    activeText: "text-blue-700 dark:text-blue-400",
    activeBorder: "border-blue-300 dark:border-blue-700",
    activeIconBg: "bg-blue-100 dark:bg-blue-950/60",
    activeIconText: "text-blue-700 dark:text-blue-400",
  },
  Lideres: {
    activeText: "text-orange-600 dark:text-orange-400",
    activeBorder: "border-orange-300 dark:border-orange-700",
    activeIconBg: "bg-orange-100 dark:bg-orange-950/60",
    activeIconText: "text-orange-600 dark:text-orange-400",
  },
  Afiliados: {
    activeText: "text-sky-600 dark:text-sky-400",
    activeBorder: "border-sky-300 dark:border-sky-700",
    activeIconBg: "bg-sky-100 dark:bg-sky-950/60",
    activeIconText: "text-sky-600 dark:text-sky-400",
  },
  Trabajadores: {
    activeText: "text-violet-600 dark:text-violet-400",
    activeBorder: "border-violet-300 dark:border-violet-700",
    activeIconBg: "bg-violet-100 dark:bg-violet-950/60",
    activeIconText: "text-violet-600 dark:text-violet-400",
  },
  Administrativos: {
    activeText: "text-indigo-600 dark:text-indigo-400",
    activeBorder: "border-indigo-300 dark:border-indigo-700",
    activeIconBg: "bg-indigo-100 dark:bg-indigo-950/60",
    activeIconText: "text-indigo-600 dark:text-indigo-400",
  },
  Mensajes: {
    activeText: "text-green-600 dark:text-green-400",
    activeBorder: "border-green-300 dark:border-green-700",
    activeIconBg: "bg-green-100 dark:bg-green-950/60",
    activeIconText: "text-green-600 dark:text-green-400",
  },
};

const tabBtnClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `relative flex w-[9.5rem] md:w-52 shrink-0 flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2.5 text-[10px] md:text-sm font-semibold transition-colors rounded-t-lg -mb-px border-b-0 ${
    active
      ? `z-10 border-[3px] bg-white dark:bg-neutral-950 ${theme.activeBorder} ${theme.activeText}`
      : `z-0 border-[3px] border-transparent bg-white dark:bg-neutral-950 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-900`
  }`;
};

const tabIconClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `p-1 md:p-1.5 rounded-md transition-colors shrink-0 ${
    active
      ? `${theme.activeIconBg} ${theme.activeIconText}`
      : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
  }`;
};

export default function Ver() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Sede");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupFormKey, setSignupFormKey] = useState(0);
  const [modoCrearSede, setModoCrearSede] = useState(false);

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
  const rolUpper = (rol || "").toUpperCase();

  const puedeCrearLider =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER" ||
    rolUpper === "DOCUMENTADOR";
  const puedeSimular =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER" ||
    rolUpper === "DOCUMENTADOR";
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  /** Rol SEDE o perfil identificable como sede (nombre/usuario). */
  const esSedeSesion =
    rolUpper === "SEDE" ||
    (!!session &&
      esUsuarioSede({
        nombres: session.nombres,
        apellidos: session.apellidos,
        email: session.email,
        rol: session.rol,
      }));
  /** SUPER / ADMIN / SEDE ven pestañas; el resto solo meta + su célula. */
  const vistaConPestanas = esAdminOSuper || esSedeSesion;
  /** SEDE solo consulta: Sede, Líderes y Trabajadores (sin editar). */
  const soloLecturaSede = esSedeSesion;
  const esLider = rolUpper === "LIDER";

  const handleSimular = () => {
    setLiderSimulado((prev) => (prev ? null : LIDER_SIMULADO));
  };

  // TanStack Query para afiliados globales (se activa solo si es necesario)
  const { data: afiliados = [], isLoading: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled:
      isEstadisticasOpen ||
      (vistaConPestanas &&
        (activeTab === "Afiliados" ||
          activeTab === "Sede" ||
          !!liderParaCelula)) ||
      !vistaConPestanas,
  });

  // Derivar líderes, admins, lugares de la respuesta unificada
  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter(
    (u) =>
      (u.rol || "").toUpperCase() === "LIDER" ||
      (u.rol || "").toUpperCase() === "SEDE" ||
      esUsuarioSede(u),
  );
  const miPerfilDesdeLista = allUsers.find((l) => l.id === userId);
  /** Si la lista no trae el perfil (RLS / join), armarlo desde la sesión. */
  const miPerfilGlobal: Lider | null =
    miPerfilDesdeLista ||
    (userId && session
      ? {
          id: userId,
          email: session.email || "",
          nombres: session.nombres || "",
          apellidos: session.apellidos || "",
          rol: session.rol || (esSedeSesion ? "SEDE" : ""),
          conteoAfiliados: 0,
        }
      : null);
  const rolesAdmin =
    rol === "SUPER" ? ["ADMINISTRADOR", "SUPER"] : ["ADMINISTRADOR"];
  const administrativos = allUsers.filter((u) =>
    rolesAdmin.includes(u.rol || ""),
  );
  const trabajadores = allUsers.filter(
    (u) => (u.rol || "").toUpperCase() === "TRABAJADOR",
  );
  const totalAfiliadosTrabajadores = trabajadores.reduce(
    (acc, u) => acc + (u.conteoAfiliados || 0),
    0,
  );
  const sedeUsuario =
    allUsers.find((u) => esUsuarioSede(u)) ||
    (esSedeSesion && miPerfilGlobal ? miPerfilGlobal : null);
  const totalAfiliadosSede = sedeUsuario?.conteoAfiliados || 0;
  const totalAfiliadosLideres = allUsers
    .filter((u) => (u.rol || "").toUpperCase() === "LIDER")
    .reduce((acc, u) => acc + (u.conteoAfiliados || 0), 0);
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
    return base.filter(
      (l) => l.rol !== "DOCUMENTADOR" && !esUsuarioSede(l),
    );
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
    setModoCrearSede(false);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenCrearSedeModal = () => {
    setLiderAEditar(null);
    setModoCrearSede(true);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setModoCrearSede(false);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
    queryClient.invalidateQueries({ queryKey: ["lideres"] });
    queryClient.invalidateQueries({ queryKey: ["administrativos"] });
    fetchData();
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
  };

  const handleOpenAnadirAfiliadoModal = (
    liderId: string,
    isFirstMember = false,
  ) => {
    setAfiliadoParaEditar(null);
    setLiderParaNuevoAfiliado(liderId);
    setIsFirstMemberAddition(isFirstMember);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (afiliado: Afiliado) => {
    setAfiliadoParaEditar(afiliado);
    setLiderParaNuevoAfiliado(null);
    setIsFirstMemberAddition(false);
    setIsFormOpen(true);
  };

  const handleOpenCelula = (lider: Lider) => {
    if (!lider) return;
    setLiderParaCelula(lider);
  };

  const handleVolverDeCelula = () => {
    setLiderParaCelula(null);
  };

  const cambiarTab = (tab: Tab) => {
    if (
      soloLecturaSede &&
      (tab === "Mensajes" || tab === "Administrativos")
    ) {
      return;
    }
    setActiveTab(tab);
    setLiderParaCelula(null);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
  };

  const handleSaveAndCloseForm = async () => {
    setIsFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });

    await fetchData();

    if (esLider) return;

    if (liderParaCelula) {
      const updatedLider = allUsers.find((l) => l.id === liderParaCelula.id);
      if (updatedLider) setLiderParaCelula(updatedLider);
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
          {vistaConPestanas && (
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
            {vistaConPestanas && (
              <Button
                onClick={() => setIsEstadisticasOpen(true)}
                variant="outline"
                className="gap-2 w-full text-xs md:text-xl"
              >
                📊 Estadísticas Generales
              </Button>
            )}
            {puedeCrearLider && vistaConPestanas && (
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
        ) : !vistaConPestanas ? (
          <>
            <MetaGeneral
              totalSede={totalAfiliadosSede}
              totalLideres={totalAfiliadosLideres}
              totalTrabajadores={totalAfiliadosTrabajadores}
            />
            {miPerfilGlobal ? (
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
                No se encontró tu perfil de usuario.
              </div>
            )}
          </>
        ) : (
          <>
            <MetaGeneral
              totalSede={totalAfiliadosSede}
              totalLideres={totalAfiliadosLideres}
              totalTrabajadores={totalAfiliadosTrabajadores}
            />
            <div className="flex items-end gap-0.5 overflow-x-auto border-b-2 border-gray-200 dark:border-neutral-700 mb-6 w-full min-w-0 bg-white dark:bg-neutral-950 pb-0">
              <button
                onClick={() => cambiarTab("Sede")}
                className={tabBtnClass(activeTab === "Sede", "Sede")}
              >
                <span className={tabIconClass(activeTab === "Sede", "Sede")}>
                  <PiBuildingsDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </span>
                <span className="truncate max-w-full">Sede</span>
              </button>
              <button
                onClick={() => cambiarTab("Lideres")}
                className={tabBtnClass(activeTab === "Lideres", "Lideres")}
              >
                <span
                  className={tabIconClass(activeTab === "Lideres", "Lideres")}
                >
                  <PiCrownDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </span>
                <span className="truncate max-w-full">Líderes</span>
              </button>
              <button
                onClick={() => cambiarTab("Trabajadores")}
                className={tabBtnClass(
                  activeTab === "Trabajadores",
                  "Trabajadores",
                )}
              >
                <span
                  className={tabIconClass(
                    activeTab === "Trabajadores",
                    "Trabajadores",
                  )}
                >
                  <PiBriefcaseDuotone className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </span>
                <span className="truncate max-w-full">Trabajadores</span>
              </button>
              <button
                onClick={() => cambiarTab("Afiliados")}
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
                <span className="truncate max-w-full">Miembros</span>
              </button>
              {esAdminOSuper && (
                <button
                  onClick={() => cambiarTab("Mensajes")}
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
                  <span className="truncate max-w-full">Mensajes</span>
                </button>
              )}
              {esAdminOSuper && (
                <button
                  onClick={() => cambiarTab("Administrativos")}
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
                  <span className="truncate max-w-full">Administrativos</span>
                </button>
              )}
            </div>

            {liderParaCelula && activeTab !== "Sede" ? (
              <Celula
                embedded
                isOpen
                onClose={handleVolverDeCelula}
                onBack={handleVolverDeCelula}
                lider={liderParaCelula}
                onEditar={handleOpenEditModal}
                onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                onDataChange={fetchData}
                rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                afiliadosSimulados={AFILIADOS_SIMULADOS}
              />
            ) : (
              <>
                {activeTab === "Sede" &&
                  (sedeUsuario ? (
                    <Celula
                      embedded
                      isOpen
                      onClose={() => {}}
                      lider={sedeUsuario}
                      onEditar={handleOpenEditModal}
                      onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                      onDataChange={fetchData}
                      rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                    />
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-blue-400/70 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/20 px-4 py-6">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-blue-900 dark:text-blue-200">
                            Aún no existe el usuario Sede
                          </p>
                          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                            Créalo para afiliar desde sede y diferenciarlo del
                            avance de los líderes.
                          </p>
                        </div>
                      </div>
                      {esAdminOSuper && (
                        <Button
                          type="button"
                          onClick={handleOpenCrearSedeModal}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Crear Sede
                        </Button>
                      )}
                    </div>
                  ))}

                {activeTab === "Lideres" && (
                  <Lideres
                    lideres={lideresVisibles}
                    onVerCelula={handleOpenCelula}
                    onEditar={handleOpenEditLiderModal}
                    rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                    onDataChange={fetchData}
                    searchTerm={searchTerm}
                    idUsuarioSesion={userId}
                    isLoading={cargandoLideres}
                  />
                )}
                {activeTab === "Afiliados" && (
                  <AfiliadosGeneral
                    afiliados={afiliados}
                    lideres={allUsers}
                    onEditar={handleOpenEditModal}
                    onDataChange={fetchData}
                    searchTerm={searchTerm}
                    isLoading={cargandoMiembros}
                  />
                )}
                {activeTab === "Trabajadores" && (
                  <Lideres
                    lideres={trabajadores}
                    onVerCelula={handleOpenCelula}
                    onEditar={handleOpenEditLiderModal}
                    rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                    onDataChange={fetchData}
                    searchTerm={searchTerm}
                    idUsuarioSesion={userId}
                    isLoading={cargandoLideres}
                    showRole={true}
                  />
                )}
                {activeTab === "Administrativos" && (
                  <Lideres
                    lideres={administrativos}
                    onVerCelula={handleOpenCelula}
                    onEditar={handleOpenEditLiderModal}
                    rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                    onDataChange={fetchData}
                    searchTerm={searchTerm}
                    idUsuarioSesion={userId}
                    isLoading={cargandoLideres}
                    showRole={true}
                  />
                )}
                {activeTab === "Mensajes" && esAdminOSuper && (
                  <Difusion usuarios={allUsers} />
                )}
              </>
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
                  modoCrearSede={modoCrearSede}
                />
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
