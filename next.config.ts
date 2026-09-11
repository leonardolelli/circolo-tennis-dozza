import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * The CSP is deliberately pragmatic for a Next.js App Router app:
 * - `script-src 'unsafe-inline'` is required by Next's inline bootstrap
 *   scripts (no nonce pipeline); `'unsafe-eval'` is only added in dev, where
 *   the dev bundler needs it.
 * - `connect-src` allows the Supabase project (REST calls + Realtime socket).
 * - `img-src` allows `https:` because sponsor logos are admin-supplied
 *   external URLs rendered with a plain `<img>`.
 * - `frame-ancestors 'none'` together with `X-Frame-Options: DENY` blocks
 *   clickjacking.
 */
const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Only our own trusted, hand-authored local illustrations (see
    // /public/images) are ever served as SVG through next/image. Sponsor
    // logos come from admin-supplied external URLs and are intentionally
    // rendered with a plain <img> tag instead (see sponsor-section.tsx) so
    // untrusted remote SVG markup never goes through the image optimizer.
    // The strict CSP below sandboxes any SVG response as an extra layer of
    // defense, per Next.js' documented recommendation.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // Apply to every route (pages, route handlers, static assets).
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
