import "./globals.css";
import { Geist } from "next/font/google";
import AutoLogoutWrapper from '@/components/ui/AutoLogoutWrapper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: "Votantes CLM",
  description: "Sistema de Afiliación de votantes para Concepción Las Minas",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "shortcut icon", url: "icons/favicon.ico" },
    { rel: "apple-touch-icon", url: "/favicon.png" },
  ],
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
        <AutoLogoutWrapper />

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