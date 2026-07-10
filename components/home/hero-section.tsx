import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CLUB_NAME, CLUB_TAGLINE } from "@/lib/constants";

/**
 * Full-bleed hero. Uses a local, hand-authored SVG illustration through
 * next/image (see next.config.ts for the SVG security settings) as a
 * placeholder for real club photography - swap `/images/hero-court.svg`
 * for an actual photo of the club whenever one is available; the layout
 * (fill + object-cover + dark scrim) works the same for either.
 */
export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[520px] w-full items-end overflow-hidden sm:min-h-[600px]">
      <Image
        src="/images/hero-court.svg"
        alt="Campo da tennis del circolo"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

      <div className="relative z-10 flex w-full flex-col gap-6 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16">
        <span className="inline-flex w-fit animate-fade-in items-center gap-2 rounded-full bg-tennis/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-tennis-foreground">
          <Trophy className="h-3.5 w-3.5" />
          Community &amp; sfide tutto l&apos;anno
        </span>
        <h1 className="max-w-2xl animate-fade-in text-4xl font-bold leading-tight tracking-tight [animation-delay:100ms] sm:text-5xl lg:text-6xl">
          {CLUB_NAME}
        </h1>
        <p className="max-w-xl animate-fade-in text-base text-white/80 [animation-delay:200ms] sm:text-lg">
          {CLUB_TAGLINE}
        </p>
        <div className="flex animate-fade-in flex-wrap gap-3 [animation-delay:300ms]">
          <Button
            asChild
            size="lg"
            className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
          >
            <Link href="/classifica">
              Vedi la classifica
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
