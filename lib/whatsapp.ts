/**
 * Helpers to turn a member's phone number into a `wa.me` deep link that
 * opens WhatsApp with a pre-filled challenge message.
 */

const ITALIAN_COUNTRY_CODE = "39";

/**
 * Normalizes a stored phone number into the digits-only, country-code-first
 * format required by `wa.me` links (no leading "+" or "00").
 *
 * Assumes Italian mobile numbers when no country code is present, which is
 * a reasonable default for a local club - see README for how to adapt this
 * if the club ever has international members.
 */
export function normalizePhoneForWhatsApp(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, "");

  if (digitsOnly.startsWith("00")) {
    return digitsOnly.slice(2);
  }

  // Already looks like it includes the Italian country code (e.g. a
  // 10-digit mobile number prefixed with "39" is 12 digits total).
  if (digitsOnly.startsWith(ITALIAN_COUNTRY_CODE) && digitsOnly.length > 10) {
    return digitsOnly;
  }

  return `${ITALIAN_COUNTRY_CODE}${digitsOnly.replace(/^0+/, "")}`;
}

/** Builds the pre-filled Italian challenge message shown in WhatsApp. */
export function buildChallengeMessage(
  requesterName: string,
  opponentName: string,
): string {
  return `Ciao ${opponentName}! Sono ${requesterName}: ti va di fare una partita per la classifica del Circolo Tennis Dozza? 🎾`;
}

/** Builds a `https://wa.me/...` deep link with an URL-encoded message. */
export function buildWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
