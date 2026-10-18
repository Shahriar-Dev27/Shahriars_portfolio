import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LIMITS, FATAL_UPSTREAM_STATUSES } from "../api/_lib/config.js";
import {
  buildProviderChain,
  callProvider,
  runProviderChain,
  cleanReply,
} from "../api/_lib/providers.js";

const KEY = "test-key-not-real";
const SYSTEM_PROMPT = "SYSTEM-PROMPT-FIXTURE";
const USER_TEXT = "secret-user-question-xyz";
const REPLY_TEXT = "Groq says something witty-reply-abc.";
const MESSAGES = [{ role: "user", content: USER_TEXT }];

/** A 200 OpenAI-style completion response. */
function ok(content) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function status(code) {
  return new Response(JSON.stringify({ error: "upstream-body-should-not-leak" }), { status: code });
}

/**
 * Scripted fetch: `script` maps provider hostname to a function/value.
 * Records each call as { url, init }.
 */
function makeFetch(script) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const host = new URL(url).hostname;
    const step = script[host];
    const value = typeof step === "function" ? await step(url, init) : step;
    if (value instanceof Error) throw value;
    return value;
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

const GROQ_HOST = "api.groq.com";

function makeLogger() {
  const entries = [];
  return {
    entries,
    info: (o) => entries.push(["info", o]),
    warn: (o) => entries.push(["warn", o]),
    error: (o) => entries.push(["error", o]),
  };
}

function chain(env = {}) {
  return buildProviderChain({ GROQ_API_KEY: KEY, ...env });
}

function run(fetchImpl, extra = {}) {
  return runProviderChain(chain(), MESSAGES, {
    fetchImpl,
    systemPrompt: SYSTEM_PROMPT,
    logger: makeLogger(),
    ...extra,
  });
}

describe("buildProviderChain", () => {
  test("uses one Groq key and defaults to GPT-OSS 120B", () => {
    const providers = chain();
    assert.equal(providers.length, 1);
    const [groq] = providers;
    assert.equal(groq.id, "groq");
    assert.equal(groq.model, "openai/gpt-oss-120b");
    assert.equal(groq.apiKey, KEY);
    assert.equal(groq.maxTokens, 1024);
    assert.deepEqual(groq.extraBody, { reasoning_effort: "low", include_reasoning: false });
  });

  test("other providers' keys cannot enable another provider", () => {
    const legacy = { GEMINI_API_KEY: KEY, MISTRAL_API_KEY: KEY, OPENROUTER_API_KEY: KEY };
    assert.deepEqual(buildProviderChain(legacy), []);
    assert.deepEqual(chain(legacy).map((p) => p.id), ["groq"]);
  });

  test("missing, empty and whitespace-only Groq keys are not configured", () => {
    for (const key of [undefined, "", "   "]) {
      assert.deepEqual(buildProviderChain({ GROQ_API_KEY: key }), []);
    }
  });

  test("trims the key and supports a Groq model override", () => {
    const [groq] = chain({ GROQ_API_KEY: ` ${KEY} `, GROQ_MODEL: "llama-3.3-70b-versatile" });
    assert.equal(groq.apiKey, KEY);
    assert.equal(groq.model, "llama-3.3-70b-versatile");
    assert.deepEqual(groq.extraBody, {});
  });
});

describe("callProvider request shape", () => {
  test("sends system prompt first, temperature, stream false and bearer auth", async () => {
    const fetchImpl = makeFetch({ [GROQ_HOST]: ok("Hello there.") });
    const [groq] = chain();
    const result = await callProvider(groq, MESSAGES, {
      fetchImpl,
      timeoutMs: 8000,
      systemPrompt: SYSTEM_PROMPT,
    });
    assert.deepEqual(result, { ok: true, text: "Hello there." });
    assert.equal(fetchImpl.calls.length, 1);
    const { url, init } = fetchImpl.calls[0];
    assert.equal(url, groq.url);
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization ?? init.headers.authorization, `Bearer ${KEY}`);
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.ok(init.signal instanceof AbortSignal);
    const body = JSON.parse(init.body);
    assert.deepEqual(body.messages[0], { role: "system", content: SYSTEM_PROMPT });
    assert.deepEqual(body.messages[1], MESSAGES[0]);
    assert.equal(body.temperature, LIMITS.TEMPERATURE);
    assert.equal(body.temperature, 0.95);
    assert.equal(body.stream, false);
    assert.equal(body.model, groq.model);
    assert.equal(body.max_completion_tokens, 1024);
    assert.equal(body.reasoning_effort, "low");
    assert.equal(body.include_reasoning, false);
    assert.equal(body.max_tokens, undefined);
    assert.equal(body.reasoning_format, undefined);
  });

  test("returns the cleaned reply text", async () => {
    const fetchImpl = makeFetch({ [GROQ_HOST]: ok("**Hi** there.") });
    const result = await callProvider(chain()[0], MESSAGES, {
      fetchImpl,
      timeoutMs: 8000,
      systemPrompt: SYSTEM_PROMPT,
    });
    assert.deepEqual(result, { ok: true, text: "Hi there." });
  });
});

