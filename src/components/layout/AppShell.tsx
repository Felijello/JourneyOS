"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Compass,
  Globe2,
  Home,
  LoaderCircle,
  Map,
  Plus,
  Settings,
} from "lucide-react";
import {
  CountryProvider,
  useTravel,
} from "@/components/providers/CountryProvider";
import { TravelSearch } from "@/components/travel/TravelSearch";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/countries", label: "Länder", icon: Globe2 },
  { href: "/trips", label: "Trips", icon: CalendarDays },
  { href: "/map", label: "Karte", icon: Map },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function DataSourcePill() {
  const { dataSource, capabilityStatus, supabaseStatus, isDemoMode } = useTravel();
  const label =
    isDemoMode
      ? "Demo"
      : dataSource === "supabase"
      ? "Supabase aktiv"
      : capabilityStatus.supabase
        ? supabaseStatus.authStatus === "error"
          ? "Auth prüfen"
          : supabaseStatus.authenticated
          ? "Supabase lädt"
          : "Magic Link nötig"
        : "Demo-Modus";
  const tone =
    isDemoMode
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : dataSource === "supabase"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : capabilityStatus.supabase
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <Link
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 transition hover:brightness-95",
        tone,
      )}
      href={dataSource === "supabase" ? "/settings" : "/login"}
    >
      {label}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-4 left-4 z-30 hidden w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white/92 px-4 py-5 shadow-card backdrop-blur-xl lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 px-2" href="/">
        <span className="flex size-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Compass aria-hidden="true" size={22} />
        </span>
        <span>
          <span className="block text-lg font-semibold tracking-tight text-slate-950">
            JourneyOS
          </span>
          <span className="block text-xs font-medium text-slate-500">
            Travel Operating System
          </span>
        </span>
      </Link>

      <nav className="mt-8 space-y-1.5" aria-label="Hauptnavigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 px-2 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          Deine Reisedaten sind standardmäßig privat.
        </p>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const mobileItems = navigation.slice(0, 4);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-large backdrop-blur-xl lg:hidden"
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition",
              isActive
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                : "text-slate-500 hover:bg-slate-50",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#f8fbff]/85 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:border-none lg:bg-transparent lg:px-8 lg:pt-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link className="flex items-center gap-3 lg:hidden" href="/">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Compass aria-hidden="true" size={20} />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-950">
            JourneyOS
          </span>
        </Link>

        <TravelSearch className="hidden max-w-xl lg:block" />

        <div className="flex items-center gap-2">
          <DataSourcePill />
          <LinkButton href="/countries/new">
            <Plus aria-hidden="true" size={17} />
            Land
          </LinkButton>
        </div>
      </div>
      <div className="mx-auto mt-3 max-w-7xl lg:hidden">
        <TravelSearch />
      </div>
    </header>
  );
}

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-soft">
          <Compass aria-hidden="true" size={23} />
        </span>
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto mt-5 animate-spin text-blue-600"
          size={22}
        />
        <p className="mt-3 text-sm font-medium text-slate-500">JourneyOS startet...</p>
      </div>
    </main>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isDemoMode, supabaseStatus } = useTravel();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/");
  const hasAccess = isDemoMode || supabaseStatus.authenticated;

  useEffect(() => {
    if (
      !isAuthRoute &&
      window.location.hash &&
      (window.location.hash.includes("access_token=") ||
        window.location.hash.includes("error_description="))
    ) {
      window.location.replace(`/auth/callback${window.location.hash}`);
      return;
    }

    if (!isLoading && !isAuthRoute && !hasAccess) {
      router.replace("/login");
    }
  }, [hasAccess, isAuthRoute, isLoading, router]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading || !hasAccess) {
    return <AuthLoading />;
  }

  return (
    <div className="min-h-screen text-slate-950">
      <Sidebar />
      <main className="min-h-screen pb-28 lg:ml-72 lg:pb-0">
        <TopBar />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-2">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <ShellContent>{children}</ShellContent>
    </CountryProvider>
  );
}
