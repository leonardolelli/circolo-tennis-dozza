import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a safe same-origin relative path (e.g. "/admin") or `null` when the
 * value is not one. Used to validate `?redirect=` / `?next=` parameters so a
 * crafted link can never turn into an open redirect: absolute URLs
 * ("https://evil.com"), protocol-relative URLs ("//evil.com"), backslash
 * tricks ("/\\evil.com") and header-injected control characters are rejected.
 */
export function safeInternalPath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const path = value.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  if (path.includes("\\")) return null;
  if (/[\u0000-\u001F\u007F]/.test(path)) return null;

  return path;
}

/**
 * Returns an absolute `http(s)` URL or `null`. Used as a defense-in-depth
 * guard for values stored in the database (e.g. sponsor links) before they are
 * rendered into an `href`, so a `javascript:` / `data:` URL can never execute
 * code on the public site.
 */
export function safeExternalUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