describe("callProvider classification", () => {
  const opts = (fetchImpl) => ({ fetchImpl, timeoutMs: 50, systemPrompt: SYSTEM_PROMPT });

  test("non-2xx in FATAL_UPSTREAM_STATUSES is non-retryable", async () => {
    for (const code of FATAL_UPSTREAM_STATUSES) {
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: status(code) })));
      assert.deepEqual(r, { ok: false, retryable: false, status: code, reason: "http" });
    }
  });

  test("every non-fatal non-2xx status is retryable (400, 401, 403, 429, 404, 402, 408, 5xx)", async () => {
    for (const code of [400, 401, 403, 429, 404, 402, 408, 500, 503]) {
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: status(code) })));
      assert.deepEqual(r, { ok: false, retryable: true, status: code, reason: "http" });
    }
  });

  test("hanging fetch honouring the signal is a retryable timeout", async () => {
    const hang = (url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: hang })));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "timeout" });
  });

  test("other thrown errors are retryable network failures", async () => {
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: new TypeError("boom") })));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
  });

  test("2xx with invalid JSON is bad_json", async () => {
    const r = await callProvider(
      chain()[0],
      MESSAGES,
      opts(makeFetch({ [GROQ_HOST]: new Response("not json{", { status: 200 }) })),
    );
    assert.deepEqual(r, { ok: false, retryable: true, status: 200, reason: "bad_json" });
  });

  test("a never-ending response body is a retryable timeout", async () => {
    const fetchImpl = makeFetch({
      [GROQ_HOST]: () => new Response(new ReadableStream({ start() {} }), { status: 200 }),
    });
    const started = Date.now();
    const r = await callProvider(chain()[0], MESSAGES, opts(fetchImpl));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "timeout" });
    assert.ok(Date.now() - started < 2000, "returned within the timeout window");
  });

  test("a mid-body non-timeout stream error is network, not bad_json", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new TypeError("terminated"));
      },
    });
    const fetchImpl = makeFetch({ [GROQ_HOST]: () => new Response(stream, { status: 200 }) });
    const r = await callProvider(chain()[0], MESSAGES, opts(fetchImpl));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
  });

  test("requests use redirect: error and a redirect rejection falls through as network", async () => {
    // fetch with redirect: "error" rejects with a TypeError when the server redirects.
    const fetchImpl = makeFetch({ [GROQ_HOST]: new TypeError("fetch failed") });
    const r = await callProvider(chain()[0], MESSAGES, opts(fetchImpl));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
    assert.equal(fetchImpl.calls[0].init.redirect, "error");
  });

  test("history is copied to fresh { role, content } objects without extra keys", async () => {
    const input = [{ role: "user", content: USER_TEXT, extra: "leak-me" }];
    const fetchImpl = makeFetch({ [GROQ_HOST]: ok("Fine.") });
    await callProvider(chain()[0], input, opts(fetchImpl));
    const body = JSON.parse(fetchImpl.calls[0].init.body);
    assert.deepEqual(body.messages[1], { role: "user", content: USER_TEXT });
    assert.ok(!fetchImpl.calls[0].init.body.includes("leak-me"));
  });

  test("empty, null, whitespace-only and markup-only content is empty", async () => {
    for (const content of ["", null, "   \n ", "```", 42]) {
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: ok(content) })));
      assert.deepEqual(r, { ok: false, retryable: true, status: 200, reason: "empty" }, String(content));
    }
  });

  test("missing choices is empty", async () => {
    const res = new Response(JSON.stringify({}), { status: 200 });
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GROQ_HOST]: res })));
    assert.equal(r.reason, "empty");
  });
});

