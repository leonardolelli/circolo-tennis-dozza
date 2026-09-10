import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { AuthLegalLinks } from "@/components/layout/auth-legal-links";
import { CLUB_NAME } from "@/lib/constants";

export const metadata = {
  title: "Accedi",
};

/**
 * The login form is intentionally anchored to the top of the viewport: on
 * phones the on-screen keyboard covers a big part of the screen, so the
 * username/password fields must stay visible while typing. The branding moves
 * below the form and the legal links stay pinned to the bottom of the screen.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center bg-sidebar px-4 py-4 text-sidebar-foreground sm:px-6 sm:py-10 md:p-10">
      <main className="flex w-full max-w-sm flex-1 flex-col items-center">
        <Suspense>
          <LoginForm className="w-full" />
        </Suspense>
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tennis text-lg font-bold text-tennis-foreground">
            CT
          </span>
          <h1 className="text-base font-semibold sm:text-xl">{CLUB_NAME}</h1>
          <p className="text-sm text-sidebar-foreground/60">
            Accedi come giocatore del circolo
          </p>
        </div>
      </main>
      <div className="mt-auto w-full max-w-sm">
        <AuthLegalLinks />
      </div>
    </div>
  );
}
