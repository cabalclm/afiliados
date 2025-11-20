'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

const typeWriterVariant: Variants = {
  hidden: { width: 0, opacity: 0 },
  visible: (i: number) => {
    const duration = i === 1 ? 0.5 : 1;
    let delay = 0;
    
    if (i === 1) delay = 0.5;
    if (i === 2) delay = 1.2;

    return {
      width: 'fit-content',
      opacity: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: "linear",
      },
    };
  },
};

export default function LogoLink() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const PRIMARY_COLOR = theme === 'dark' ? '#ffffff' : '#0066cc';
  const SECONDARY_COLOR = theme === 'dark' ? '#9ca3af' : '#4B5563';

  return (
    <div className="flex items-center justify-center">
      <motion.div
        // RESPONSIVE: flex-col para móvil (uno abajo del otro), md:flex-row para escritorio (lado a lado)
        className="flex flex-col md:flex-row items-center gap-1 md:gap-3 cursor-pointer"
        onClick={() => router.push('/protected')}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          // Ajuste de tamaño de imagen para móvil vs escritorio si es necesario
          className="flex justify-center"
        >
          <Image
            src="/images/logo.png"
            alt="CABAL -CLM-"
            height={150}
            width={150}
            className="w-32 md:w-32 h-auto object-contain"
          />
        </motion.div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left leading-tight">
          
          <motion.span 
            className="block text-[10px] md:text-2xl font-extrabold uppercase tracking-wide whitespace-nowrap overflow-hidden mt-[-15px]"
            style={{ color: PRIMARY_COLOR, fontFamily: 'Montserrat, sans-serif' }}
            variants={typeWriterVariant}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Sistema de Afiliación
          </motion.span>
          
         <motion.span 
            className="italic block text-[10px] md:text-xl font-bold whitespace-nowrap overflow-hidden"
            style={{ color: SECONDARY_COLOR, fontFamily: 'Inter, sans-serif' }}
            variants={typeWriterVariant}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Concepción Las Minas
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}