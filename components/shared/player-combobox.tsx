"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SocioPublic } from "@/lib/types";

interface PlayerComboboxProps {
  label: string;
  players: SocioPublic[];
  value: SocioPublic | null;
  onChange: (player: SocioPublic | null) => void;
  /** Excludes a player from the results, e.g. so you can't pick yourself. */
  excludeId?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Type-ahead member search. Filters the already-loaded public member list
 * in memory (no network round-trip per keystroke), which keeps it instant
 * even on a slow mobile connection.
 */
export function PlayerCombobox({
  label,
  players,
  value,
  onChange,
  excludeId,
  placeholder = "Cerca per nome o cognome...",
  disabled,
}: PlayerComboboxProps) {
  const inputId = useId();
  const [query, setQuery] = useState(
    value ? `${value.nome} ${value.cognome}` : "",
  );
  const [isOpen, setIsOpen] = useState(false);

  const candidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return players
      .filter((player) => player.id !== excludeId)
      .filter((player) => {
        if (!normalizedQuery) return true;
        const fullName = `${player.nome} ${player.cognome}`.toLowerCase();
        const reversedName = `${player.cognome} ${player.nome}`.toLowerCase();
        return (
          fullName.includes(normalizedQuery) ||
          reversedName.includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [players, query, excludeId]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-9"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            if (value) onChange(null);
          }}
        />
        {isOpen && candidates.length > 0 && (
          <ul
            onMouseDown={(event) => event.preventDefault()}
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {candidates.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value?.id === player.id && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onChange(player);
                    setQuery(`${player.nome} ${player.cognome}`);
                    setIsOpen(false);
                  }}
                >
                  <span>
                    {player.nome} {player.cognome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {player.punti} pt
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {isOpen && query.trim().length > 0 && candidates.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md">
            Nessun socio trovato.
          </div>
        )}
      </div>
    </div>
  );
}
