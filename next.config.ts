import type { NextConfig } from "next";
// @ts-ignore - Esto evita que el editor se queje si el servidor de TS está lento
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    importScripts: ["/push-handlers.js"],
  },
});

const nextConfig: NextConfig = {
  // AGREGAMOS ESTA LÍNEA (como te sugirió la terminal)
  // @ts-ignore - El tipo NextConfig a veces no reconoce 'turbopack' directamente aún
  turbopack: {}, 

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default withPWA(nextConfig);