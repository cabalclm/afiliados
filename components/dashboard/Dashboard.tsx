"use client";

import { useRouter } from "next/navigation";

import VerAfiliados from "@/components/afiliados/Ver";
import useUserData from "@/hooks/sesion/useUserData";

export default function Dashboard() {
  const router = useRouter();
  const { rol, cargando } = useUserData();

  return (
    <>
      <VerAfiliados />
    </>
  );
}
