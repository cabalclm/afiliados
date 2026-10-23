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
          className="shrink-0"
        >
          <Image
            src="/icons/logo.png"
            alt="Afiliaciones CLM"
            height={100}
            width={100}
            className="h-auto w-14 object-contain sm:w-20 md:w-24"
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-[11rem] text-left text-[10px] font-semibold leading-snug tracking-wide text-[#06c] dark:text-[#99ccff] sm:max-w-xs sm:text-xs md:max-w-sm md:text-sm"
        >
          {FULL_NAME}
        </motion.p>
      </motion.div>
    </div>
  );
}
