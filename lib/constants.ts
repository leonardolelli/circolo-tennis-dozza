/**
 * Club-wide constants that are not (yet) worth a database table. Update
 * these values to match the real club details before going live.
 */
export const CLUB_NAME = "POLISPORTIVA VIRTUS DOZZA ROUTIER ASSOCIAZIONE SPORTIVA DILETTANTISTICA";

export const CLUB_TAGLINE =
  "Il cuore del tennis a Dozza: campi, community e sfide per tutti i livelli.";

export const CLUB_CONTACT = {
  /** Displayed phone number, also used for the "Chiama" quick action. */
  phoneDisplay: "+393425591296",
  /** E.164-ish value used to build the tel: link. */
  phoneHref: "+393425591296",
  /** Number used for the WhatsApp quick action (Italian mobile, no "+"). */
  whatsappNumber: "3425591296",
  email: "virtus2000asd.dozza@gmail.com",
  address: "Via Monte del Re 20, 40060 Dozza (BO)",
  instagram: "https://www.instagram.com/tennis_dozza/",
} as const

export const CLUB_LEGAL = {
  displayName: "A.S.D. Polisportiva Virtus Dozza Routier",
  legalName: "Polisportiva Virtus Dozza Routier Associazione Sportiva Dilettantistica",
  legalForm: "Associazione sportiva dilettantistica",
  registeredOffice: CLUB_CONTACT.address,
  taxCode: "02115441202",
  vatNumber: "02559971201",
  rasdNumber: null as string | null,
  privacyEmail: CLUB_CONTACT.email,
  pecEmail: null as string | null,
} as const;

export const TECHNICAL_COOKIES = [
  {
    name: "sb-access-token / sb-refresh-token",
    purpose: "Authentication session for admin area",
    provider: "Supabase",
    duration: "Session / according to Supabase session settings",
  },
] as const;

export const SITE_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/classifica", label: "Classifica" },
] as const;
