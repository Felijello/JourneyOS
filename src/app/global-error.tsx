"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-950">
        <main className="max-w-md text-center">
          <p className="text-sm font-semibold text-blue-600">JourneyOS</p>
          <h1 className="mt-3 text-2xl font-semibold">Da ist etwas schiefgelaufen.</h1>
          <p className="mt-3 text-sm text-slate-600">Deine Daten bleiben erhalten. Versuch es bitte noch einmal.</p>
          <button className="mt-6 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={reset} type="button">
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
