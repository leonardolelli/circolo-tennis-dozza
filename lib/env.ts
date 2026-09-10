/**
 * Whether the app is running on a Vercel deployment (production or preview).
 * Vercel injects `VERCEL=1` on every deployment, while local development does
 * not have it set — even when running a production build with `next start`.
 *
 * Used to scope environment-only behaviour: e.g. maintenance mode is only
 * enforced on Vercel so local development always shows the real site.
 */
export const IS_VERCEL_DEPLOYMENT = process.env.VERCEL === "1";
