import { DEV_ORIGINS } from "./config.js";

/**
 * Builds the set of origins allowed to call the chat endpoint.
 * ALLOWED_ORIGINS entries are always included. Vercel deployment URLs are
 * included only outside production, except the production URL itself.
 * DEV_ORIGINS are included only when VERCEL_ENV is unset or "development".
 * @param {Record<string, string | undefined>} env Environment variables.
 * @returns {Set<string>} Exact origin strings, without trailing slashes.
 */
export function getAllowedOrigins(env) {
  const origins = new Set();
  const isProduction = env.VERCEL_ENV === "production";

  for (const entry of (env.ALLOWED_ORIGINS ?? "").split(",")) {
    const origin = entry.trim().replace(/\/+$/, "");
    if (origin) origins.add(origin);
  }

  const productionUrl = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  if (productionUrl) origins.add(`https://${productionUrl}`);

  if (!isProduction) {
    for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      const trimmed = (host ?? "").trim();
      if (trimmed) origins.add(`https://${trimmed}`);
    }
  }

  if (!env.VERCEL_ENV || env.VERCEL_ENV === "development") {
    for (const origin of DEV_ORIGINS) origins.add(origin);
  }

  return origins;
}

/**
 * Decides whether a request may reach the chat endpoint.
 * Requires an Origin header that exactly matches the allowlist. A present
 * Sec-Fetch-Site header must be "same-origin".
 * @param {Request} request Incoming request.
 * @param {Record<string, string | undefined>} env Environment variables.
 * @returns {boolean} True when the request is allowed.
 */
export function isAllowedRequest(request, env) {
  const origin = request.headers.get("origin");
  if (!origin || !getAllowedOrigins(env).has(origin)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") return false;

  return true;
}
