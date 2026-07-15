"use client";

import { useEffect, useState } from "react";

/**
 * Client-only current year to avoid using new Date() in Server Components.
 */
export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <>{year ?? ""}</>;
}
