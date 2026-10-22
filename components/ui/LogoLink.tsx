"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const FULL_NAME = "Sistema de Organización Territorial Estratégica";

const shineTitleClass =
  "font-serif font-bold leading-tight text-left bg-gradient-to-r from-blue-800 via-blue-400 to-blue-800 dark:from-blue-400 dark:via-blue-200 dark:to-blue-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-text-shine";

export default function LogoLink() {
  const router = useRouter();

  return (
    <div className="flex justify-start items-center ml-2 sm:ml-5 min-w-0 flex-1 py-1">
      <motion.div
        className="cursor-pointer flex flex-col items-start gap-0.5 sm:gap-1 min-w-0 w-full max-w-full"
        onClick={() => router.push("/protected")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="shrink-0"
          >
            <Image
              src="/icons/logo.png"
              alt="Afiliaciones CLM"
              height={100}
              width={100}
              className="w-14 sm:w-20 md:w-24 h-auto object-contain"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -12, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.8,
              delay: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <h1
              className={`${shineTitleClass} text-xl sm:text-2xl md:text-3xl`}
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Concepción
              <br />
              Las Minas
            </h1>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-[10px] sm:text-xs md:text-sm leading-snug text-blue-800/90 dark:text-blue-200/90 font-sans font-normal text-left w-full pr-2"
        >
          {FULL_NAME}
        </motion.p>
      </motion.div>
    </div>
  );
}
