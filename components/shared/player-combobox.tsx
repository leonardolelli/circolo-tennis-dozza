"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SocioPublic } from "@/lib/types";

interface PlayerComboboxProps {
  /** Visible label above the field. Omit it when the field needs no label. */
  label?: string;
  players: SocioPublic[];
  value: SocioPublic | null;
  onChange: (player: SocioPublic | null) => void;
  /** Excludes a player from the results, e.g. so you can't pick yourself. */
  excludeId?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Max height of the dropdown list in pixels (roughly 8 rows on mobile). */
const LIST_MAX_HEIGHT = 288;
/** Height kept for the list so a few rows always stay visible. */
const LIST_MIN_HEIGHT = 160;
/** Gap between the input and the list. */
const LIST_OFFSET = 4;
/** Safe distance from the viewport edges. */
const VIEWPORT_MARGIN = 8;

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
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(
    value ? `${value.nome} ${value.cognome}` : "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [listStyle, setListStyle] = useState<CSSProperties | null>(null);
  const pointerIntentRef = useRef(false);

  useEffect(() => {
    setQuery(value ? `${value.nome} ${value.cognome}` : "");
  }, [value]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  // If the typed text exactly matches a single player's full name
  // (either "Nome Cognome" or "Cognome Nome"), resolve it immediately.
  // This lets users type the full name instead of having to pick it from
  // the dropdown, e.g. the one-tap challenge flow on mobile.
  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || value) return;
    const exactMatches = players.filter(
      (player) =>
        player.id !== excludeId &&
        (`${player.nome} ${player.cognome}`.toLowerCase() === normalizedQuery ||
          `${player.cognome} ${player.nome}`.toLowerCase() === normalizedQuery),
    );
    if (exactMatches.length === 1) {
      onChange(exactMatches[0]);
    }
  }, [players, query, excludeId, value, onChange]);

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

  // The list uses `position: fixed` so it can overflow the modal body: per the
  // CSS spec a fixed box is not clipped by the `overflow` of ancestors below
  // its containing block (the viewport), which the scrollable modal body would
  // otherwise do. Because of that we position it manually, keeping it inside
  // the viewport and flipping it above the input when there is not enough room
  // below. It must stay in the modal's DOM subtree (no portal) so the modal
  // still treats taps on it as "inside" and does not close.
  const updateListStyle = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const openUp = spaceBelow < LIST_MIN_HEIGHT && spaceAbove > spaceBelow;
    const available = Math.max(
      openUp ? spaceAbove : spaceBelow,
      LIST_MIN_HEIGHT,
    );
    setListStyle({
      position: "fixed",
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left, window.innerWidth - rect.width - VIEWPORT_MARGIN),
      ),
      width: rect.width,
      maxHeight: Math.min(LIST_MAX_HEIGHT, available),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + LIST_OFFSET }
        : { top: rect.bottom + LIST_OFFSET }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateListStyle();
    window.addEventListener("resize", updateListStyle);
    window.addEventListener("scroll", updateListStyle, true);
    return () => {
      window.removeEventListener("resize", updateListStyle);
      window.removeEventListener("scroll", updateListStyle, true);
    };
  }, [isOpen, updateListStyle]);

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div ref={anchorRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          disabled={disabled}
          aria-label={label ? undefined : placeholder}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-9"
          onPointerDown={() => {
            pointerIntentRef.current = true;
          }}
          onFocus={() => {
            if (pointerIntentRef.current || query.trim().length > 0) {
              setIsOpen(true);
            }
            pointerIntentRef.current = false;
          }}
          onBlur={() => {
            pointerIntentRef.current = false;
            setTimeout(() => setIsOpen(false), 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            if (value) onChange(null);
          }}
        />
        {isOpen && candidates.length > 0 && listStyle && (
          <ul
            style={listStyle}
            onMouseDown={(event) => event.preventDefault()}
            className="z-30 overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
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
          <div
            style={listStyle ?? undefined}
            className="z-30 rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md"
          >
            Nessun giocatore trovato.
          </div>
        )}
      </div>
    </div>
  );
}
