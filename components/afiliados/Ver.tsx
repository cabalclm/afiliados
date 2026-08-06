"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Building2, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PiBriefcaseDuotone,
  PiBuildingsDuotone,
  PiCodeDuotone,
  PiMedalDuotone,
  PiShieldCheckDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";

import ConfiguracionSistema from "../dashboard/ConfiguracionSistema";
import EstadisticasEdades from "./estadisticas/Edades";
import EstadisticasLugares from "./estadisticas/Lugares";
import EstadisticasPoliticas from "./estadisticas/Politicas";
import EstadisticasReligiones from "./estadisticas/Religion";

import { SignupForm } from "@/components/admin/sign-up/SignForm";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import AfiliadosGeneral from "./AfiliadosGeneral";
import Celula from "./Celula";
import Difusion from "./Difusion";
import Lideres from "./Lideres";
import MetaGeneral from "./MetaGeneral";
import ModalBienvenida from "./ModalBienvenida";
import type { Afiliado, Lider } from "./esquemas";
import { esRolEmpleado, esRolLider, esUsuarioSede } from "./esquemas";
import Form from "./forms/afiliados/Afiliados";
import PanelListaPestana from "./PanelListaPestana";
import {
  TEMA_ADMIN,
  TEMA_EMPLEADOS,
  TEMA_LIDERES,
  TEMA_MIEMBROS,
  TEMA_MENSAJES,
  TEMA_SEDE,
} from "./temaPestana";

import { obtenerAfiliadosAction } from "./actions/afiliados";
import { AFILIADOS_SIMULADOS, LIDER_SIMULADO } from "./datosSimulados";

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
    activeIconBg: string;
    activeIconText: string;
    activeBadgeBg: string;
    activeBadgeText: string;
    lineBg: string;
  }
> = {
  Sede: {
    activeText: "text-blue-600 dark:text-blue-400",
    activeIconBg: "bg-blue-100 dark:bg-blue-950/60",
    activeIconText: "text-blue-600 dark:text-blue-400",
    activeBadgeBg: "bg-blue-100 dark:bg-blue-950/60",
    activeBadgeText: "text-blue-700 dark:text-blue-300",
    lineBg: "bg-blue-500 dark:bg-blue-400",
  },
  Lideres: {
    activeText: "text-orange-600 dark:text-orange-400",
    activeIconBg: "bg-orange-100 dark:bg-orange-950/60",
    activeIconText: "text-orange-600 dark:text-orange-400",
    activeBadgeBg: "bg-orange-100 dark:bg-orange-950/60",
    activeBadgeText: "text-orange-700 dark:text-orange-300",
    lineBg: "bg-orange-500 dark:bg-orange-400",
  },
  Afiliados: {
    activeText: "text-sky-600 dark:text-sky-400",
    activeIconBg: "bg-sky-100 dark:bg-sky-950/60",
    activeIconText: "text-sky-600 dark:text-sky-400",
    activeBadgeBg: "bg-sky-100 dark:bg-sky-950/60",
    activeBadgeText: "text-sky-700 dark:text-sky-300",
    lineBg: "bg-sky-500 dark:bg-sky-400",
  },
  Trabajadores: {
    activeText: "text-violet-600 dark:text-violet-400",
    activeIconBg: "bg-violet-100 dark:bg-violet-950/60",
    activeIconText: "text-violet-600 dark:text-violet-400",
    activeBadgeBg: "bg-violet-100 dark:bg-violet-950/60",
    activeBadgeText: "text-violet-700 dark:text-violet-300",
    lineBg: "bg-violet-500 dark:bg-violet-400",
  },
  Administrativos: {
    activeText: "text-indigo-600 dark:text-indigo-400",
    activeIconBg: "bg-indigo-100 dark:bg-indigo-950/60",
    activeIconText: "text-indigo-600 dark:text-indigo-400",
    activeBadgeBg: "bg-indigo-100 dark:bg-indigo-950/60",
    activeBadgeText: "text-indigo-700 dark:text-indigo-300",
    lineBg: "bg-indigo-500 dark:bg-indigo-400",
  },
  Mensajes: {
    activeText: "text-green-600 dark:text-green-400",
    activeIconBg: "bg-green-100 dark:bg-green-950/60",
    activeIconText: "text-green-600 dark:text-green-400",
    activeBadgeBg: "bg-green-100 dark:bg-green-950/60",
    activeBadgeText: "text-green-700 dark:text-green-300",
    lineBg: "bg-green-500 dark:bg-green-400",
  },
};

