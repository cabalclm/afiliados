"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense } from "react";
import VerAfiliados from "@/components/afiliados/Ver";
import useUserData from "@/hooks/sesion/useUserData";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { rol, cargando } = useUserData();

  return (
    <>
      <Suspense>
        <VerAfiliados />
      </Suspense>
    </>
  );
}
