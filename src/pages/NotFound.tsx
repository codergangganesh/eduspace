import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, Compass, Home, LifeBuoy, SearchX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FlowLinkButton } from "@/components/ui/flow-link-button";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const primaryRoute = useMemo(() => {
    if (!isAuthenticated) {
      return { label: "Go to Home", to: "/", icon: Home };
    }

    if (role === "lecturer") {
      return { label: "Go to Dashboard", to: "/lecturer-dashboard", icon: Compass };
    }

    return { label: "Go to Dashboard", to: "/dashboard", icon: Compass };
  }, [isAuthenticated, role]);

  const quickLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { label: "Student Login", to: "/student/login", icon: ArrowRight },
        { label: "Lecturer Login", to: "/lecturer/login", icon: ArrowRight },
        { label: "Help Center", to: "/help", icon: LifeBuoy },
      ];
    }

    if (role === "lecturer") {
      return [
        { label: "Assignments", to: "/lecturer/assignments", icon: BookOpen },
        { label: "Schedule", to: "/schedule", icon: Calendar },
        { label: "Help Center", to: "/help", icon: LifeBuoy },
      ];
    }

    return [
      { label: "Assignments", to: "/student/assignments", icon: BookOpen },
      { label: "Schedule", to: "/schedule", icon: Calendar },
      { label: "Help Center", to: "/help", icon: LifeBuoy },
    ];
  }, [isAuthenticated, role]);

  const PrimaryIcon = primaryRoute.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted)/0.6)_100%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-10%] top-16 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute bottom-12 right-[-8%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/40 bg-white/75 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg sm:h-16 sm:w-16">
              <SearchX className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">
                Page Recovery
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                This page went off track
              </h1>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
                Error 404
              </div>

              <p className="text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                The link you opened doesn&apos;t point to an active page right now. It may have been moved,
                removed, or typed incorrectly.
              </p>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Tried path
                </p>
                <p className="mt-2 break-all font-mono text-sm text-slate-700 dark:text-slate-200">
                  {location.pathname}
                </p>
              </div>

              <div className="grid gap-3 sm:max-w-xl sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Primary Action
                  </span>
                  <FlowLinkButton to={primaryRoute.to} text={primaryRoute.label} className="min-h-12 sm:min-h-[50px]" />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Support
                  </span>
                  <FlowLinkButton to="/help" text="Open Help" className="min-h-12 sm:min-h-[50px]" />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Quick Redirects
              </p>

              <div className="space-y-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-sky-800 dark:hover:bg-sky-950/20"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{link.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
