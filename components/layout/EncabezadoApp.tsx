import HeaderAuth from "@/components/header-auth";
import BloqueCampana from "@/components/dashboard/BloqueCampana";
import LogoLink from "@/components/ui/LogoLink";

/** Nav: logo | campaña (lg+) | sesión */
export default function EncabezadoApp() {
  return (
    <nav className="relative w-full shrink-0 overflow-hidden border-b border-sky-100 bg-gradient-to-r from-white via-sky-50/80 to-blue-50/70 shadow-sm shadow-blue-900/5 dark:border-white/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 right-10 h-48 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-700/20"
      />
      <div
        className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2 pl-1 pr-3 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-center lg:gap-4"
      >
        <div className="min-w-0 justify-self-start">
          <LogoLink />
        </div>

        <div className="hidden min-w-0 justify-self-center lg:block">
          <div className="rounded-2xl border border-white/70 bg-white/70 px-5 py-2 shadow-md shadow-blue-900/5 backdrop-blur-md dark:border-white/10 dark:bg-neutral-800/50">
            <BloqueCampana variant="header" />
          </div>
        </div>

        <div className="justify-self-end shrink-0">
          <HeaderAuth />
        </div>
      </div>
    </nav>
  );
}
