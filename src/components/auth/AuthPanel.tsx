"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Play,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register" | "magic" | "recovery";

const fallbackSiteUrl = "https://journey-os-wine.vercel.app";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const productionSiteUrl =
  configuredSiteUrl && !configuredSiteUrl.includes("localhost")
    ? configuredSiteUrl
    : fallbackSiteUrl;
const authCallbackUrl = new URL("/auth/callback", productionSiteUrl).toString();
const passwordResetUrl = new URL("/reset-password", productionSiteUrl).toString();

export function AuthPanel() {
  const router = useRouter();
  const { enableDemoMode } = useTravel();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
    setIsError(false);
    setConfirmationEmail(null);
  }

  function validateCredentials() {
    if (!email.trim() || !email.includes("@")) {
      setIsError(true);
      setMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
      return false;
    }
    if (mode !== "magic" && mode !== "recovery" && password.length < 8) {
      setIsError(true);
      setMessage("Dein Passwort braucht mindestens 8 Zeichen.");
      return false;
    }
    if (mode === "register" && !/^[a-z0-9_]{3,24}$/.test(username.trim().toLowerCase())) {
      setIsError(true);
      setMessage("Dein Username braucht 3 bis 24 Zeichen: Buchstaben, Zahlen oder _.");
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

    try {
      if (mode === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: passwordResetUrl,
        });
        setIsError(Boolean(error));
        setMessage(
          error
            ? getFriendlyAuthError(error.message)
            : "Reset-Link ist unterwegs. Prüfe auch kurz deinen Spam-Ordner.",
        );
        return;
      }

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: authCallbackUrl,
            shouldCreateUser: true,
          },
        });
        setIsError(Boolean(error));
        setMessage(
          error
            ? getFriendlyAuthError(error.message)
            : "Link ist unterwegs. Prüfe auch kurz deinen Spam-Ordner.",
        );
        return;
      }

      if (mode === "register") {
        const normalizedEmail = email.trim();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: authCallbackUrl,
            data: { username: username.trim().toLowerCase() },
          },
        });
        setIsError(Boolean(error));
        if (error) {
          setMessage(getFriendlyAuthError(error.message));
        } else if (data.session) {
          setMessage("Konto erstellt. JourneyOS wird geöffnet...");
          router.replace("/");
          router.refresh();
        } else if (data.user?.identities?.length === 0) {
          setIsError(true);
          setMessage(
            "Für diese E-Mail gibt es schon ein Konto. Nutze den Login oder setze dein Passwort zurück.",
          );
        } else {
          setConfirmationEmail(normalizedEmail);
          setMessage(
            "Fast geschafft. Öffne die Bestätigungsmail und komm danach zurück.",
          );
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setIsError(Boolean(error));
      if (error) {
        setMessage(getFriendlyAuthError(error.message));
      } else {
        setMessage("Du bist drin. JourneyOS wird geöffnet...");
        router.replace("/");
        router.refresh();
      }
    } catch {
      setIsError(true);
      setMessage("Die Verbindung klappt gerade nicht. Bitte versuche es gleich noch einmal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!supabase || !confirmationEmail) return;
    setIsResending(true);
    setIsError(false);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: { emailRedirectTo: authCallbackUrl },
      });
      setIsError(Boolean(error));
      setMessage(
        error
          ? getFriendlyAuthError(error.message)
          : "Neue Bestätigung verschickt. Prüfe bitte Posteingang und Spam.",
      );
    } catch {
      setIsError(true);
      setMessage("Die Mail konnte gerade nicht erneut verschickt werden.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!supabase) return;

    setIsGoogleSubmitting(true);
    setIsError(false);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl },
      });

      if (error) {
        setIsError(true);
        setMessage(getFriendlyAuthError(error.message));
        setIsGoogleSubmitting(false);
      }
    } catch {
      setIsError(true);
      setMessage("Google Login konnte gerade nicht gestartet werden.");
      setIsGoogleSubmitting(false);
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
    router.replace("/");
  }

  if (!isSupabaseConfigured) {
    return (
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">JourneyOS testen</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Die Online-Verbindung fehlt gerade. Die Demo läuft trotzdem direkt in
          diesem Browser.
        </p>
        <Button className="mt-6 w-full" onClick={openDemo}>
          <Play aria-hidden="true" size={17} />
          Demo öffnen
        </Button>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <p className="text-sm font-semibold text-blue-600">Willkommen zurück</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Du bist eingeloggt.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{user.email}</p>
        <Button className="mt-6 w-full" onClick={() => router.replace("/")}>
          Zum Dashboard
          <ArrowRight aria-hidden="true" size={17} />
        </Button>
        <Button className="mt-3 w-full" onClick={handleSignOut} variant="ghost">
          Abmelden
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-blue-600">
        {mode === "register" ? "Dein nächstes Kapitel" : "Willkommen zurück"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
        {mode === "register"
          ? "Konto erstellen"
            : mode === "magic"
            ? "Per Link einloggen"
            : mode === "recovery"
              ? "Passwort zurücksetzen"
            : "Einloggen"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Länder, Ideen und echte Trips an einem Ort.
      </p>

      <div
        aria-label="Zugangsart"
        className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
      >
        {([
          ["login", "Login", KeyRound],
          ["register", "Registrieren", UserPlus],
        ] as const).map(([value, label, Icon]) => (
          <button
            aria-selected={mode === value}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition",
              mode === value
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
            key={value}
            onClick={() => selectMode(value)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={16} />
            {label}
          </button>
        ))}
      </div>

      {mode === "login" || mode === "register" ? (
        <>
          <Button
            className="mt-5 w-full"
            disabled={isGoogleSubmitting || isSubmitting}
            onClick={handleGoogleSignIn}
            variant="secondary"
          >
            <GoogleIcon />
            {isGoogleSubmitting ? "Google wird geöffnet..." : "Mit Google fortfahren"}
          </Button>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">ODER MIT E-MAIL</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}

      <form
        className={cn(
          "space-y-4",
          mode === "login" || mode === "register" ? "mt-0" : "mt-6",
        )}
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">E-Mail</span>
          <input
            autoComplete="email"
            className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="deine@email.at"
            required
            type="email"
            value={email}
          />
        </label>

        {mode === "login" || mode === "register" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Passwort</span>
            <span className="relative block">
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "Mindestens 8 Zeichen" : undefined}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700"
                onClick={() => setShowPassword((current) => !current)}
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
        ) : null}

        {mode === "register" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
            <span className="relative block">
              <AtSign
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                autoComplete="username"
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                maxLength={24}
                minLength={3}
                onChange={(event) =>
                  setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="felixtravels"
                required
                value={username}
              />
            </span>
          </label>
        ) : null}

        {mode === "login" ? (
          <button
            className="-mt-2 block min-h-9 text-sm font-semibold text-blue-700 hover:text-blue-900"
            onClick={() => selectMode("recovery")}
            type="button"
          >
            Passwort vergessen?
          </button>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Einen Moment..."
            : mode === "login"
              ? "Einloggen"
              : mode === "register"
                ? "Konto erstellen"
                : mode === "recovery"
                  ? "Reset-Link senden"
                : "Magic Link senden"}
          {!isSubmitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
        </Button>
      </form>

      {confirmationEmail ? (
        <button
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-blue-700 hover:bg-blue-50"
          disabled={isResending}
          onClick={handleResend}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          {isResending ? "Wird gesendet..." : "Bestätigung erneut senden"}
        </button>
      ) : null}

      <button
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        onClick={() => selectMode(mode === "magic" ? "login" : "magic")}
        type="button"
      >
        <Mail aria-hidden="true" size={16} />
        {mode === "magic" ? "Zurück zum Login" : "Lieber einen Magic Link nutzen"}
      </button>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400">ODER</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button className="w-full" onClick={openDemo} variant="secondary">
        <Play aria-hidden="true" size={16} />
        Ohne Konto testen
      </Button>

      {message ? (
        <p
          aria-live="polite"
          className={cn(
            "mt-4 rounded-lg px-4 py-3 text-sm font-medium",
            isError ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "E-Mail oder Passwort stimmt nicht.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Deine E-Mail ist noch nicht bestätigt. Nutze Registrieren, um die Mail erneut anzufordern.";
  }
  if (normalized.includes("user already registered")) {
    return "Für diese E-Mail gibt es schon ein Konto. Wechsle zum Login.";
  }
  if (normalized.includes("database error saving new user")) {
    return "Der Username ist wahrscheinlich schon vergeben. Probiere bitte einen anderen.";
  }
  if (normalized.includes("rate limit")) {
    return "Zu viele Versuche. Warte bitte kurz und probiere es dann erneut.";
  }
  if (normalized.includes("provider") && normalized.includes("enabled")) {
    return "Google Login ist in Supabase noch nicht aktiviert.";
  }
  return "Das hat gerade nicht geklappt. Bitte versuche es noch einmal.";
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.7 4.7 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10.1 10.1 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  );
}
