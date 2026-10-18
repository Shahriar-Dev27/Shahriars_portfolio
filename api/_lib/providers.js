/**
 * Groq primary and optional NVIDIA backup, through OpenAI-compatible endpoints.
 *
 * Nothing in this module returns or logs a key, an upstream response body, a user
 * message or a model reply. Log lines are exactly { provider, status, reason, ms }.
 */

import {
  LIMITS,
  PROVIDERS,
  PROVIDER_ORDER,
  FATAL_UPSTREAM_STATUSES,
} from "./config.js";

/** @typedef {{ id: "groq"|"nvidia", url: string, model: string, apiKey: string, maxTokens: number, extraBody: object }} Provider */

/** @typedef {{ ok: true, text: string } | { ok: false, retryable: boolean, status: number | null, reason: "timeout"|"network"|"http"|"bad_json"|"empty" }} CallResult */

/** @typedef {{ ok: true, text: string, source: "groq"|"nvidia" } | { ok: false, fatal: boolean }} ChainResult */

/**
 * Try Groq first, then NVIDIA when its key is set. Missing keys skip that provider.
 * GPT-OSS uses low reasoning effort. Only final message content is returned.
 * @param {Record<string, string | undefined>} env
 * @returns {Provider[]}
 */
export function buildProviderChain(env) {
  const chain = [];
  for (const id of PROVIDER_ORDER) {
    const def = PROVIDERS[id];
    const rawKey = env[def.keyEnv];
    const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
    if (!apiKey) continue;

    const model = env[def.modelEnv] || def.defaultModel;
    const maxTokens = LIMITS.MAX_OUTPUT_TOKENS;
    const extraBody = model.startsWith("openai/gpt-oss-")
      ? { reasoning_effort: "low", ...(id === "groq" ? { include_reasoning: false } : {}) }
      : {};
    chain.push({ id, url: def.url, model, apiKey, maxTokens, extraBody });
  }
  return chain;
}

/**
 * Strip markdown emphasis (double asterisks, double underscores, backticks) and leading
 * heading/list markers per line; collapse 3+ consecutive newlines to 2; trim; cut to
 * maxChars at the last sentence end (". ", "! ", "? ") inside the limit, but only when
 * that cut index is at least maxChars / 2 (otherwise most of the reply would be thrown
 * away); else hard-cut at maxChars - 1 and append the ellipsis character.
 * @param {unknown} text
 * @param {number} [maxChars]
 * @returns {string}
 */
export function cleanReply(text, maxChars = LIMITS.MAX_REPLY_CHARS) {
  if (typeof text !== "string") return "";

  let out = text
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*|__|`/g, "")
    .replace(/^[ \t]*(?:#{1,6}[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+)/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (out.length <= maxChars) return out;

  // The space after the sentence-ending punctuation may sit at index maxChars.
  const window = out.slice(0, maxChars + 1);
  let cut = -1;
  for (const end of [". ", "! ", "? "]) {
    const idx = window.lastIndexOf(end);
    if (idx !== -1 && idx + 1 > cut) cut = idx + 1;
  }
  // A sentence boundary in the first half would throw away most of the reply.
  if (cut >= maxChars / 2) return out.slice(0, cut).trim();

  let hard = out.slice(0, maxChars - 1);
  const last = hard.charCodeAt(hard.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) hard = hard.slice(0, -1); // do not split a surrogate pair
  return `${hard.trimEnd().toWellFormed()}…`;
}

/**
 * Call one provider once.
 * @param {Provider} provider
 * @param {{ role: string, content: string }[]} messages
 * @param {{ fetchImpl?: typeof fetch, timeoutMs: number, systemPrompt: string }} options
 * @returns {Promise<CallResult>}
 */
export async function callProvider(provider, messages, { fetchImpl = fetch, timeoutMs, systemPrompt }) {
  const signal = AbortSignal.timeout(timeoutMs);
  const body = {
    model: provider.model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
    temperature: LIMITS.TEMPERATURE,
    [provider.id === "nvidia" ? "max_tokens" : "max_completion_tokens"]: provider.maxTokens,
    stream: false,
    ...provider.extraBody,
  };

  let res;
  try {
    res = await fetchImpl(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      // These APIs never legitimately redirect; refuse to follow one (it would also forward
      // the Authorization header). The resulting rejection falls through as "network".
      redirect: "error",
      signal,
    });
  } catch (err) {
    return { ok: false, retryable: true, status: null, reason: isAbort(err) ? "timeout" : "network" };
  }

  if (!res.ok) {
    discardBody(res);
    return {
      ok: false,
      retryable: !FATAL_UPSTREAM_STATUSES.includes(res.status),
      status: res.status,
      reason: "http",
    };
  }

  let data;
  try {
    data = await raceAbort(res.json(), signal);
  } catch (err) {
    if (isAbort(err)) {
      discardBody(res);
      return { ok: false, retryable: true, status: null, reason: "timeout" };
    }
    // Only a genuine JSON parse failure is bad_json; a broken stream is a network failure.
    if (err instanceof SyntaxError) {
      return { ok: false, retryable: true, status: res.status, reason: "bad_json" };
    }
    return { ok: false, retryable: true, status: null, reason: "network" };
  }

  const text = cleanReply(data?.choices?.[0]?.message?.content);
  if (text === "") {
    return { ok: false, retryable: true, status: res.status, reason: "empty" };
  }
  return { ok: true, text };
}

/** True for the errors AbortSignal.timeout / abort produce. */
function isAbort(err) {
  const name = err && typeof err === "object" ? err.name : "";
  return name === "TimeoutError" || name === "AbortError";
}

/**
 * Reject when the signal aborts, even if the body promise never settles
 * (a stalled body must not outlive the provider timeout).
 * @template T
 * @param {Promise<T>} promise
 * @param {AbortSignal} signal
 * @returns {Promise<T>}
 */
function raceAbort(promise, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      },
    );
  });
}

/** Release an unread response body without ever surfacing it. */
function discardBody(res) {
  try {
    res.body?.cancel().catch(() => {});
  } catch {
    // ignore: the body is never used
  }
}

/**
 * Try each configured provider once within the time budget. A successful Groq
 * response skips NVIDIA. Any Groq failure allows NVIDIA to answer. If all fail,
 * a 422 produces an upstream error; otherwise the handler uses a canned reply.
 * @param {Provider[]} chain
 * @param {{ role: string, content: string }[]} messages
 * @param {{ fetchImpl?: typeof fetch, systemPrompt: string, now?: () => number, logger?: { info: Function, warn: Function }, limits?: typeof LIMITS }} options
 * @returns {Promise<ChainResult>}
 */
export async function runProviderChain(
  chain,
  messages,
  { fetchImpl, systemPrompt, now = Date.now, logger = console, limits = LIMITS },
) {
  const start = now();
  let fatal = false;

  for (const provider of chain) {
    const remaining = limits.TOTAL_BUDGET_MS - (now() - start);
    if (remaining < limits.MIN_PROVIDER_BUDGET_MS) {
      return { ok: false, fatal };
    }

    const timeoutMs = Math.min(limits.PROVIDER_TIMEOUT_MS, remaining);
    const attemptStart = now();
    const result = await callProvider(provider, messages, { fetchImpl, timeoutMs, systemPrompt });
    const ms = now() - attemptStart;

    if (result.ok) {
      logger.info({ provider: provider.id, status: 200, reason: "ok", ms });
      return { ok: true, text: result.text, source: provider.id };
    }

    logger.warn({ provider: provider.id, status: result.status, reason: result.reason, ms });
    fatal ||= !result.retryable;
  }

  return { ok: false, fatal };
}
