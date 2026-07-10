"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isChecking, setIsChecking] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(
    supabase ? null : "Supabase ist nicht verbunden.",
  );

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setIsChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setIsChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || password.length < 8) {
      setMessage("Dein neues Passwort braucht mindestens 8 Zeichen.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (error) {
      setMessage("Das Passwort konnte nicht geändert werden. Fordere bitte einen neuen Link an.");
      return;
    }

    setMessage("Passwort gespeichert. JourneyOS wird geöffnet...");
    window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 700);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-blue-600 text-white">
            <Compass aria-hidden="true" size={21} />
          </span>
          <span className="text-lg font-semibold text-slate-950">JourneyOS</span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold text-slate-950">Neues Passwort</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Wähle ein neues Passwort und du bist direkt wieder drin.
        </p>

        {isChecking ? (
          <p className="mt-6 text-sm text-slate-500">Link wird geprüft...</p>
        ) : hasSession ? (
          <form className="mt-6 space-y-4" onSubmit={updatePassword}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Neues Passwort</span>
              <span className="relative block">
                <input
                  autoComplete="new-password"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400"
                  onClick={() => setShowPassword((current) => !current)}
                  title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <Button className="w-full" disabled={isSaving} type="submit">
              <KeyRound aria-hidden="true" size={17} />
              {isSaving ? "Speichere..." : "Passwort speichern"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Der Link ist ungültig oder abgelaufen. Fordere auf der Login-Seite einen neuen an.
          </div>
        )}

        {message ? (
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{message}</p>
        ) : null}
      </section>
    </main>
  );
}
