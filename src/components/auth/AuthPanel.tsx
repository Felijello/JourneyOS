"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setIsSubmitting(false);
    setMessage(
      error
        ? error.message
        : "Magic Link wurde verschickt. Check kurz dein Postfach.",
    );
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setMessage("Du bist abgemeldet.");
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold text-graphite-950 dark:text-white">
          Authentifizierung
        </h2>
        <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
          Noch nicht aktiv, weil keine Supabase-Umgebungsvariablen gesetzt sind.
          Die App läuft deshalb im lokalen Modus.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold text-graphite-950 dark:text-white">
        Authentifizierung
      </h2>
      {user ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-graphite-600 dark:text-zinc-300">
            Angemeldet als <strong>{user.email}</strong>
          </p>
          <Button onClick={handleSignOut} variant="secondary">
            Abmelden
          </Button>
        </div>
      ) : (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleMagicLink}>
          <label className="flex-1">
            <span className="sr-only">E-Mail</span>
            <input
              className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="deine@email.at"
              type="email"
              value={email}
            />
          </label>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sende..." : "Magic Link senden"}
          </Button>
        </form>
      )}
      {message ? (
        <p className="mt-3 text-sm font-medium text-moss-700 dark:text-moss-200">
          {message}
        </p>
      ) : null}
    </section>
  );
}
