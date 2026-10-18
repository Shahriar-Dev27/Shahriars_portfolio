/*
 * Best effort: state lives in one warm function instance. It resets on cold
 * start and is not shared across concurrent instances. The real ceiling is
 * the providers' own free-tier quotas.
 *
 * IPv6 clients are grouped by their /64 prefix, because a single host usually
 * owns a whole /64 and would otherwise get a fresh per-IP key per request.
 */
import { RATE_LIMITS } from "./config.js";

/**
 * @typedef {{ windowMs: number, max: number }} RateRule
 * @typedef {{ allowed: boolean, retryAfterSeconds: number }} RateDecision
 */

/**
 * Returns the timestamps that fall inside the window ending at `t`.
 * @param {number[]} hits Ascending timestamps.
 * @param {number} windowMs Window length.
 * @param {number} t Current time.
 * @returns {number[]}
 */
function hitsInWindow(hits, windowMs, t) {
  return hits.filter((hit) => t - hit < windowMs);
}

/**
 * Checks every rule against one bucket of hits.
 * @param {number[]} hits Pruned, ascending timestamps for the bucket.
 * @param {RateRule[]} rules Rules to enforce.
 * @param {number} t Current time.
 * @returns {number} 0 when all rules pass, else the largest retry in seconds.
 */
function worstRetry(hits, rules, t) {
  let retry = 0;
  for (const { windowMs, max } of rules) {
    const inWindow = hitsInWindow(hits, windowMs, t);
    if (inWindow.length < max) continue;
    const oldest = inWindow.length > 0 ? Math.min(...inWindow) : t;
    const seconds = Math.max(1, Math.ceil((oldest + windowMs - t) / 1000));
    retry = Math.max(retry, seconds);
  }
  return retry;
}

/**
 * Creates an in-memory sliding-window rate limiter.
 * @param {{ rules: RateRule[], globalRules?: RateRule[], maxKeys?: number, now?: () => number }} options
 * @returns {{ check(key: string): RateDecision, size(): number }}
 */
export function createRateLimiter({ rules, globalRules = [], maxKeys = 5_000, now = Date.now }) {
  /** @type {Map<string, number[]>} */
  const buckets = new Map();
  /** @type {number[]} */
  let globalHits = [];

  const keyWindow = Math.max(0, ...rules.map((rule) => rule.windowMs));
  const globalWindow = Math.max(0, ...globalRules.map((rule) => rule.windowMs));

  return {
    check(key) {
      const t = now();

      const hits = (buckets.get(key) ?? []).filter((hit) => t - hit < keyWindow);
      globalHits = globalHits.filter((hit) => t - hit < globalWindow);

      const keyRetry = worstRetry(hits, rules, t);
      const globalRetry = worstRetry(globalHits, globalRules, t);
      const retry = Math.max(keyRetry, globalRetry);

      if (retry > 0) {
        if (hits.length === 0) buckets.delete(key);
        else buckets.set(key, hits);
        return { allowed: false, retryAfterSeconds: retry };
      }

      hits.push(t);
      globalHits.push(t);
      buckets.set(key, hits);

      while (buckets.size > maxKeys) {
        const oldestKey = buckets.keys().next().value;
        buckets.delete(oldestKey);
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
    size() {
      return buckets.size;
    },
  };
}

/**
 * Parses a dotted-quad IPv4 address.
 * @param {string} text
 * @returns {number[] | null} Four octets, or null when not a valid IPv4 address.
 */
function parseIpv4(text) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  return octets.every((octet) => octet <= 255) ? octets : null;
}

/**
 * Parses an IPv6 address (no brackets, port or zone id) into eight 16-bit groups.
 * Accepts "::" compression and an embedded trailing IPv4 part.
 * @param {string} text
 * @returns {number[] | null} Eight groups, or null when malformed.
 */
function parseIpv6(text) {
  const halves = text.split("::");
  if (halves.length > 2) return null;

  /** @param {string} part @returns {number[] | null} */
  const toGroups = (part) => {
    if (part === "") return [];
    const groups = [];
    for (const piece of part.split(":")) {
      if (piece.includes(".")) {
        const octets = parseIpv4(piece);
        if (!octets) return null;
        groups.push(octets[0] * 256 + octets[1], octets[2] * 256 + octets[3]);
      } else if (/^[0-9a-f]{1,4}$/i.test(piece)) {
        groups.push(parseInt(piece, 16));
      } else {
        return null;
      }
    }
    return groups;
  };

  const head = toGroups(halves[0]);
  if (!head) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;

  const tail = toGroups(halves[1]);
  if (!tail) return null;
  const fill = 8 - head.length - tail.length;
  if (fill < 1) return null;
  return [...head, ...new Array(fill).fill(0), ...tail];
}

/**
 * Normalises one client address into a rate-limit key.
 * Plain IPv4 is returned unchanged. IPv4-mapped IPv6 maps to its IPv4 address.
 * Other IPv6 keys on the /64 prefix. Anything malformed falls back to the raw
 * value, truncated to 64 characters.
 * @param {string} raw Trimmed client address.
 * @returns {string} Rate-limit key.
 */
function addressKey(raw) {
  if (parseIpv4(raw)) return raw;

  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d{1,5}$/.exec(raw);
  if (ipv4WithPort && parseIpv4(ipv4WithPort[1])) return ipv4WithPort[1];

  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(raw);
  const bare = (bracketed ? bracketed[1] : raw).split("%")[0];

  if (bare.includes(":")) {
    const groups = parseIpv6(bare);
    if (groups) {
      const isMapped =
        groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
      if (isMapped) {
        const low = groups[6];
        const high = groups[7];
        return `${low >> 8}.${low & 0xff}.${high >> 8}.${high & 0xff}`;
      }
      return `${groups[0].toString(16)}:${groups[1].toString(16)}:${groups[2].toString(16)}:${groups[3].toString(16)}::/64`;
    }
  }

  return raw.slice(0, 64);
}

/**
 * Identifies the client by IP. Uses the first x-forwarded-for entry, then
 * x-real-ip, then the literal "anonymous". IPv6 addresses are grouped by /64.
 * @param {Request} request Incoming request.
 * @returns {string} Client key.
 */
export function getClientKey(request) {
  const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (forwarded) return addressKey(forwarded);

  const realIp = (request.headers.get("x-real-ip") ?? "").trim();
  if (realIp) return addressKey(realIp);

  return "anonymous";
}

/** Shared limiter for the chat endpoint, built from the contract windows. */
export const defaultRateLimiter = createRateLimiter({
  rules: RATE_LIMITS.perIp,
  globalRules: RATE_LIMITS.global,
});
