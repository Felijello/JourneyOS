import { Compass, MapPin, Sparkles } from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=88')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/45" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-end gap-8 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1fr_460px] lg:items-center lg:px-8 lg:py-10">
        <section className="hidden max-w-2xl text-white lg:block">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-white/15 backdrop-blur-xl">
              <Compass aria-hidden="true" size={23} />
            </span>
            <span className="text-xl font-semibold">JourneyOS</span>
          </div>
          <h2 className="mt-12 max-w-xl text-5xl font-semibold leading-tight">
            Deine Welt. Deine Pläne. Alles an einem Ort.
          </h2>
          <div className="mt-8 flex gap-6 text-sm font-medium text-white/85">
            <span className="flex items-center gap-2">
              <MapPin aria-hidden="true" size={17} />
              Länder & Orte
            </span>
            <span className="flex items-center gap-2">
              <Sparkles aria-hidden="true" size={17} />
              Reiseideen mit AI
            </span>
          </div>
        </section>

        <section className="w-full rounded-lg border border-white/50 bg-white p-5 shadow-large sm:p-8">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-lg bg-blue-600 text-white">
              <Compass aria-hidden="true" size={21} />
            </span>
            <span className="text-lg font-semibold text-slate-950">JourneyOS</span>
          </div>
          <AuthPanel />
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Deine privaten Reisedaten bleiben nur für dich sichtbar.
          </p>
        </section>
      </div>
    </main>
  );
}
