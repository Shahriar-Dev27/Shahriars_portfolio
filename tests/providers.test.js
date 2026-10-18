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
const REPLY_TEXT = "Mistral says something witty-reply-abc.";
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

const GEMINI_HOST = "generativelanguage.googleapis.com";
const MISTRAL_HOST = "api.mistral.ai";

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
  return buildProviderChain({ GEMINI_API_KEY: KEY, MISTRAL_API_KEY: KEY, ...env });
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
  test("includes gemini and mistral when both keys are set", () => {
    assert.deepEqual(chain().map((p) => p.id), ["gemini", "mistral"]);
  });

  test("applies gemini and mistral defaults", () => {
    const [gemini, mistral] = chain();
    assert.equal(gemini.model, "gemini-3.8-flash");
    assert.equal(gemini.extraBody.reasoning_effort, "minimal");
    assert.equal(gemini.maxTokens, 512);
    assert.equal(gemini.apiKey, KEY);
    assert.equal(mistral.model, "mistral-small-latest");
    assert.equal(mistral.maxTokens, 220);
    assert.deepEqual(mistral.extraBody, {});
  });

  test("empty GEMINI_REASONING_EFFORT omits reasoning_effort", () => {
    const [gemini] = chain({ GEMINI_REASONING_EFFORT: "" });
    assert.deepEqual(gemini.extraBody, {});
  });

  test("GEMINI_MODEL overrides the model", () => {
    const [gemini] = chain({ GEMINI_MODEL: "x" });
    assert.equal(gemini.model, "x");
  });

  test("an empty-string key skips that provider", () => {
    assert.deepEqual(chain({ GEMINI_API_KEY: "" }).map((p) => p.id), ["mistral"]);
  });

  test("optional groq is appended only when its key is set", () => {
    assert.deepEqual(chain({ GROQ_API_KEY: KEY }).map((p) => p.id), ["gemini", "mistral", "groq"]);
    const groq = chain({ GROQ_API_KEY: KEY })[2];
    assert.equal(groq.model, "llama-3.3-70b-versatile");
    assert.equal(groq.maxTokens, 220);
  });

  test("no keys gives an empty chain", () => {
    assert.deepEqual(buildProviderChain({}), []);
  });
});

describe("callProvider request shape", () => {
  test("sends system prompt first, temperature, stream false and bearer auth", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: ok("Hello there.") });
    const [gemini] = chain();
    const result = await callProvider(gemini, MESSAGES, {
      fetchImpl,
      timeoutMs: 8000,
      systemPrompt: SYSTEM_PROMPT,
    });
    assert.deepEqual(result, { ok: true, text: "Hello there." });
    assert.equal(fetchImpl.calls.length, 1);
    const { url, init } = fetchImpl.calls[0];
    assert.equal(url, gemini.url);
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
    assert.equal(body.model, gemini.model);
    assert.equal(body.max_tokens, 512);
    assert.equal(body.reasoning_effort, "minimal");
  });

  test("returns the cleaned reply text", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: ok("**Hi** there.") });
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
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: status(code) })));
      assert.deepEqual(r, { ok: false, retryable: false, status: code, reason: "http" });
    }
  });

  test("every non-fatal non-2xx status is retryable (400, 401, 403, 429, 404, 402, 408, 5xx)", async () => {
    for (const code of [400, 401, 403, 429, 404, 402, 408, 500, 503]) {
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: status(code) })));
      assert.deepEqual(r, { ok: false, retryable: true, status: code, reason: "http" });
    }
  });

  test("hanging fetch honouring the signal is a retryable timeout", async () => {
    const hang = (url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: hang })));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "timeout" });
  });

  test("other thrown errors are retryable network failures", async () => {
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: new TypeError("boom") })));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
  });

  test("2xx with invalid JSON is bad_json", async () => {
    const r = await callProvider(
      chain()[0],
      MESSAGES,
      opts(makeFetch({ [GEMINI_HOST]: new Response("not json{", { status: 200 }) })),
    );
    assert.deepEqual(r, { ok: false, retryable: true, status: 200, reason: "bad_json" });
  });

  test("a never-ending response body is a retryable timeout", async () => {
    const fetchImpl = makeFetch({
      [GEMINI_HOST]: () => new Response(new ReadableStream({ start() {} }), { status: 200 }),
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
    const fetchImpl = makeFetch({ [GEMINI_HOST]: () => new Response(stream, { status: 200 }) });
    const r = await callProvider(chain()[0], MESSAGES, opts(fetchImpl));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
  });

  test("requests use redirect: error and a redirect rejection falls through as network", async () => {
    // fetch with redirect: "error" rejects with a TypeError when the server redirects.
    const fetchImpl = makeFetch({ [GEMINI_HOST]: new TypeError("fetch failed") });
    const r = await callProvider(chain()[0], MESSAGES, opts(fetchImpl));
    assert.deepEqual(r, { ok: false, retryable: true, status: null, reason: "network" });
    assert.equal(fetchImpl.calls[0].init.redirect, "error");
  });

  test("history is copied to fresh { role, content } objects without extra keys", async () => {
    const input = [{ role: "user", content: USER_TEXT, extra: "leak-me" }];
    const fetchImpl = makeFetch({ [GEMINI_HOST]: ok("Fine.") });
    await callProvider(chain()[0], input, opts(fetchImpl));
    const body = JSON.parse(fetchImpl.calls[0].init.body);
    assert.deepEqual(body.messages[1], { role: "user", content: USER_TEXT });
    assert.ok(!fetchImpl.calls[0].init.body.includes("leak-me"));
  });

  test("empty, null, whitespace-only and markup-only content is empty", async () => {
    for (const content of ["", null, "   \n ", "```", 42]) {
      const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: ok(content) })));
      assert.deepEqual(r, { ok: false, retryable: true, status: 200, reason: "empty" }, String(content));
    }
  });

  test("missing choices is empty", async () => {
    const res = new Response(JSON.stringify({}), { status: 200 });
    const r = await callProvider(chain()[0], MESSAGES, opts(makeFetch({ [GEMINI_HOST]: res })));
    assert.equal(r.reason, "empty");
  });
});

