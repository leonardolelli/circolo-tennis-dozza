/**
 * Club-wide constants that are not (yet) worth a database table. Update
 * these values to match the real club details before going live.
 */
export const CLUB_NAME = "Circolo Tennis Dozza";

export const CLUB_TAGLINE =
  "Il cuore del tennis a Dozza: campi, community e sfide per tutti i livelli.";

export const CLUB_CONTACT = {
  /** Displayed phone number, also used for the "Chiama" quick action. */
  phoneDisplay: "+39 051 123 4567",
  /** E.164-ish value used to build the tel: link. */
  phoneHref: "+390511234567",
  /** Number used for the WhatsApp quick action (Italian mobile, no "+"). */
  whatsappNumber: "393331234567",
  email: "segreteria@circolotennisdozza.it",
  address: "Via dello Sport 1, 40060 Dozza (BO)",
} as const;

export const SITE_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/classifica", label: "Classifica" },
] as const;
