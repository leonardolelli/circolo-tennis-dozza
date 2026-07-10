import { ImageResponse } from "next/og";

import { OG_IMAGE_SIZE, OgImageContent } from "@/lib/og-image-content";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<OgImageContent />, size);
}