describe("runProviderChain with Groq only", () => {
  for (const code of [400, 401, 403, 404, 429, 500, 503]) {
    test(`Groq ${code} makes one attempt and uses the canned fallback`, async () => {
      const fetchImpl = makeFetch({ [GROQ_HOST]: status(code) });
      assert.deepEqual(await run(fetchImpl), { ok: false, fatal: false });
      assert.equal(fetchImpl.calls.length, 1);
    });
  }

  test("success returns source groq", async () => {
    const fetchImpl = makeFetch({ [GROQ_HOST]: ok(REPLY_TEXT) });
    assert.deepEqual(await run(fetchImpl), { ok: true, text: REPLY_TEXT, source: "groq" });
    assert.equal(fetchImpl.calls.length, 1);
  });

  test("422 is fatal without another call", async () => {
    const fetchImpl = makeFetch({ [GROQ_HOST]: status(422) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: true });
    assert.equal(fetchImpl.calls.length, 1);
  });

  test("an empty chain makes no calls", async () => {
    const fetchImpl = makeFetch({});
    assert.deepEqual(await runProviderChain([], MESSAGES, {
      fetchImpl, systemPrompt: SYSTEM_PROMPT, logger: makeLogger(),
    }), { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 0);
  });

  test("does not call Groq after the total time budget is exhausted", async () => {
    const fetchImpl = makeFetch({ [GROQ_HOST]: ok(REPLY_TEXT) });
    let t = 0;
    const now = () => { const value = t; t += LIMITS.TOTAL_BUDGET_MS; return value; };
    assert.deepEqual(await run(fetchImpl, { now }), { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 0);
  });

  test("only final content is returned, never the reasoning field", async () => {
    const response = new Response(JSON.stringify({ choices: [{ message: {
      content: REPLY_TEXT, reasoning: "private-reasoning-fixture",
    } }] }));
    assert.deepEqual(await run(makeFetch({ [GROQ_HOST]: response })), {
      ok: true, text: REPLY_TEXT, source: "groq",
    });
  });

  test("logs only provider, status, reason and duration", async () => {
    const logger = makeLogger();
    for (const response of [status(401), ok(REPLY_TEXT), new TypeError(`failed ${KEY}`)]) {
      const fetchImpl = makeFetch({ [GROQ_HOST]: response });
      await run(fetchImpl, { logger });
    }
    assert.equal(logger.entries.length, 3);
    assert.deepEqual(logger.entries.map(([level]) => level), ["warn", "info", "warn"]);
    const dump = JSON.stringify(logger.entries);
    for (const forbidden of [KEY, USER_TEXT, REPLY_TEXT, SYSTEM_PROMPT, "upstream-body-should-not-leak"]) {
      assert.ok(!dump.includes(forbidden));
    }
    for (const [, entry] of logger.entries) {
      assert.deepEqual(Object.keys(entry).sort(), ["ms", "provider", "reason", "status"]);
      assert.equal(entry.provider, "groq");
    }
  });
});

describe("cleanReply", () => {
  test("strips emphasis, heading markers and collapses newlines", () => {
    assert.equal(cleanReply("**Hi** there.\n\n\n\n# Next"), "Hi there.\n\nNext");
  });

  test("strips double underscores, backticks and list markers", () => {
    assert.equal(cleanReply("__a__ `b`\n- one\n* two\n1. three"), "a b\none\ntwo\nthree");
  });

  test("leaves short clean text untouched", () => {
    assert.equal(cleanReply("  Plain text.  "), "Plain text.");
  });

  test("cuts a 900-char text at a sentence end within 700 chars", () => {
    const sentence = "This is a sentence of moderate length for testing. ";
    const text = sentence.repeat(Math.ceil(900 / sentence.length)).slice(0, 900);
    const out = cleanReply(text);
    assert.ok(out.length <= 700, `length ${out.length}`);
    assert.ok(out.endsWith("."), out.slice(-10));
    assert.ok(out.length > 600);
  });

  test("cuts at ! and ? sentence ends too", () => {
    const text = `${"a".repeat(100)}! ${"b".repeat(100)}? ${"c".repeat(800)}`;
    const out = cleanReply(text, 300);
    assert.equal(out, `${"a".repeat(100)}! ${"b".repeat(100)}?`);
  });

  test("ignores a sentence end before the halfway point and hard-cuts instead", () => {
    const out = cleanReply(`Hi. ${"a".repeat(800)}`);
    assert.notEqual(out, "Hi.");
    assert.equal(out.length, 700);
    assert.ok(out.endsWith("\u2026"));
  });

  test("a sentence cut one char below the halfway point hard-cuts; at the halfway point it cuts", () => {
    // "cut index" is the position just after the punctuation mark.
    const below = `${"a".repeat(348)}.`; // cut index 349 < 350
    const belowOut = cleanReply(`${below} ${"b".repeat(800)}`);
    assert.equal(belowOut.length, 700);
    assert.ok(belowOut.endsWith("…"));
    const at = `${"a".repeat(349)}.`; // cut index 350 === 700 / 2
    assert.equal(cleanReply(`${at} ${"b".repeat(800)}`), at);
  });

  test("uses a sentence end exactly at the halfway point", () => {
    const first = `${"a".repeat(349)}.`; // cut index 350 === 700 / 2
    const out = cleanReply(`${first} ${"b".repeat(800)}`);
    assert.equal(out, first);
  });

  test("hard-cut never splits a surrogate pair", () => {
    for (const pad of [697, 698, 699]) {
      const out = cleanReply(`${"a".repeat(pad)}\u{1F600}${"b".repeat(100)}`);
      assert.ok(out.length <= 700, `pad ${pad}: length ${out.length}`);
      assert.ok(out.endsWith("\u2026"));
      assert.equal(out, out.toWellFormed(), `pad ${pad}`);
    }
  });

  test("hard-cuts a 900-char text without punctuation to 700 chars ending in an ellipsis", () => {
    const out = cleanReply("a".repeat(900));
    assert.equal(out.length, 700);
    assert.ok(out.endsWith("…"));
  });

  test("non-strings clean to an empty string", () => {
    assert.equal(cleanReply(null), "");
    assert.equal(cleanReply(undefined), "");
  });
});
