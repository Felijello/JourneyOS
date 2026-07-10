"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { KeyRound, Mail, UserPlus } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register" | "magic";

const fallbackSiteUrl = "https://journey-os-wine.vercel.app";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const productionSiteUrl =
  configuredSiteUrl && !configuredSiteUrl.includes("localhost")
    ? configuredSiteUrl
    : fallbackSiteUrl;
const authCallbackUrl = new URL("/auth/callback", productionSiteUrl).toString();

export function AuthPanel() {
  const router = useRouter();
  const { enableDemoMode } = useTravel();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function validateCredentials() {
    if (!email.trim() || !email.includes("@")) {
      setIsError(true);
      setMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
      return false;
    }
    if (mode !== "magic" && password.length < 8) {
      setIsError(true);
      setMessage("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !validateCredentials()) return;

    setIsSubmitting(true);
    setIsError(false);
    setMessage(null);

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: authCallbackUrl,
          shouldCreateUser: true,
        },
      });
      setIsSubmitting(false);
      setIsError(Boolean(error));
      setMessage(
        error
          ? getFriendlyAuthError(error.message)
          : "Magic Link verschickt. Er führt zur JourneyOS-App auf Vercel.",
      );
      return;
    }

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: authCallbackUrl },
      });
      setIsSubmitting(false);
      setIsError(Boolean(error));
      if (error) {
        setMessage(getFriendlyAuthError(error.message));
      } else if (data.session) {
        setMessage("Konto erstellt. JourneyOS wird geöffnet...");
        router.push("/");
        router.refresh();
      } else {
        setMessage(
          "Konto erstellt. Bitte bestätige deine E-Mail und melde dich danach an.",
        );
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);
    setIsError(Boolean(error));
    if (error) {
      setMessage(getFriendlyAuthError(error.message));
    } else {
      setMessage("Eingeloggt. JourneyOS wird geöffnet...");
      router.push("/");
      router.refresh();
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("Du bist abgemeldet.");
    setIsError(false);
  }

  function openDemo() {
    enableDemoMode();
    setMessage("Demo-Ansicht ist aktiv.");
    setIsError(false);
    router.push("/");
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="journey-card rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-slate-950">Zugang</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Supabase ist noch nicht konfiguriert. Die Demo funktioniert trotzdem
          vollständig lokal in diesem Browser.
        </p>
        <Button className="mt-5" onClick={openDemo}>
          Demo ansehen
        </Button>
      </section>
    );
  }

  return (
    <section className="journey-card rounded-3xl p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-950">JourneyOS Zugang</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Melde dich mit Passwort an, erstelle ein Konto oder nutze einen Magic Link.
      </p>

      {user ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Angemeldet als <strong>{user.email}</strong>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/">Zum Dashboard</LinkButton>
            <Button onClick={handleSignOut} variant="secondary">
              Abmelden
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            aria-label="Zugangsart"
            className="mt-5 grid grid-cols-3 rounded-2xl bg-slate-100 p-1"
            role="tablist"
          >
            {([
              ["login", "Login", KeyRound],
              ["register", "Registrieren", UserPlus],
              ["magic", "Magic Link", Mail],
            ] as const).map(([value, label, Icon]) => (
              <button
                aria-selected={mode === value}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition sm:text-sm",
                  mode === value
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
                key={value}
                onClick={() => {
                  setMode(value);
                  setMessage(null);
                  setIsError(false);
                }}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" size={16} />
                {label}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                E-Mail-Adresse
              </span>
              <input
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="deine@email.at"
                required
                type="email"
                value={email}
              />
            </label>

            {mode !== "magic" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Passwort
                </span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Bitte warten..."
                : mode === "login"
                  ? "Einloggen"
                  : mode === "register"
                    ? "Konto erstellen"
                    : "Magic Link senden"}
            </Button>
            <Button className="w-full" onClick={openDemo} variant="secondary">
              Demo ohne Konto ansehen
            </Button>
          </form>
        </>
      )}

      {message ? (
        <p
          aria-live="polite"
          className={cn(
            "mt-4 rounded-2xl px-4 py-3 text-sm font-medium",
            isError
              ? "bg-rose-50 text-rose-700"
              : "bg-blue-50 text-blue-700",
          )}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist nicht korrekt.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (normalized.includes("user already registered")) {
    return "Für diese E-Mail gibt es bereits ein Konto.";
  }
  if (normalized.includes("rate limit")) {
    return "Zu viele Versuche. Bitte warte kurz und probiere es erneut.";
  }
  return "Der Zugang konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut.";
}
