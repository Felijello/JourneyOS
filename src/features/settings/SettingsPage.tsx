"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Code2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useSocial } from "@/components/providers/SocialProvider";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export function SettingsPage() {
  const router = useRouter();
  const { currentProfile, settings, updateSettings, isAdmin } = useSocial();
  const { capabilityStatus, isDemoMode, leaveDemoMode } = useTravel();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    if (isDemoMode) leaveDemoMode();
    await supabase?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function sendPasswordReset() {
    if (!supabase || !email) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/reset-password", siteUrl).toString(),
    });
    setMessage(error ? "Der Link konnte gerade nicht gesendet werden." : "Reset-Link ist unterwegs.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-blue-600">Dein JourneyOS</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">Einstellungen</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Profil, Privatsphäre und Benachrichtigungen an einem ruhigen Ort.</p>
      </div>

      <SettingsSection icon={<UserRound size={20} />} subtitle="So sehen dich andere Reisende." title="Profil bearbeiten">
        <ProfileForm />
      </SettingsSection>

      <SettingsSection icon={<Bell size={20} />} subtitle="Du entscheidest, wofür JourneyOS sich meldet." title="Benachrichtigungen">
        <div className="divide-y divide-slate-100">
          <SettingsToggle checked={settings?.socialNotifications ?? true} description="Neue Follower und Likes" label="Community" onChange={(checked) => void updateSettings({ socialNotifications: checked })} />
          <SettingsToggle checked={settings?.tripReminders ?? true} description="Hinweise vor geplanten Reisen" label="Reiseerinnerungen" onChange={(checked) => void updateSettings({ tripReminders: checked })} />
          <SettingsToggle checked={settings?.emailNotifications ?? true} description="Wichtige Konto- und Reiseupdates" label="E-Mail" onChange={(checked) => void updateSettings({ emailNotifications: checked })} />
        </div>
      </SettingsSection>

      <SettingsSection icon={<ShieldCheck size={20} />} subtitle="Öffentliche Reisen zeigen nur veröffentlichte Inhalte." title="Datenschutz">
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>Private Reisen, Budgets, interne Notizen, Tagespläne, Packlisten und gespeicherte Links bleiben ausschließlich in deinem Konto.</p>
          <p>Deine Profil-Sichtbarkeit und die Sichtbarkeit jeder Reise kannst du unabhängig voneinander ändern.</p>
        </div>
      </SettingsSection>

      <SettingsSection icon={<Lock size={20} />} subtitle="E-Mail, Passwort und Zugang." title="Account & Sicherheit">
        <div className="divide-y divide-slate-100">
          <div className="flex items-center gap-3 py-4"><Mail className="text-slate-400" size={18} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">E-Mail-Adresse</p><p className="truncate text-sm text-slate-500">{email || "Google- oder Demo-Konto"}</p></div></div>
          {!isDemoMode ? (
            <button className="flex min-h-14 w-full items-center gap-3 py-3 text-left" onClick={() => void sendPasswordReset()} type="button"><KeyRound className="text-slate-400" size={18} /><span className="flex-1 text-sm font-semibold text-slate-800">Passwort ändern</span><ChevronRight className="text-slate-300" size={18} /></button>
          ) : null}
        </div>
        {message ? <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p> : null}
      </SettingsSection>

      <section className="border-t border-slate-200 pt-6">
        <Button onClick={() => void signOut()} variant="danger"><LogOut size={17} />{isDemoMode ? "Demo verlassen" : "Abmelden"}</Button>
      </section>

      {isAdmin ? (
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"><Code2 size={17} />Entwicklerdiagnose</summary>
          <dl className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div>AI: {capabilityStatus.ai ? "bereit" : "fehlt"}</div>
            <div>Routing: {capabilityStatus.routing ? "bereit" : "fehlt"}</div>
            <div>Karte: {capabilityStatus.maptiler ? "MapTiler" : "OSM"}</div>
            <div>Profil: {currentProfile?.id ?? "nicht geladen"}</div>
          </dl>
        </details>
      ) : null}
    </div>
  );
}

function SettingsSection({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">{icon}</span><div><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div>
      {children}
    </section>
  );
}

function SettingsToggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-4 py-3">
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="block text-sm text-slate-500">{description}</span></span>
      <input checked={checked} className="peer sr-only" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span className="relative h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
