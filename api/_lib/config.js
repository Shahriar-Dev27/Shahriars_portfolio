/**
 * Shared contract constants for the chat backend and its tests.
 * The frontend mirrors MAX_USER_MESSAGE_CHARS and MAX_HISTORY_MESSAGES.
 */

/** Size, length and timing limits for the chat endpoint. */
export const LIMITS = Object.freeze({
  MAX_BODY_BYTES: 16_384,
  MAX_REQUEST_MESSAGES: 20,
  MAX_HISTORY_MESSAGES: 10,
  MAX_HISTORY_CHARS: 8_000,
  MAX_USER_MESSAGE_CHARS: 500,
  MAX_ASSISTANT_MESSAGE_CHARS: 1_200,
  MAX_REPLY_CHARS: 700,
  MAX_OUTPUT_TOKENS: 220,
  GEMINI_MAX_OUTPUT_TOKENS: 512, // Gemini 3 Flash counts thinking tokens against this cap
  TEMPERATURE: 0.95,
  PROVIDER_TIMEOUT_MS: 8_000,
  TOTAL_BUDGET_MS: 20_000,
  MIN_PROVIDER_BUDGET_MS: 2_500,
});

/** Best-effort in-memory rate limit windows. */
export const RATE_LIMITS = Object.freeze({
  perIp: Object.freeze([
    Object.freeze({ windowMs: 60_000, max: 6 }),
    Object.freeze({ windowMs: 3_600_000, max: 40 }),
  ]),
  global: Object.freeze([Object.freeze({ windowMs: 60_000, max: 30 })]),
});

/** Order in which providers are tried. */
export const PROVIDER_ORDER = Object.freeze(["gemini", "mistral", "groq"]);

/** Provider endpoints and the env vars that configure them. */
export const PROVIDERS = Object.freeze({
  gemini: Object.freeze({
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyEnv: "GEMINI_API_KEY", modelEnv: "GEMINI_MODEL", defaultModel: "gemini-3.8-flash",
  }),
  mistral: Object.freeze({
    url: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY", modelEnv: "MISTRAL_MODEL", defaultModel: "mistral-small-latest",
  }),
  groq: Object.freeze({
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY", modelEnv: "GROQ_MODEL", defaultModel: "llama-3.3-70b-versatile",
  }),
});

/** Default Gemini reasoning effort, used when the GEMINI_REASONING_EFFORT env var is unset. */
export const GEMINI_REASONING_EFFORT_DEFAULT = "minimal";

/**
 * Upstream statuses that stop the chain and return 502 upstream_rejected. Only 422 is fatal.
 * 400, 401 and 403 fall through on purpose to the next provider: Gemini returns 400 for a
 * bad or revoked key and for a region block, and 401/403 are key or permission problems
 * that another provider may not share.
 */
export const FATAL_UPSTREAM_STATUSES = Object.freeze([422]);

/** Localhost origins allowed by the CORS/origin check only outside production (see origin.js). */
export const DEV_ORIGINS = Object.freeze(["http://localhost:3000", "http://127.0.0.1:3000"]);
