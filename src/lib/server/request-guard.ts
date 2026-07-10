type RateLimitEntry = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  journeyOsRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  globalStore.journeyOsRateLimits ?? new Map<string, RateLimitEntry>();
globalStore.journeyOsRateLimits = rateLimits;

export function isRateLimited(
  request: Request,
  bucket: string,
  limit: number,
  windowMs = 60_000,
) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const client = forwardedFor.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${client}`;
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export async function readJsonBody<T>(request: Request, maxBytes = 12_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    return { data: null, error: "Die Anfrage ist zu groß." } as const;
  }

  try {
    const text = await request.text();
    if (!text || new TextEncoder().encode(text).length > maxBytes) {
      return { data: null, error: "Die Anfrage ist leer oder zu groß." } as const;
    }
    return { data: JSON.parse(text) as T, error: null } as const;
  } catch {
    return { data: null, error: "Die Anfrage enthält kein gültiges JSON." } as const;
  }
}

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 12_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
