import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthLegalLinks } from "@/components/layout/auth-legal-links";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center px-6 py-10 md:items-center md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
        <AuthLegalLinks />
      </div>
    </div>
  );
}
