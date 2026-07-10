"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Compass,
  Globe2,
  Home,
  Map,
  Plus,
  Settings,
  Sparkles,
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
  const { dataSource, capabilityStatus, supabaseStatus } = useTravel();
  const label =
    dataSource === "supabase"
      ? "Supabase aktiv"
      : capabilityStatus.supabase
        ? supabaseStatus.authStatus === "error"
          ? "Auth prüfen"
          : supabaseStatus.authenticated
          ? "Supabase lädt"
          : "Magic Link nötig"
        : "Demo-Modus";
  const tone =
    dataSource === "supabase"
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
    <aside className="fixed inset-y-4 left-4 z-30 hidden w-64 overflow-y-auto rounded-3xl border border-slate-200/80 bg-white/82 px-4 py-5 shadow-card backdrop-blur-2xl lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 px-2" href="/">
        <span className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
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
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
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

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Sparkles aria-hidden="true" className="text-blue-600" size={17} />
            AI vorbereitet
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Die Suche kombiniert Gemini, Open-Meteo und Geocoding für schnelle
            Reisezeit-Checks.
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
          <div className="size-10 rounded-full bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80')] bg-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Felix</p>
            <p className="text-xs text-blue-600">Premium Traveller</p>
          </div>
        </div>
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
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-slate-200 bg-white/94 p-1.5 shadow-large backdrop-blur-2xl lg:hidden"
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
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition",
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
          <span className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <Compass aria-hidden="true" size={20} />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-950">
            JourneyOS
          </span>
        </Link>

        <TravelSearch className="hidden max-w-xl lg:block" />

        <div className="flex items-center gap-2">
          <DataSourcePill />
          <button
            className="hidden size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-950 sm:flex"
            title="Benachrichtigungen"
            type="button"
          >
            <Bell aria-hidden="true" size={18} />
          </button>
          <LinkButton className="rounded-2xl" href="/countries/new">
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

function ShellContent({ children }: { children: ReactNode }) {
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