describe("runProviderChain fall-through matrix", () => {
  const mistralOk = () => ok(REPLY_TEXT);

  const fallThrough = {
    "429": () => status(429),
    "503": () => status(503),
    "404": () => status(404),
    "400 (human-approved override)": () => status(400),
    "401 (human-approved override)": () => status(401),
    "403 (human-approved override)": () => status(403),
    "thrown TypeError": () => new TypeError("fetch failed"),
    "200 invalid JSON": () => new Response("<html>", { status: 200 }),
    "200 empty content": () => ok(""),
    "200 null content": () => ok(null),
  };

  for (const [label, gemini] of Object.entries(fallThrough)) {
    test(`gemini ${label} falls through to mistral`, async () => {
      const fetchImpl = makeFetch({ [GEMINI_HOST]: gemini, [MISTRAL_HOST]: mistralOk });
      const r = await run(fetchImpl);
      assert.deepEqual(r, { ok: true, text: REPLY_TEXT, source: "mistral" });
      assert.equal(fetchImpl.calls.length, 2);
    });
  }

  test("gemini timeout falls through to mistral", async () => {
    const hang = (url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    const fetchImpl = makeFetch({ [GEMINI_HOST]: hang, [MISTRAL_HOST]: mistralOk });
    const r = await run(fetchImpl, { limits: { ...LIMITS, PROVIDER_TIMEOUT_MS: 50 } });
    assert.deepEqual(r, { ok: true, text: REPLY_TEXT, source: "mistral" });
  });

  test("gemini success returns source gemini without calling mistral", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: ok("Gemini reply."), [MISTRAL_HOST]: mistralOk });
    const r = await run(fetchImpl);
    assert.deepEqual(r, { ok: true, text: "Gemini reply.", source: "gemini" });
    assert.equal(fetchImpl.calls.length, 1);
  });

  test("fatal statuses come from FATAL_UPSTREAM_STATUSES (422 only)", () => {
    assert.deepEqual([...FATAL_UPSTREAM_STATUSES], [422]);
  });

  for (const code of FATAL_UPSTREAM_STATUSES) {
    test(`gemini ${code} is fatal and mistral is never called`, async () => {
      const fetchImpl = makeFetch({ [GEMINI_HOST]: status(code), [MISTRAL_HOST]: mistralOk });
      const r = await run(fetchImpl);
      assert.deepEqual(r, { ok: false, fatal: true });
      assert.equal(fetchImpl.calls.length, 1);
    });
  }

  test("mistral 422 after gemini fall-through is fatal", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(503), [MISTRAL_HOST]: status(422) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: true });
  });

  test("all providers 400 is all-failed, not upstream-rejected", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(400), [MISTRAL_HOST]: status(400) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 2);
  });

  test("gemini 503 and mistral 503 exhausts the chain (not fatal)", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(503), [MISTRAL_HOST]: status(503) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: false });
  });

  test("all providers 401 is all-failed, not upstream-rejected", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(401), [MISTRAL_HOST]: status(401) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 2);
  });

  test("all providers 403 is all-failed, not upstream-rejected", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(403), [MISTRAL_HOST]: status(403) });
    assert.deepEqual(await run(fetchImpl), { ok: false, fatal: false });
  });

  test("an empty chain returns not fatal and makes no calls", async () => {
    const fetchImpl = makeFetch({});
    const r = await runProviderChain([], MESSAGES, {
      fetchImpl,
      systemPrompt: SYSTEM_PROMPT,
      logger: makeLogger(),
    });
    assert.deepEqual(r, { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 0);
  });

  test("groq is tried third when the first two fail", async () => {
    const fetchImpl = makeFetch({
      [GEMINI_HOST]: status(503),
      [MISTRAL_HOST]: status(401),
      "api.groq.com": ok("Groq here."),
    });
    const r = await runProviderChain(chain({ GROQ_API_KEY: KEY }), MESSAGES, {
      fetchImpl,
      systemPrompt: SYSTEM_PROMPT,
      logger: makeLogger(),
    });
    assert.deepEqual(r, { ok: true, text: "Groq here.", source: "groq" });
  });
});

