'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LogoLink() {
  const router = useRouter();

  return (
    // Se mantiene alineado arriba con items-start
    <div className="flex justify-center items-start">
      <motion.div
        className="cursor-pointer"
        onClick={() => router.push('/protected')}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <Image
            src="/svg/logo.svg"
            alt="Afiliaciones CLM"
            height={200}
            width={200}

            className="w-40 md:w-64 h-auto object-contain"
            priority
          />
        </motion.div>
      </motion.div>
    </div>
  );
}