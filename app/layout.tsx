import "./globals.css";
import { Geist } from "next/font/google";
import type { Viewport } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "SOTE - Sistema de Organización Territorial Estratégica",

  description: "Sistema de Gestión y Organización territorial Estratégica",
  icons: [
    { rel: "icon", url: "/icons/manifest-icon-192.maskable.png" },
    { rel: "apple-touch-icon", url: "/icons/apple-icon-180.png" },
  ],
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOTE",
  },
};

const geistSans = Geist({ display: "swap", subsets: ["latin"] });

import QueryProvider from "@/components/providers/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geistSans.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col " suppressHydrationWarning>
        <QueryProvider>
          <div className="flex flex-col flex-1">{children}</div>
        </QueryProvider>

        <ToastContainer
          position="top-center"
          autoClose={10000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </body>
    </html>
  );
}
