"use server";

import { getCurrentAdmin } from "@/lib/auth";

/**
 * Landing path after a successful login when no `?redirect=` was provided:
 * admins go to the management area, everyone else to the classifica.
 */
export async function getPostLoginPath(): Promise<string> {
  const status = await getCurrentAdmin();
  return status.ok ? "/admin" : "/classifica";
}
