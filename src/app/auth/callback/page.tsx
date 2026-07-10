"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type CallbackStatus = "loading" | "success" | "error";

function CallbackShell({
  message,
  status,
  onContinue,
}: {
  message: string;
  status: CallbackStatus;
  onContinue?: () => void;
}) {
  const Icon =
    status === "loading" ? Loader2 : status === "success" ? CheckCircle2 : XCircle;
  const title =
    status === "loading"
      ? "Zugang wird bestätigt"
      : status === "success"
        ? "E-Mail bestätigt"
        : "Link nicht gültig";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-card sm:p-8">
        <span className="mx-auto grid size-11 place-items-center rounded-lg bg-blue-600 text-white">
          <Compass aria-hidden="true" size={22} />
        </span>
        <div
          className={`mx-auto mt-8 grid size-14 place-items-center rounded-full ${
            status === "success"
              ? "bg-emerald-50 text-emerald-600"
              : status === "error"
                ? "bg-rose-50 text-rose-600"
                : "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon aria-hidden="true" className={status === "loading" ? "animate-spin" : ""} size={27} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {status === "success" && onContinue ? (
          <Button className="mt-6 w-full" onClick={onContinue}>
            JourneyOS öffnen
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        ) : null}
      </section>
    </main>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Einen kurzen Moment...");

  useEffect(() => {
    let isMounted = true;

    async function finishLogin() {
      if (!isSupabaseConfigured || !supabase) {
        setStatus("error");
        setMessage("JourneyOS kann Supabase gerade nicht erreichen.");
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashError = hashParams.get("error_description");
      const flowType = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (window.location.hash) {
        window.history.replaceState(null, "", "/auth/callback");
      }

      if (hashError) {
        if (isMounted) {
          setStatus("error");
          setMessage("Der Link ist abgelaufen oder wurde bereits verwendet. Fordere bitte einen neuen an.");
        }
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          if (isMounted) {
            setStatus("error");
            setMessage("Die Bestätigung konnte nicht abgeschlossen werden. Fordere bitte einen neuen Link an.");
          }
          return;
        }

        if (flowType === "recovery") {
          router.replace("/reset-password");
          router.refresh();
          return;
        }
      } else {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState(null, "", "/auth/callback");
          if (error) {
            if (isMounted) {
              setStatus("error");
              setMessage("Der Link ist abgelaufen oder wurde bereits verwendet.");
            }
            return;
          }
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            if (isMounted) {
              setStatus("error");
              setMessage("Kein gültiger Bestätigungslink gefunden.");
            }
            return;
          }
        }
      }

      if (isMounted) {
        setStatus("success");
        setMessage("Alles erledigt. Deine E-Mail ist bestätigt und dein Konto ist bereit.");
      }
    }

    void finishLogin();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <CallbackShell
      message={message}
      onContinue={() => {
        router.replace("/");
        router.refresh();
      }}
      status={status}
    />
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <CallbackShell message="Einen kurzen Moment..." status="loading" />
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
