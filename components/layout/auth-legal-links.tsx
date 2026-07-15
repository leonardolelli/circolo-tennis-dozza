import Link from "next/link";

import { CLUB_LEGAL } from "@/lib/constants";

export function AuthLegalLinks() {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
      <p>
        {CLUB_LEGAL.displayName} · C.F. {CLUB_LEGAL.taxCode}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/note-legali" className="underline underline-offset-2">
          Note legali
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        <Link href="/cookie" className="underline underline-offset-2">
          Cookie Policy
        </Link>
      </div>
    </div>
  );
}
