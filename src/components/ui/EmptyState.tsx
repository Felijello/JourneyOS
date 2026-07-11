import { MapPinned } from "lucide-react";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionHref = "/countries/new",
  actionLabel = "Erstes Land hinzufügen",
  icon,
  hideAction = false,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  hideAction?: boolean;
}) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
        {icon ?? <MapPinned aria-hidden="true" size={22} />}
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {!hideAction ? (
        <LinkButton className="mt-6" href={actionHref}>
          {actionLabel}
        </LinkButton>
      ) : null}
    </section>
  );
}
