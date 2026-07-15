import Link from "next/link";

import { CLUB_LEGAL } from "@/lib/constants";
import { CurrentYear } from "@/components/layout/current-year";

/**
 * Public legal footer shown on member-facing pages.
 * Keep legal data in constants.ts to avoid duplicated literals.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-4 py-3 pb-20 text-[10px] leading-4 text-muted-foreground sm:px-10 sm:py-4 sm:pb-4 sm:text-[11px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p>{CLUB_LEGAL.displayName}©<CurrentYear /></p>
        </div>

        <p>
          Sede: {CLUB_LEGAL.registeredOffice} · C.F. {CLUB_LEGAL.taxCode}
          {CLUB_LEGAL.vatNumber ? ` · P. IVA ${CLUB_LEGAL.vatNumber} ` : " "}
          {CLUB_LEGAL.rasdNumber ? ` · RASD ${CLUB_LEGAL.rasdNumber} ` : " "}
          · Privacy:{" "}
          <a
            href={`mailto:${CLUB_LEGAL.privacyEmail}`}
            className="underline underline-offset-2"
          >
            {CLUB_LEGAL.privacyEmail}
          </a>
          {CLUB_LEGAL.pecEmail ? (
            <>
              {" "}· PEC:{" "}
              <a
                href={`mailto:${CLUB_LEGAL.pecEmail}`}
                className="underline underline-offset-2"
              >
                {CLUB_LEGAL.pecEmail}
              </a>
            </>
          ) : null}
        </p>

        <nav
          aria-label="Link legali"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs"
        >
          <Link href="/note-legali" className="underline underline-offset-2">
            Note legali
          </Link>
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/cookie" className="underline underline-offset-2">
            Cookie Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
