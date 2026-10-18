/**
 * Request handler for POST /api/chat.
 *
 * Pipeline: method, origin, content type, per-IP rate limit, body size, JSON parse,
 * validation, provider configuration, provider chain, JSON response.
 *
 * Every response is built through respond.js, so it carries the standard headers. No CORS
 * headers are ever set. Nothing here logs message text, replies, IP addresses or keys: the
 * only handler-level log lines are { reason: "no_provider_keys" } and { reason: "unhandled" }.
 * The handler never returns a 500: an unexpected error becomes the canned 200 reply.
 */

import { LIMITS } from "./config.js";
import { errorResponse, jsonResponse } from "./respond.js";
import { parseJsonBody, validateChatRequest } from "./validate.js";
import { isAllowedRequest } from "./origin.js";
import { defaultRateLimiter, getClientKey } from "./rate-limit.js";
import { buildProviderChain, runProviderChain } from "./providers.js";
import { SYSTEM_PROMPT, pickFallback } from "./persona.js";

/**
 * @typedef {object} HandlerDeps
 * @property {Record<string, string | undefined>} [env] Environment; defaults to process.env read at request time.
 * @property {typeof fetch} [fetchImpl] Defaults to globalThis.fetch.
 * @property {{ check(key: string): { allowed: boolean, retryAfterSeconds: number } }} [rateLimiter] Defaults to the shared limiter.
 * @property {{ check(key: string): { allowed: boolean, retryAfterSeconds: number } }} [limiter] Alias of rateLimiter.
 * @property {() => number} [now] Defaults to Date.now.
 * @property {() => number} [random] Defaults to Math.random.
 * @property {{ info: Function, warn: Function, error: Function }} [logger] Defaults to console.
 */

/**
 * Reads a request body as UTF-8 text, giving up as soon as more than maxBytes arrive.
 * A lying or missing Content-Length therefore cannot make the function buffer more than
 * maxBytes plus one chunk.
 * @param {Request} request
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, text: string } | { ok: false }>}
 */
async function readBoundedBody(request, maxBytes) {
  const stream = request.body;
  if (!stream) return { ok: true, text: "" };

  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }
  return { ok: true, text: Buffer.concat(chunks).toString("utf8") };
}

const LOGGABLE_ERROR_NAMES = new Set([
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "AbortError",
  "TimeoutError",
]);

/**
 * The error's built-in type name if it is on the allowlist, otherwise "other".
 * Never the message or stack.
 * @param {unknown} err
 * @returns {string}
 */
function safeErrorName(err) {
  let name;
  try {
    name = err?.name;
  } catch {
    return "other";
  }
  return typeof name === "string" && LOGGABLE_ERROR_NAMES.has(name) ? name : "other";
}

/**
 * Releases an unread request body, swallowing any rejection or throw.
 * @param {Request} request
 * @returns {void}
 */
function discardBody(request) {
  try {
    Promise.resolve(request.body?.cancel()).catch(() => {});
  } catch {
    // ignore: the body is being thrown away anyway
  }
}

/**
 * Builds a chat handler bound to the given dependencies.
 * @param {HandlerDeps} [deps]
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler(deps = {}) {
  const {
    fetchImpl = globalThis.fetch,
    now = Date.now,
    random = Math.random,
    logger = console,
  } = deps;
  const limiter = deps.rateLimiter ?? deps.limiter ?? defaultRateLimiter;

  const fail = (status, code, kind, headers) =>
    errorResponse(status, code, pickFallback(kind, random), headers);
  const cannedReply = () =>
    jsonResponse(200, { reply: pickFallback("allDown", random), source: "fallback" });

  return async function handle(request) {
    try {
      const env = deps.env ?? process.env;
      const { MAX_BODY_BYTES } = LIMITS;

      // 1. Method. No CORS is offered, so OPTIONS is simply not allowed.
      if (request.method !== "POST") {
        return fail(405, "method_not_allowed", "methodNotAllowed", { Allow: "POST" });
      }

      // 2. Origin.
      if (!isAllowedRequest(request, env)) {
        return fail(403, "forbidden_origin", "forbidden");
      }

      // 3. Content type.
      const contentType = (request.headers.get("content-type") ?? "").trim().toLowerCase();
      if (!contentType.startsWith("application/json")) {
        return fail(415, "unsupported_media_type", "unsupportedMedia");
      }

      // 4. Per-IP rate limit.
      const decision = limiter.check(getClientKey(request));
      if (!decision.allowed) {
        return fail(429, "rate_limited", "rateLimited", {
          "Retry-After": String(decision.retryAfterSeconds),
        });
      }

      // 5. Body size: the declared length first, then the bytes actually read.
      const declared = (request.headers.get("content-length") ?? "").trim();
      if (/^\d+$/.test(declared) && Number(declared) > MAX_BODY_BYTES) {
        discardBody(request);
        return fail(413, "payload_too_large", "tooLarge");
      }
      const body = await readBoundedBody(request, MAX_BODY_BYTES);
      if (!body.ok) return fail(413, "payload_too_large", "tooLarge");

      // 6. JSON.
      const parsed = parseJsonBody(body.text);
      if (!parsed.ok) return fail(400, "invalid_json", "invalid");

      // 7. Shape and limits.
      const validated = validateChatRequest(parsed.value, LIMITS);
      if (!validated.ok) {
        return fail(
          validated.status,
          validated.code,
          validated.code === "message_too_long" ? "tooLong" : "invalid",
        );
      }

      // 8. At least one provider must be configured. An empty chain is not "all providers failed".
      const chain = buildProviderChain(env);
      if (chain.length === 0) {
        logger.error({ reason: "no_provider_keys" });
        return fail(503, "not_configured", "notConfigured");
      }

      const result = await runProviderChain(chain, validated.messages, {
        fetchImpl,
        systemPrompt: SYSTEM_PROMPT,
        now,
        logger,
        limits: LIMITS,
      });

      if (result.ok) return jsonResponse(200, { reply: result.text, source: result.source });
      if (result.fatal) return fail(502, "upstream_rejected", "upstream");
      return cannedReply();
    } catch (err) {
      // Deliberately only a built-in type name: message and stack could carry user data or key material.
      try {
        logger.error({ reason: "unhandled", status: safeErrorName(err) });
      } catch {
        // logging must never turn into a failure
      }
      return cannedReply();
    }
  };
}

/**
 * Handles one POST /api/chat request.
 * @param {Request} request
 * @param {HandlerDeps} [deps]
 * @returns {Promise<Response>}
 */
export async function handleChat(request, deps = {}) {
  return createHandler(deps)(request);
}
