"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const FULL_NAME = "Sistema de Organización Territorial Estratégica";

export default function LogoLink() {
  const router = useRouter();

  return (
    <div className="flex min-w-0 items-center justify-start py-1 sm:ml-5">
      <motion.div
        className="flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
        onClick={() => router.push("/protected")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="shrink-0 rounded-2xl bg-white p-1.5 shadow-lg shadow-blue-900/10 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10 sm:p-2"
        >
          <Image
            src="/svg/logo-2.svg"
            alt="Afiliaciones CLM"
            height={100}
            width={100}
            className="h-11 w-11 rounded-xl object-contain sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]"
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-[11rem] text-left text-[10px] font-semibold leading-snug tracking-wide bg-gradient-to-r from-blue-700 via-sky-500 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-blue-400 sm:max-w-xs sm:text-xs md:max-w-sm md:text-sm"
        >
          {FULL_NAME}
        </motion.p>
      </motion.div>
    </div>
  );
}
