"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authEmailForUsername } from "@/lib/constants";
import { getPostLoginPath } from "@/app/actions/auth";

/**
 * Member/admin login. Members type their club-assigned username (the auth
 * email is derived from it - see lib/constants.ts authEmailForUsername), so
 * no email is ever shown or asked. Password resets are done by the manager
 * from /admin/soci, so there is no "forgot password" self-service here.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const email = authEmailForUsername(username);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const redirect = searchParams.get("redirect");
      const path = redirect ?? (await getPostLoginPath());

      // Navigate with a full page load instead of the client-side router: the
      // fresh session cookie is guaranteed to be sent with the next request
      // and the destination is rendered server-side, which avoids the screen
      // getting stuck right after a successful login.
      window.location.replace(path);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Si è verificato un errore";
      setError(
        /invalid login credentials/i.test(message)
          ? "Username o password non corretti."
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl">Accedi</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="es. mario.rossi"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Non hai le credenziali? Contatta l&apos;amministratore del
                circolo.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
