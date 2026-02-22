"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LogoLink() {
  const router = useRouter();

  return (
    // Se mantiene alineado arriba con items-start
    <div className="flex justify-center items-start">
      <motion.div
        className="cursor-pointer flex items-center gap-3"
        onClick={() => router.push("/protected")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <Image
            src="/svg/logo-2.svg"
            alt="Afiliaciones CLM"
            height={100}
            width={100}
            className="w-36 h-auto object-contain"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1
            className="text-[#0066cc] font-serif text-[9px] md:text-2xl font-bold leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Sistema de Organización <br /> Territorial Estratégica
          </h1>
        </motion.div>
      </motion.div>
    </div>
  );
}
