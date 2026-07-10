import { Suspense } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { SponsorSection } from "@/components/home/sponsor-section";
import { ContactSection } from "@/components/home/contact-section";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <Suspense fallback={null}>
        <SponsorSection />
      </Suspense>
      <Separator className="mx-auto max-w-6xl" />
      <ContactSection />
    </div>
  );
}
