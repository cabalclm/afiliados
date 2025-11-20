import "./globals.css";
import { Geist } from "next/font/google";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: "CABAL CLM",
  description: "Sistema de Afiliación de votantes para Concepción Las Minas",
  icons: [
    { rel: "icon", url: "/logo.png" },
    { rel: "shortcut icon", url: "/logo.png" },
    { rel: "apple-touch-icon", url: "/logo.png" },
  ],
  // --- Configuración Adicional para PWA y Manifiesto ---
  manifest: "/manifest.json",
  themeColor: "#000000",
  other: {
    // Necesario para que funcione correctamente la instalación PWA en iOS/Android
    'viewport': 'width=device-width, initial-scale=1, viewport-fit=cover',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'CABAL CLM',
  },
  // --- Fin de Configuración PWA ---
};

const geistSans = Geist({ display: "swap", subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen flex flex-col">

        <div className="flex flex-col flex-1">
          {children}
        </div>
        
        <ToastContainer
          position="top-right"
          autoClose={10000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}