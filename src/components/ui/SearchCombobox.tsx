"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function SearchCombobox<T>({
  label,
  placeholder,
  query,
  endpoint,
  getKey,
  renderOption,
  onQueryChange,
  onSelect,
  minimumLength = 2,
  noResultsText = "Keine passenden Ergebnisse gefunden.",
  isSelection = false,
}: {
  label: string;
  placeholder: string;
  query: string;
  endpoint: string;
  getKey: (item: T) => string;
  renderOption: (item: T) => React.ReactNode;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => void;
  minimumLength?: number;
  noResultsText?: string;
  isSelection?: boolean;
}) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const normalized = query.trim();
    if (isSelection) return;
    if (normalized.length < minimumLength) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { results?: T[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Suche fehlgeschlagen.");
        setResults(payload.results ?? []);
        setActiveIndex(-1);
        setIsOpen(true);
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : "Suche fehlgeschlagen.");
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, isSelection, minimumLength, query]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function choose(item: T) {
    onSelect(item);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block" htmlFor={`${id}-input`}>
        <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
        <span className="relative block">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls={`${id}-listbox`}
            aria-expanded={isOpen}
            autoComplete="off"
            className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-11 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            id={`${id}-input`}
            onChange={(event) => {
              const nextQuery = event.target.value;
              if (nextQuery.trim().length < minimumLength) {
                setResults([]);
                setIsOpen(false);
                setError(null);
              }
              onQueryChange(nextQuery);
            }}
            onFocus={() => !isSelection && query.trim().length >= minimumLength && setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((index) => Math.min(index + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                choose(results[activeIndex]);
              } else if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder={placeholder}
            role="combobox"
            value={query}
          />
          {isLoading ? <LoaderCircle aria-label="Suche läuft" className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={18} /> : null}
        </span>
      </label>

      {isOpen ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <ul className="max-h-72 overflow-y-auto p-1.5" id={`${id}-listbox`} role="listbox">
            {error ? <li className="px-3 py-3 text-sm text-rose-700">{error}</li> : null}
            {!error && !isLoading && results.length === 0 ? (
              <li className="px-3 py-3 text-sm text-slate-500">{noResultsText}</li>
            ) : null}
            {results.map((item, index) => (
              <li
                aria-selected={activeIndex === index}
                className={`cursor-pointer rounded-md px-3 py-2.5 text-sm ${activeIndex === index ? "bg-blue-50" : "hover:bg-slate-50"}`}
                id={`${id}-option-${index}`}
                key={getKey(item)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
                role="option"
              >
                {renderOption(item)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