const tabEase = [0.25, 0.46, 0.45, 0.94] as const;

const TAB_ORDER: Tab[] = [
  "Sede",
  "Lideres",
  "Trabajadores",
  "Afiliados",
  "Administrativos",
  "Mensajes",
];

const tabBtnClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `relative flex w-full md:w-auto md:shrink-0 flex-row items-center justify-center px-1.5 sm:px-2 py-3 md:py-3 text-base md:text-lg font-semibold transition-colors duration-300 ${
    active
      ? theme.activeText
      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
  }`;
};

const tabPillClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `relative inline-flex w-full max-w-full items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 px-2 sm:px-3 md:px-3.5 py-2.5 md:py-2 rounded-lg transition-colors duration-300 ${
    active
      ? `${theme.activeIconBg} ${theme.activeText}`
      : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
  }`;
};

const tabIconClass = () => "shrink-0 flex items-center justify-center";

const tabBadgeClass = () =>
  "inline-flex items-center justify-center min-w-[1.375rem] md:min-w-[1.625rem] font-bold leading-none shrink-0";

const OBJETIVO_LIDERES = 200;

type RolNuevo = "LIDER" | "EMPLEADO" | "ADMINISTRADOR" | "SUPER";

function BtnNuevoTab({
  label,
  icon,
  onClick,
  className,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-lg border px-3.5 md:px-5 text-base md:text-lg font-semibold whitespace-nowrap transition-colors ${className}`}
    >
      <span className="shrink-0 [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-5 md:[&>svg]:h-5">
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function Ver() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Sede");
  const [tabSlideDir, setTabSlideDir] = useState(1);
  const prevTabRef = useRef<Tab>("Sede");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupFormKey, setSignupFormKey] = useState(0);
  const [modoCrearSede, setModoCrearSede] = useState(false);
  const [rolNuevoUsuario, setRolNuevoUsuario] = useState<RolNuevo | null>(null);

  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(
    null,
  );
  const [liderAEditar, setLiderAEditar] = useState<Lider | null>(null);
  const [liderParaCelula, setLiderParaCelula] = useState<Lider | null>(null);
  const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<
    string | null
  >(null);

  const [isFirstMemberAddition, setIsFirstMemberAddition] = useState(false);
  const [busquedaPorTab, setBusquedaPorTab] = useState<
    Partial<Record<Tab, string>>
  >({});
  const [liderSimulado, setLiderSimulado] = useState<Lider | null>(null);

  const busquedaTab = (tab: Tab) => busquedaPorTab[tab] ?? "";
  const setBusquedaTab = (tab: Tab, value: string) => {
    setBusquedaPorTab((prev) => ({ ...prev, [tab]: value }));
  };

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
  /** SEDE puede crear líderes y empleados; el resto de gestión sigue restringido. */
  const puedeCrearLiderOEmpleado = puedeCrearLider || esSedeSesion;
  /** SUPER / ADMIN / SEDE ven pestañas; el resto solo meta + su célula. */
  const vistaConPestanas = esAdminOSuper || esSedeSesion;
  /** Aviso de líderes faltantes para la meta: solo admin, super y sede. */
  const puedeVerAvisoMetaEquipo =
    (esAdminOSuper || esSedeSesion) &&
    !esRolLider(rol) &&
    !esRolEmpleado(rol);
  /** SEDE: sin Administrativos ni Mensajes; puede crear líderes/empleados. */
  const soloLecturaSede = esSedeSesion;
  const esLider = rolUpper === "LIDER";

  const handleSimular = () => {
    setLiderSimulado((prev) => (prev ? null : LIDER_SIMULADO));
  };

  // TanStack Query para afiliados globales (se activa solo si es necesario)
  const { data: afiliados = [], isLoading: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled: isEstadisticasOpen || vistaConPestanas || !vistaConPestanas,
  });

  // Derivar líderes, admins, lugares de la respuesta unificada
  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter(
    (u) =>
      esRolLider(u.rol) ||
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
  const rolesAdminVisibles =
    rolUpper === "SUPER"
      ? ["ADMIN", "ADMINISTRADOR", "SUPER"]
      : ["ADMIN", "ADMINISTRADOR"];
  const administrativos = allUsers.filter((u) =>
    rolesAdminVisibles.includes((u.rol || "").toUpperCase()),
  );
  const trabajadores = allUsers.filter((u) => esRolEmpleado(u.rol));
  const sedeUsuario =
    allUsers.find((u) => esUsuarioSede(u)) ||
    (esSedeSesion && miPerfilGlobal ? miPerfilGlobal : null);

  const totalesMeta = useMemo(() => {
    const idsEmpleado = new Set(
      allUsers.filter((u) => esRolEmpleado(u.rol)).map((u) => u.id),
    );
    const idsLider = new Set(
      allUsers.filter((u) => esRolLider(u.rol)).map((u) => u.id),
    );
    const sedeId = sedeUsuario?.id;
    const conLider = afiliados.filter((a) => a.lider_id);

    if (conLider.length > 0) {
      let sede = 0;
      let lideres = 0;
      let trabajadoresCount = 0;

      for (const a of conLider) {
        const lid = a.lider_id!;
        const responsable = allUsers.find((u) => u.id === lid);

        if (
          (sedeId && lid === sedeId) ||
          (responsable && esUsuarioSede(responsable))
        ) {
          sede++;
        } else if (idsEmpleado.has(lid)) {
          trabajadoresCount++;
        } else {
          lideres++;
        }
      }

      return {
        sede,
        lideres,
        trabajadores: trabajadoresCount,
        total: sede + lideres + trabajadoresCount,
      };
    }

    const sede = sedeUsuario?.conteoAfiliados || 0;
    const lideres = allUsers
      .filter((u) => idsLider.has(u.id))
      .reduce((acc, u) => acc + (u.conteoAfiliados || 0), 0);
    const trabajadoresCount = allUsers
      .filter((u) => idsEmpleado.has(u.id))
      .reduce((acc, u) => acc + (u.conteoAfiliados || 0), 0);

    return {
      sede,
      lideres,
      trabajadores: trabajadoresCount,
      total: sede + lideres + trabajadoresCount,
    };
  }, [afiliados, allUsers, sedeUsuario]);

  const totalAfiliadosSede = totalesMeta.sede;
  const totalAfiliadosLideres = totalesMeta.lideres;
  const totalAfiliadosTrabajadores = totalesMeta.trabajadores;
  const totalMiembrosGeneral = totalesMeta.total;
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
    return base.filter((l) => l.rol !== "DOCUMENTADOR" && !esUsuarioSede(l));
  })();

  /** Líderes y empleados pueden tener célula (afiliados bajo su user_id). */
  const usuariosConCelula = allUsers.filter((u) => {
    const r = (u.rol || "").toUpperCase();
    return (
      r === "LIDER" ||
      r === "EMPLEADO" ||
      r === "TRABAJADOR" ||
      r === "SEDE" ||
      esUsuarioSede(u)
    );
  });

  const resolverUsuarioCelula = (
    id: string | null | undefined,
  ): Lider | null => {
    if (!id) return null;
    return (
      allUsers.find((l) => l.id === id) ??
      (miPerfilGlobal?.id === id ? miPerfilGlobal : null)
    );
  };

  const totalLideresRegistrados = allUsers.filter((u) =>
    esRolLider(u.rol),
  ).length;
  const totalEmpleadosRegistrados = trabajadores.length;
  const totalAdministrativosRegistrados = administrativos.length;

  const cambiarTab = (tab: Tab) => {
    if (soloLecturaSede && (tab === "Mensajes" || tab === "Administrativos")) {
      return;
    }
    const prev = prevTabRef.current;
    const prevIdx = TAB_ORDER.indexOf(prev);
    const nextIdx = TAB_ORDER.indexOf(tab);
    setTabSlideDir(nextIdx >= prevIdx ? 1 : -1);
    prevTabRef.current = tab;
    setActiveTab(tab);
    setLiderParaCelula(null);
  };

  const cargandoLideres = isDashboardLoading;
  const cargandoMiembros = isLoadingAfiliados || cargandoLideres;

  const fetchData = async () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
  };

  const abrirNuevoUsuario = (rol: RolNuevo) => {
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolNuevoUsuario(rol);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenCrearSedeModal = () => {
    setLiderAEditar(null);
    setModoCrearSede(true);
    setRolNuevoUsuario(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setModoCrearSede(false);
    setRolNuevoUsuario(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolNuevoUsuario(null);
    queryClient.invalidateQueries({ queryKey: ["lideres"] });
    queryClient.invalidateQueries({ queryKey: ["administrativos"] });
    fetchData();
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolNuevoUsuario(null);
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

  const lideresFaltantes = Math.max(
    0,
    OBJETIVO_LIDERES - totalLideresRegistrados,
  );

  const placeholdersTab: Record<Tab, string> = {
    Sede: "Buscar por nombre o DPI...",
    Lideres: "Buscar por nombre",
    Trabajadores: "Buscar por nombre",
    Afiliados: "Buscar por nombre o DPI",
    Administrativos: "Buscar por nombre",
    Mensajes: "Buscar por nombre",
  };

  const getTemaTab = (tab: Tab) => {
    switch (tab) {
      case "Sede":
        return TEMA_SEDE;
      case "Lideres":
        return TEMA_LIDERES;
      case "Trabajadores":
        return TEMA_EMPLEADOS;
      case "Afiliados":
        return TEMA_MIEMBROS;
      case "Administrativos":
        return TEMA_ADMIN;
      case "Mensajes":
        return TEMA_MENSAJES;
      default:
        return TEMA_LIDERES;
    }
  };

  const getAccionesTab = (tab: Tab): ReactNode => {
    if (tab === "Lideres" && puedeCrearLiderOEmpleado) {
      return (
        <BtnNuevoTab
          label="Nuevo Líder"
          icon={<PiMedalDuotone />}
          onClick={() => abrirNuevoUsuario("LIDER")}
          className="border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-500 dark:bg-orange-950/50 dark:text-orange-400 dark:hover:bg-orange-950/70"
        />
      );
    }

    if (tab === "Trabajadores" && puedeCrearLiderOEmpleado) {
      return (
        <BtnNuevoTab
          label="Nuevo Empleado"
          icon={<PiBriefcaseDuotone />}
          onClick={() => abrirNuevoUsuario("EMPLEADO")}
          className="border-violet-500 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:border-violet-500 dark:bg-violet-950/50 dark:text-violet-400 dark:hover:bg-violet-950/70"
        />
      );
    }

    if (tab === "Administrativos" && esAdminOSuper) {
      return (
        <>
          <BtnNuevoTab
            label="Nuevo Admin"
            icon={<PiShieldCheckDuotone />}
            onClick={() => abrirNuevoUsuario("ADMINISTRADOR")}
            className="border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70"
          />
          {rolUpper === "SUPER" && (
            <BtnNuevoTab
              label="Nuevo Super"
              icon={<PiCodeDuotone />}
              onClick={() => abrirNuevoUsuario("SUPER")}
              className="border-green-500 bg-green-50 text-green-600 hover:bg-green-100 dark:border-green-500 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-950/70"
            />
          )}
        </>
      );
    }

    if (
      tab === "Sede" &&
      esAdminOSuper &&
      !sedeUsuario &&
      activeTab === "Sede"
    ) {
      return (
        <BtnNuevoTab
          label="Crear Sede"
          icon={<Building2 />}
          onClick={handleOpenCrearSedeModal}
          className="border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70"
        />
      );
    }

    return null;
  };

  const renderPanelTab = (tab: Tab, children: ReactNode) => (
    <PanelListaPestana
      tema={getTemaTab(tab)}
      placeholder={placeholdersTab[tab]}
      value={busquedaTab(tab)}
      onChange={(v) => setBusquedaTab(tab, v)}
      acciones={getAccionesTab(tab)}
    >
      {children}
    </PanelListaPestana>
  );

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

        <div className="mb-4 space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 w-full md:justify-between">
            <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1">
              <div
                className={`min-w-0 flex-1 ${puedeSimular ? "group relative" : ""}`}
              >
                <h1
                  className={`text-xl sm:text-2xl md:text-2xl font-black text-gray-900 dark:text-white ${
                    puedeSimular
                      ? "cursor-pointer underline decoration-transparent underline-offset-4 decoration-2 transition-[text-decoration-color] duration-300 group-hover:decoration-gray-900 dark:group-hover:decoration-white"
                      : ""
                  }`}
                  onClick={puedeSimular ? handleSimular : undefined}
                >
                  Gestión de Datos
                </h1>
                {puedeSimular && (
                  <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 scale-95 whitespace-nowrap rounded-md bg-gray-900/95 dark:bg-gray-100 dark:text-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg translate-y-1 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0">
                    Click para simular un registro
                  </span>
                )}
              </div>
            </div>

            {vistaConPestanas && (
              <button
                type="button"
                onClick={() => setIsEstadisticasOpen(true)}
                className="inline-flex h-11 md:h-12 w-full sm:w-auto sm:min-w-[11.5rem] items-center justify-center gap-2 rounded-lg border border-blue-400 bg-blue-50 px-3 md:px-3 text-base md:text-lg font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/70 shrink-0 md:ml-auto"
              >
                <BarChart3 className="w-5 h-5 shrink-0" />
                <span className="truncate">Estadísticas</span>
              </button>
            )}
          </div>

          {puedeVerAvisoMetaEquipo && (
            <p className="text-center text-sm sm:text-base font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 px-1 leading-snug">
              Se requieren {lideresFaltantes.toLocaleString()} líderes/empleados
              para la meta
            </p>
          )}
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
            <div className="mb-6 w-full min-w-0 border-b border-gray-200 dark:border-neutral-800">
              <div
                className={`w-full min-w-0 gap-1 sm:gap-0 grid grid-cols-2 md:flex md:flex-nowrap md:overflow-x-auto`}
              >
                {(
                  [
                    {
                      id: "Sede" as Tab,
                      label: "Sede",
                      count: totalAfiliadosSede,
                      icon: PiBuildingsDuotone,
                      show: true,
                    },
                    {
                      id: "Lideres" as Tab,
                      label: "Líderes",
                      count: totalLideresRegistrados,
                      icon: PiMedalDuotone,
                      show: true,
                    },
                    {
                      id: "Trabajadores" as Tab,
                      label: "Empleados",
                      count: totalEmpleadosRegistrados,
                      icon: PiBriefcaseDuotone,
                      show: true,
                    },
                    {
                      id: "Afiliados" as Tab,
                      label: "Miembros",
                      count: totalMiembrosGeneral,
                      icon: PiUsersThreeDuotone,
                      show: true,
                    },
                    {
                      id: "Administrativos" as Tab,
                      label: "Administrativos",
                      count: totalAdministrativosRegistrados,
                      icon: PiShieldCheckDuotone,
                      show: esAdminOSuper,
                    },
                    {
                      id: "Mensajes" as Tab,
                      label: "Mensajes",
                      count: null as number | null,
                      icon: Mail,
                      show: esAdminOSuper,
                    },
                  ] as const
                )
                  .filter((t) => t.show)
                  .map((tab) => {
                    const Icon = tab.icon;
                    const activo = activeTab === tab.id;
                    const theme = TAB_THEMES[tab.id];
                    return (
                      <motion.button
                        key={tab.id}
                        type="button"
                        onClick={() => cambiarTab(tab.id)}
                        className={tabBtnClass(activo, tab.id)}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className={tabPillClass(activo, tab.id)}>
                          <span className={tabIconClass()}>
                            <Icon className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                          </span>
                          <span className="whitespace-normal sm:whitespace-nowrap text-center leading-tight">
                            {tab.label}
                          </span>
                          {tab.count !== null && (
                            <span className={tabBadgeClass()}>{tab.count}</span>
                          )}
                          {activo && (
                            <motion.span
                              layoutId="pestana-subrayado"
                              className={`absolute -bottom-[9px] md:-bottom-[11px] left-0 right-0 h-[2px] md:h-[3px] rounded-full ${theme.lineBg}`}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 32,
                              }}
                            />
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false} custom={tabSlideDir}>
              {liderParaCelula && activeTab !== "Sede" ? (
                <motion.div
                  key={`celula-${liderParaCelula.id}`}
                  custom={tabSlideDir}
                  initial={{ opacity: 0, x: tabSlideDir * 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tabSlideDir * -28 }}
                  transition={{ duration: 0.45, ease: tabEase }}
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  custom={tabSlideDir}
                  initial={{ opacity: 0, x: tabSlideDir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tabSlideDir * -32 }}
                  transition={{ duration: 0.45, ease: tabEase }}
                >
                  {activeTab === "Sede" &&
                    (sedeUsuario ? (
                      <Celula
                        embedded
                        isOpen
                        onClose={() => {}}
                        lider={sedeUsuario}
                        onEditar={handleOpenEditModal}
                        onEditarUsuario={
                          esAdminOSuper ? handleOpenEditLiderModal : undefined
                        }
                        onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                        onDataChange={fetchData}
                        rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                      />
                    ) : (
                      renderPanelTab(
                        "Sede",
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
                                Créalo para afiliar desde sede y diferenciarlo
                                del avance de los líderes.
                              </p>
                            </div>
                          </div>
                        </div>,
                      )
                    ))}

                  {activeTab === "Lideres" &&
                    renderPanelTab(
                      "Lideres",
                      <Lideres
                        lideres={lideresVisibles}
                        onVerCelula={handleOpenCelula}
                        onEditar={handleOpenEditLiderModal}
                        rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                        onDataChange={fetchData}
                        searchTerm={busquedaTab("Lideres")}
                        idUsuarioSesion={userId}
                        isLoading={cargandoLideres}
                        tema={getTemaTab("Lideres")}
                      />,
                    )}
                  {activeTab === "Afiliados" && (
                    <AfiliadosGeneral
                      afiliados={afiliados}
                      lideres={allUsers}
                      onEditar={handleOpenEditModal}
                      onDataChange={fetchData}
                      searchTerm={busquedaTab("Afiliados")}
                      onSearchChange={(v) => setBusquedaTab("Afiliados", v)}
                      placeholder={placeholdersTab.Afiliados}
                      tema={getTemaTab("Afiliados")}
                      isLoading={cargandoMiembros}
                    />
                  )}
                  {activeTab === "Trabajadores" &&
                    renderPanelTab(
                      "Trabajadores",
                      <Lideres
                        lideres={trabajadores}
                        onVerCelula={handleOpenCelula}
                        onEditar={handleOpenEditLiderModal}
                        rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                        onDataChange={fetchData}
                        searchTerm={busquedaTab("Trabajadores")}
                        idUsuarioSesion={userId}
                        isLoading={cargandoLideres}
                        tema={getTemaTab("Trabajadores")}
                      />,
                    )}
                  {activeTab === "Administrativos" &&
                    renderPanelTab(
                      "Administrativos",
                      <Lideres
                        lideres={administrativos}
                        onVerCelula={handleOpenCelula}
                        onEditar={handleOpenEditLiderModal}
                        rolUsuarioSesion={esSedeSesion ? "SEDE" : rol}
                        onDataChange={fetchData}
                        searchTerm={busquedaTab("Administrativos")}
                        idUsuarioSesion={userId}
                        isLoading={cargandoLideres}
                        tema={getTemaTab("Administrativos")}
                      />,
                    )}
                  {activeTab === "Mensajes" &&
                    esAdminOSuper &&
                    renderPanelTab("Mensajes", <Difusion usuarios={allUsers} />)}
                </motion.div>
              )}
            </AnimatePresence>
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
                    Estadísticas Generales
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
                  <div className="flex w-full flex-col gap-8 pt-4">
                    <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
                      <div className="flex h-full flex-col justify-start rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
                        <EstadisticasEdades afiliados={afiliados} />
                      </div>

                      <div className="flex h-full flex-col justify-start rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
                        <EstadisticasReligiones afiliados={afiliados} />
                      </div>

                      <div className="flex h-full flex-col justify-start rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
                        <EstadisticasPoliticas afiliados={afiliados} />
                      </div>
                    </div>

                    <div className="flex w-full flex-col justify-start rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
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
        lideres={usuariosConCelula}
        afiliados={afiliados}
        isFirstMember={isFirstMemberAddition}
        datosLider={resolverUsuarioCelula(liderParaNuevoAfiliado)}
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
                  rolPredefinido={rolNuevoUsuario ?? undefined}
                />
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
