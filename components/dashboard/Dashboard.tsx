"use client";

import useUserData from "@/hooks/sesion/useUserData";
import VerAfiliados from "@/components/afiliados/Ver";

export default function Dashboard() {
  const { userId, cargando } = useUserData();

  if (cargando) {
    return (
      <div className="animate-pulse space-y-4 px-2 md:px-6">
        <div className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
        <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return <VerAfiliados key={userId || "sin-sesion"} />;
}
