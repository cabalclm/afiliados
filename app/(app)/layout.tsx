import HeaderAuth from "@/components/header-auth";
import LogoLink from "@/components/ui/LogoLink";
import FechaHoraActual from '@/components/ui/FechaHoraActual';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="w-full flex h-40">
        <div className="w-full flex  items-center justify-between px-5 pt-3 text-sm">
          <div className="flex items-center gap-3">
            <LogoLink />
          </div>
          <div className="shrink-0">
            <HeaderAuth />
          </div>
        </div>
      </nav>

      <main className="flex flex-col gap-5 flex-grow w-full self-center">
        {children}
      </main>

      <footer className="pt-5 mt-auto border-t border-foreground/10 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-6 pb-6">
        <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="text-left">
            <FechaHoraActual />
            <p className="mt-2 text-sm md:text-base">
              Powered by{" "}
              <a
                href="https://www.oscar27jimenez.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline text-[#06c]"
              >
                Ing. Oscar Jiménez
              </a>
            </p>
          </div>

          <div className="text-right text-xs md:text-sm leading-tight">
            <p>© {new Date().getFullYear()} - Todos los derechos reservados.</p>
            <p className="text-[10px] md:text-xs mt-1">Versión 1.0.0</p>
          </div>
        </div>
      </footer>
    </>
  );
}