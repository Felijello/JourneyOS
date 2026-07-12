"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Globe2, Loader2, MapPin, Save } from "lucide-react";
import { DestinationAutocomplete } from "@/components/travel/DestinationAutocomplete";
import { CoverUploader, type CoverCrop } from "@/components/trips/CoverUploader";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/images/compress-image";
import { supabase } from "@/lib/supabase/client";
import type { TripFormInput, TripStatus } from "@/types/country";
import type { DestinationSuggestion } from "@/types/location";

const draftKey = "journeyos:trip-draft:v2";
const totalSteps = 5;
const initialInput: TripFormInput = {
  title: "", countryId: null, startDate: "", endDate: "", status: "planned",
  budgetEstimate: null, currency: "EUR", travelStyle: "", visibility: "private",
  destinationName: "", destinationCity: null, destinationRegion: null,
  destinationCountryName: null, destinationCountryCode: null,
  destinationLatitude: null, destinationLongitude: null, destinationExternalId: null,
  description: "", highlights: [], coverPhotoUrl: null, coverStoragePath: null,
  coverPositionX: 50, coverPositionY: 50, coverZoom: 1, countries: [], notes: "",
};

export function TripWizard() {
  const router = useRouter();
  const { createTrip, uploadTripCover, isDemoMode } = useTravel();
  const [step, setStep] = useState(1);
  const [input, setInput] = useState(initialInput);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<CoverCrop>({ positionX: 50, positionY: 50, zoom: 1 });
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [draftState, setDraftState] = useState<"saved" | "saving" | "error">("saved");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadDraft() {
      try {
        const local = window.localStorage.getItem(draftKey);
        if (local) {
          const parsed = JSON.parse(local) as { input?: TripFormInput; step?: number };
          if (parsed.input && active) {
            setInput({ ...initialInput, ...parsed.input, countries: parsed.input.countries ?? [] });
            setDestinationQuery(parsed.input.destinationName ?? "");
            setDestinationSelected(Boolean(parsed.input.destinationCountryCode));
            setStep(Math.min(totalSteps, Math.max(1, parsed.step ?? 1)));
          }
        }
        if (!isDemoMode && supabase) {
          const { data } = await supabase.from("trip_drafts").select("draft_data,current_step").maybeSingle();
          const remote = data?.draft_data as TripFormInput | undefined;
          if (remote && active) {
            setInput({ ...initialInput, ...remote, countries: remote.countries ?? [] });
            setDestinationQuery(remote.destinationName ?? "");
            setDestinationSelected(Boolean(remote.destinationCountryCode));
            setStep(data?.current_step ?? 1);
          }
        }
      } finally {
        if (active) setIsLoadingDraft(false);
      }
    }
    void loadDraft();
    return () => { active = false; };
  }, [isDemoMode]);

  useEffect(() => {
    if (isLoadingDraft) return;
    const timer = window.setTimeout(async () => {
      setDraftState("saving");
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ input, step }));
        if (!isDemoMode && supabase) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error: saveError } = await supabase.from("trip_drafts").upsert({
              user_id: userData.user.id, draft_data: input, current_step: step,
            });
            if (saveError) throw saveError;
          }
        }
        setDraftState("saved");
      } catch { setDraftState("error"); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [input, isDemoMode, isLoadingDraft, step]);

  const duration = useMemo(() => {
    if (!input.startDate || !input.endDate || input.endDate < input.startDate) return null;
    return Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86_400_000) + 1;
  }, [input.endDate, input.startDate]);

  function selectDestination(destination: DestinationSuggestion) {
    const country = {
      countryCode: destination.countryCode, countryName: destination.countryName,
      continent: destination.continent, latitude: destination.latitude,
      longitude: destination.longitude, source: "destination" as const,
    };
    setDestinationQuery(destination.displayName);
    setDestinationSelected(true);
    setInput((current) => ({ ...current, destinationName: destination.displayName,
      destinationCity: destination.city, destinationRegion: destination.region,
      destinationCountryName: destination.countryName, destinationCountryCode: destination.countryCode,
      destinationLatitude: destination.latitude, destinationLongitude: destination.longitude,
      destinationExternalId: destination.externalId, countries: [country], countryId: null }));
  }

  function validateCurrentStep() {
    if (step === 1 && (!destinationSelected || !input.destinationCountryCode)) return "Bitte wähle ein Reiseziel aus den Vorschlägen.";
    if (step === 2 && (!input.startDate || !input.endDate)) return "Bitte wähle Start- und Enddatum.";
    if (step === 2 && input.endDate! < input.startDate!) return "Das Enddatum darf nicht vor dem Startdatum liegen.";
    if (step === 4 && !input.title.trim()) return "Gib deiner Reise einen Namen.";
    return null;
  }

  function next() {
    const issue = validateCurrentStep();
    if (issue) return setError(issue);
    setError(null);
    setStep((current) => Math.min(totalSteps, current + 1));
  }

  async function finish() {
    if (submitLock.current) return;
    const issue = !input.title.trim() ? "Gib deiner Reise einen Namen." : validateCurrentStep();
    if (issue) return setError(issue);
    submitLock.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await createTrip({ ...input, title: input.title.trim(), visibility: input.status === "completed" ? input.visibility : "private" });
      if (coverFile) await uploadTripCover(saved.id, coverFile, crop, saved);
      window.localStorage.removeItem(draftKey);
      if (!isDemoMode && supabase) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          await supabase.from("trip_drafts").delete().eq("user_id", authData.user.id);
        }
      }
      router.replace(`/trips/${saved.id}?tab=overview`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Die Reise konnte nicht gespeichert werden.");
      submitLock.current = false;
      setIsSaving(false);
    }
  }

  if (isLoadingDraft) return <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-blue-600">Schritt {step} von {totalSteps}</p><p className="mt-1 text-xs text-slate-500">{draftState === "saving" ? "Entwurf wird gespeichert..." : draftState === "error" ? "Entwurf konnte nicht gespeichert werden" : "Entwurf gespeichert"}</p></div>
        <span className="text-sm font-semibold text-slate-500">{Math.round((step / totalSteps) * 100)}%</span>
      </div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} /></div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {error ? <p className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
        {step === 1 ? <div><StepTitle icon={<MapPin />} title="Wohin geht die Reise?" text="Suche eine Stadt, Region oder ein Land." /><DestinationAutocomplete isSelection={destinationSelected} onQueryChange={(query) => { setDestinationQuery(query); if (query !== input.destinationName) setDestinationSelected(false); }} onSelect={selectDestination} query={destinationQuery} /></div> : null}
        {step === 2 ? <div><StepTitle icon={<CalendarDays />} title="Wann bist du unterwegs?" text="Die Reisedauer berechnet JourneyOS automatisch." /><div className="grid gap-4 sm:grid-cols-2"><DateField label="Startdatum" value={input.startDate ?? ""} onChange={(value) => setInput({ ...input, startDate: value })} /><DateField label="Enddatum" min={input.startDate ?? undefined} value={input.endDate ?? ""} onChange={(value) => setInput({ ...input, endDate: value })} /></div>{duration ? <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{duration} {duration === 1 ? "Reisetag" : "Reisetage"}</p> : null}</div> : null}
        {step === 3 ? <div><StepTitle icon={<Globe2 />} title="Status und Sichtbarkeit" text="Du kannst beides später jederzeit ändern." /><div className="grid gap-3 sm:grid-cols-3">{([['planned','Geplant'],['active','Aktuell'],['completed','Abgeschlossen']] as const).map(([value,label]) => <Choice key={value} active={input.status === value} label={label} onClick={() => setInput({ ...input, status: value as TripStatus, visibility: value === 'completed' ? input.visibility : 'private' })} />)}</div><h3 className="mt-7 text-sm font-semibold text-slate-900">Sichtbarkeit</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><Choice active={input.visibility === 'private'} label="Privat" description="Nur für dich" onClick={() => setInput({ ...input, visibility: 'private' })} /><Choice active={input.visibility === 'public'} disabled={input.status !== 'completed'} label="Öffentlich" description={input.status === 'completed' ? 'Auf Profil und Entdecken' : 'Nur abgeschlossene Reisen'} onClick={() => setInput({ ...input, visibility: 'public' })} /></div></div> : null}
        {step === 4 ? <div><StepTitle icon={<Save />} title="Gib deiner Reise einen Namen" text="Ein Cover ist optional und kann später geändert werden." /><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Name der Reise</span><input autoFocus className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" maxLength={120} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="z. B. Sommer in Portugal" value={input.title} /></label><div className="mt-6"><CoverUploader crop={crop} currentUrl={null} file={coverFile} onCropChange={setCrop} onFileChange={async (file) => { if (!file) return setCoverFile(null); try { setCoverFile(await compressImage(file)); setError(null); } catch (imageError) { setError(imageError instanceof Error ? imageError.message : 'Bild konnte nicht verarbeitet werden.'); } }} onRemove={() => setCoverFile(null)} /></div></div> : null}
        {step === 5 ? <div><StepTitle icon={<Check />} title="Alles bereit" text="Prüfe kurz deine Angaben. Details ergänzt du danach in der Reise." /><dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">{[["Reise", input.title],["Ziel", input.destinationName],["Zeitraum", `${input.startDate} bis ${input.endDate}`],["Dauer", `${duration ?? 0} Tage`],["Status", input.status === 'active' ? 'Aktuell' : input.status === 'completed' ? 'Abgeschlossen' : 'Geplant'],["Sichtbarkeit", input.visibility === 'public' ? 'Öffentlich' : 'Privat']].map(([label,value]) => <div className="flex gap-4 px-4 py-3" key={label}><dt className="w-28 text-sm text-slate-500">{label}</dt><dd className="flex-1 text-sm font-semibold text-slate-900">{value}</dd></div>)}</dl></div> : null}
        <div className="mt-8 flex gap-3 border-t border-slate-100 pt-5">{step > 1 ? <Button onClick={() => { setError(null); setStep((current) => current - 1); }} variant="secondary"><ArrowLeft size={17} />Zurück</Button> : null}<Button className="ml-auto" disabled={isSaving} onClick={step === totalSteps ? finish : next}>{isSaving ? <Loader2 className="animate-spin" size={17} /> : step === totalSteps ? <Save size={17} /> : null}{step === totalSteps ? (input.visibility === 'public' ? 'Reise veröffentlichen' : 'Reise speichern') : <>Weiter<ArrowRight size={17} /></>}</Button></div>
      </div>
    </section>
  );
}

function StepTitle({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="mb-6"><span className="mb-4 grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-700">{icon}</span><h2 className="text-2xl font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>; }
function DateField({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3" min={min} onChange={(event) => onChange(event.target.value)} type="date" value={value} /></label>; }
function Choice({ active, disabled, label, description, onClick }: { active: boolean; disabled?: boolean; label: string; description?: string; onClick: () => void }) { return <button className={`min-h-20 rounded-lg border p-4 text-left transition ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white'} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-300'}`} disabled={disabled} onClick={onClick} type="button"><span className="flex items-center gap-2 text-sm font-semibold text-slate-900">{label}{active ? <Check className="ml-auto text-blue-600" size={17} /> : null}</span>{description ? <span className="mt-1 block text-xs text-slate-500">{description}</span> : null}</button>; }
