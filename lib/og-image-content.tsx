import { CLUB_NAME, CLUB_TAGLINE } from "@/lib/constants";

/** Standard Open Graph / Twitter card image size. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Shared JSX tree rendered by both app/opengraph-image.tsx and
 * app/twitter-image.tsx via next/og's `ImageResponse`. Kept outside `app/`
 * so it isn't picked up as a route convention file itself.
 */
export function OgImageContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 24,
        padding: 80,
        background: "linear-gradient(135deg, #111318 0%, #1b1e25 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 96,
          height: 96,
          borderRadius: 9999,
          background: "#5b9a1c",
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        CT
      </div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#ffffff" }}>
        {CLUB_NAME}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "rgba(255,255,255,0.75)",
          maxWidth: 900,
        }}
      >
        {CLUB_TAGLINE}
      </div>
    </div>
  );
}