describe("runProviderChain budget", () => {
  test("stops when the remaining budget is under the minimum", async () => {
    let t = 1_000_000;
    const fetchImpl = makeFetch({
      [GEMINI_HOST]: () => {
        t += 18_000;
        return status(503);
      },
      [MISTRAL_HOST]: ok(REPLY_TEXT),
    });
    const r = await run(fetchImpl, { now: () => t });
    assert.deepEqual(r, { ok: false, fatal: false });
    assert.equal(fetchImpl.calls.length, 1);
  });

  test("still calls the next provider when remaining budget is above the minimum", async () => {
    let t = 0;
    const fetchImpl = makeFetch({
      [GEMINI_HOST]: () => {
        t += 15_000; // remaining 5,000 >= 2,500
        return status(503);
      },
      [MISTRAL_HOST]: ok(REPLY_TEXT),
    });
    const r = await run(fetchImpl, { now: () => t });
    assert.equal(r.source, "mistral");
    assert.equal(fetchImpl.calls.length, 2);
  });
});

describe("runProviderChain logging", () => {
  test("logs exactly one {provider,status,reason,ms} per attempt", async () => {
    const logger = makeLogger();
    let t = 0;
    const fetchImpl = makeFetch({
      [GEMINI_HOST]: () => {
        t += 120;
        return status(401);
      },
      [MISTRAL_HOST]: () => {
        t += 80;
        return ok(REPLY_TEXT);
      },
    });
    await run(fetchImpl, { logger, now: () => t });
    assert.equal(logger.entries.length, 2);
    assert.deepEqual(logger.entries[0], ["warn", { provider: "gemini", status: 401, reason: "http", ms: 120 }]);
    assert.deepEqual(logger.entries[1], ["info", { provider: "mistral", status: 200, reason: "ok", ms: 80 }]);
  });

  test("log output never contains the key, user text, reply text or upstream body", async () => {
    const logger = makeLogger();
    const scenarios = [
      { [GEMINI_HOST]: status(401), [MISTRAL_HOST]: ok(REPLY_TEXT) },
      { [GEMINI_HOST]: new TypeError(`fetch failed ${KEY}`), [MISTRAL_HOST]: status(400) },
      { [GEMINI_HOST]: ok(""), [MISTRAL_HOST]: new Response("{bad", { status: 200 }) },
    ];
    for (const script of scenarios) {
      await run(makeFetch(script), { logger });
    }
    const dump = JSON.stringify(logger.entries);
    for (const forbidden of [KEY, USER_TEXT, REPLY_TEXT, SYSTEM_PROMPT, "upstream-body-should-not-leak"]) {
      assert.ok(!dump.includes(forbidden), `log leaked: ${forbidden}`);
    }
    for (const [, entry] of logger.entries) {
      assert.deepEqual(Object.keys(entry).sort(), ["ms", "provider", "reason", "status"]);
    }
  });

  test("failure results never carry the key, body or message text", async () => {
    const fetchImpl = makeFetch({ [GEMINI_HOST]: status(422) });
    const r = await run(fetchImpl);
    const dump = JSON.stringify(r);
    assert.ok(!dump.includes(KEY) && !dump.includes(USER_TEXT));
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
