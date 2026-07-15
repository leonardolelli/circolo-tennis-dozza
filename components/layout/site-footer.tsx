import Link from "next/link";

import { CLUB_LEGAL } from "@/lib/constants";

/**
 * Public legal footer shown on member-facing pages.
 * Keep legal data in constants.ts to avoid duplicated literals.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 pb-24 text-[11px] leading-5 text-muted-foreground sm:px-10 sm:py-5 sm:pb-5 sm:text-xs">
        <p className="font-medium text-foreground">{CLUB_LEGAL.displayName}</p>

        <div className="grid gap-0.5">
          <p>Sede: {CLUB_LEGAL.registeredOffice}</p>
          <p>
            C.F. {CLUB_LEGAL.taxCode}
            {CLUB_LEGAL.vatNumber ? ` | P. IVA ${CLUB_LEGAL.vatNumber}` : ""}
          </p>
          {CLUB_LEGAL.rasdNumber ? (
            <p>Iscrizione RASD: {CLUB_LEGAL.rasdNumber}</p>
          ) : null}
          <p>
            Email privacy:{" "}
            <a
              href={`mailto:${CLUB_LEGAL.privacyEmail}`}
              className="underline underline-offset-2"
            >
              {CLUB_LEGAL.privacyEmail}
            </a>
          </p>
          {CLUB_LEGAL.pecEmail ? (
            <p>
              PEC:{" "}
              <a
                href={`mailto:${CLUB_LEGAL.pecEmail}`}
                className="underline underline-offset-2"
              >
                {CLUB_LEGAL.pecEmail}
              </a>
            </p>
          ) : null}
        </div>

        <nav
          aria-label="Link legali"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
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
