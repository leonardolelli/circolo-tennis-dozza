import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { CLUB_NAME } from "@/lib/constants";

export const metadata = {
  title: "Accedi",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-sidebar p-6 text-sidebar-foreground md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tennis text-lg font-bold text-tennis-foreground">
            CT
          </span>
          <h1 className="text-xl font-semibold">{CLUB_NAME}</h1>
          <p className="text-sm text-sidebar-foreground/60">
            Area riservata amministratori
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
