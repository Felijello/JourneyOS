"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

function CallbackShell({ message }: { message: string }) {
  return (
    <main className="grid min-h-[55vh] place-items-center px-4">
      <section className="journey-card max-w-md rounded-3xl p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Loader2 className="animate-spin" size={22} />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Magic Link
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      </section>
    </main>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Login wird abgeschlossen...");

  useEffect(() => {
    let isMounted = true;

    async function finishLogin() {
      if (!isSupabaseConfigured || !supabase) {
        setMessage("Supabase ist nicht konfiguriert.");
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (isMounted) {
            setMessage(`Login konnte nicht abgeschlossen werden: ${error.message}`);
          }
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setMessage("Kein gültiger Login-Link gefunden.");
          return;
        }
      }

      if (isMounted) {
        setMessage("Login erfolgreich. JourneyOS wird geöffnet...");
        router.replace("/settings");
        router.refresh();
      }
    }

    void finishLogin();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return <CallbackShell message={message} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Login wird vorbereitet..." />}>
      <CallbackContent />
    </Suspense>
  );
}
