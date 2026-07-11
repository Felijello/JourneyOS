import { Compass } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-blue-600 text-white">
            <Compass aria-hidden="true" size={22} />
          </span>
          <span className="text-lg font-semibold text-slate-950">JourneyOS</span>
        </div>
        <p className="mt-8 text-sm font-semibold text-blue-600">Fast geschafft</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">Mach dein Profil zu deinem.</h1>
        <p className="mt-3 mb-8 max-w-xl text-sm leading-6 text-slate-600">
          Dein Username ist deine Adresse in der JourneyOS Community. Alles andere kannst du jederzeit ändern.
        </p>
        <ProfileForm onboarding />
      </section>
    </main>
  );
}
