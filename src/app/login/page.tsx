import { AuthPanel } from "@/components/auth/AuthPanel";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl py-6 sm:py-12">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold text-blue-600">JourneyOS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Deine Reisen. Ein Zuhause.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sichere deine Länder, Orte, Trips und Fotos dauerhaft oder starte direkt
          mit der Demo.
        </p>
      </div>
      <AuthPanel />
    </div>
  );
}
