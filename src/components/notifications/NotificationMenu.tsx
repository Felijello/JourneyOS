"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Heart, UserPlus } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { supabase } from "@/lib/supabase/client";

type NotificationRow = {
  id: string;
  type: "follow" | "like" | "packing_reminder" | "weather_reminder" | "trip_incomplete";
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationMenu() {
  const { isDemoMode } = useTravel();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase || isDemoMode) return;
    let active = true;
    void supabase.from("notifications").select("id,type,title,body,href,read_at,created_at").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      if (active) setItems((data as NotificationRow[] | null) ?? []);
    });
    return () => { active = false; };
  }, [isDemoMode]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (isDemoMode) return null;
  const unread = items.filter((item) => !item.read_at).length;

  async function markAllRead() {
    if (!supabase || unread === 0) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).is("read_at", null);
    if (!error) setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
  }

  return <div className="relative" ref={menuRef}>
    <button aria-expanded={isOpen} aria-label={unread ? `${unread} ungelesene Benachrichtigungen` : "Benachrichtigungen"} className="relative grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-950" onClick={() => setIsOpen((value) => !value)} type="button">
      <Bell size={18} />
      {unread ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{Math.min(unread, 9)}</span> : null}
    </button>
    {isOpen ? <section aria-label="Benachrichtigungen" className="fixed inset-x-3 top-20 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96">
      <div className="flex items-center justify-between gap-3 px-2 py-1"><h2 className="font-semibold text-slate-950">Benachrichtigungen</h2><button className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-blue-600 disabled:text-slate-400" disabled={!unread} onClick={() => void markAllRead()} type="button"><CheckCheck size={15} />Alle gelesen</button></div>
      <div className="mt-2 space-y-1">{items.length ? items.map((item) => {
        const Icon = item.type === "follow" ? UserPlus : Heart;
        const content = <><span className={`grid size-9 shrink-0 place-items-center rounded-full ${item.read_at ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-600"}`}><Icon size={16} /></span><span className="min-w-0"><strong className="block text-sm text-slate-900">{item.title}</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.body}</span></span></>;
        return item.href ? <Link className={`flex gap-3 rounded-lg p-3 hover:bg-slate-50 ${item.read_at ? "" : "bg-blue-50/50"}`} href={item.href} key={item.id} onClick={() => setIsOpen(false)}>{content}</Link> : <div className={`flex gap-3 rounded-lg p-3 ${item.read_at ? "" : "bg-blue-50/50"}`} key={item.id}>{content}</div>;
      }) : <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Hier ist gerade alles ruhig.</p>}</div>
    </section> : null}
  </div>;
}
