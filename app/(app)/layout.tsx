import EncabezadoApp from "@/components/layout/EncabezadoApp";
import FechaHoraActual from "@/components/ui/FechaHoraActual";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoApp />

      <main className="flex flex-col gap-5 flex-grow w-full self-center max-w-full overflow-x-hidden min-w-0">
        {children}
      </main>

      <footer className="relative mt-auto overflow-hidden border-t border-sky-100 bg-gradient-to-r from-white via-sky-50/80 to-blue-50/70 px-6 pb-6 pt-5 text-gray-700 shadow-[0_-1px_8px_0_rgba(30,64,175,0.05)] dark:border-white/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950/40 dark:text-gray-300">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-10 h-48 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-700/20"
        />
        <div className="relative mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
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
            <p className="text-[10px] md:text-xs mt-1">Versión 2.0</p>
          </div>
        </div>
      </footer>
    </>
  );
}
