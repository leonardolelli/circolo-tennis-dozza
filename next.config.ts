import type { NextConfig } from "next";

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
};

export default nextConfig;
