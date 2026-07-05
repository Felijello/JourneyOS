"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Globe2,
  Home,
  Map,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { CountryProvider, useCountries } from "@/components/providers/CountryProvider";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/countries", label: "Länder", icon: Globe2 },
  { href: "/countries/new", label: "Hinzufügen", icon: Plus },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function DataSourcePill() {
  const { dataSource } = useCountries();

  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-graphite-600 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
      {dataSource === "supabase" ? "Supabase aktiv" : "Lokaler Modus"}
    </span>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto border-r border-zinc-200 bg-white/90 px-5 py-6 backdrop-blur-xl dark:border-white/10 dark:bg-graphite-950/90 lg:flex lg:flex-col">
      <Link className="flex items-center gap-3" href="/">
        <span className="flex size-11 items-center justify-center rounded-xl bg-graphite-950 text-white shadow-soft dark:bg-white dark:text-graphite-950">
          <Compass aria-hidden="true" size={22} />
        </span>
        <span>
          <span className="block text-lg font-semibold text-graphite-950 dark:text-white">
            JourneyOS
          </span>
          <span className="block text-xs font-medium text-graphite-500 dark:text-zinc-400">
            Dein Reise-Betriebssystem
          </span>
        </span>
      </Link>

      <nav className="mt-10 space-y-2" aria-label="Hauptnavigation">
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
                  ? "bg-graphite-950 text-white shadow-soft dark:bg-white dark:text-graphite-950"
                  : "text-graphite-600 hover:bg-zinc-100 hover:text-graphite-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-zinc-200 bg-mist-50 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-graphite-950 dark:text-white">
          <Sparkles aria-hidden="true" size={17} />
          AI später vorbereitet
        </div>
        <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
          V1 sammelt deine Reisedaten sauber. Beschreibungen, Pläne und
          Vergleiche können später darauf aufbauen.
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
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-xl border border-zinc-200 bg-white/92 p-1 shadow-large backdrop-blur-xl dark:border-white/10 dark:bg-graphite-900/92 lg:hidden"
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
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition",
              isActive
                ? "bg-graphite-950 text-white dark:bg-white dark:text-graphite-950"
                : "text-graphite-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10",
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

function ShellContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-graphite-950 dark:bg-graphite-950 dark:text-white">
      <Sidebar />
      <main className="min-h-screen pb-28 lg:ml-72 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/85 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-graphite-950/85 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link className="flex items-center gap-3 lg:hidden" href="/">
              <span className="flex size-10 items-center justify-center rounded-lg bg-graphite-950 text-white dark:bg-white dark:text-graphite-950">
                <Compass aria-hidden="true" size={20} />
              </span>
              <span className="text-base font-semibold">JourneyOS</span>
            </Link>
            <div className="hidden items-center gap-2 lg:flex">
              <Map aria-hidden="true" className="text-moss-600" size={18} />
              <span className="text-sm font-medium text-graphite-600 dark:text-zinc-300">
                Länder, Pläne und Erinnerungen an einem Ort.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DataSourcePill />
              <LinkButton className="hidden sm:inline-flex" href="/countries/new">
                <Plus aria-hidden="true" size={17} />
                Land
              </LinkButton>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
