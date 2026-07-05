import { MapPinned } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionHref = "/countries/new",
  actionLabel = "Erstes Land hinzufügen",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-moss-100 text-moss-700 dark:bg-moss-400/15 dark:text-moss-200">
        <MapPinned aria-hidden="true" size={22} />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-graphite-950 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graphite-600 dark:text-zinc-300">
        {description}
      </p>
      <LinkButton className="mt-6" href={actionHref}>
        {actionLabel}
      </LinkButton>
    </section>
  );
}

