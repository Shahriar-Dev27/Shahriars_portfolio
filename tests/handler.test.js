import { test } from "node:test";
import assert from "node:assert/strict";

import { createHandler, handleChat } from "../api/_lib/handler.js";
import { createRateLimiter } from "../api/_lib/rate-limit.js";
import { FALLBACK_REPLIES, SYSTEM_PROMPT } from "../api/_lib/persona.js";
import { LIMITS } from "../api/_lib/config.js";

const FAKE_KEY = "test-key-not-real";
const ORIGIN = "http://localhost:3000";
const URL_ = `${ORIGIN}/api/chat`;
const BOTH_KEYS = { GEMINI_API_KEY: FAKE_KEY, MISTRAL_API_KEY: FAKE_KEY };

const USER_TEXT = "zebra-quokka-secret-question";
const CLIENT_IP = "203.0.113.77";

function chatBody(text = "Why should I hire Shahriar?") {
  return JSON.stringify({ messages: [{ role: "user", content: text }] });
}

function makeRequest({ method = "POST", headers = {}, body, omit = [] } = {}) {
  const h = { origin: ORIGIN, "content-type": "application/json", ...headers };
  for (const name of omit) delete h[name];
  const init = { method, headers: h };
  if (method !== "GET" && method !== "HEAD") init.body = body === undefined ? chatBody() : body;
  return new Request(URL_, init);
}

function silentLogger() {
  const lines = [];
  const rec = (level) => (...args) => lines.push({ level, args });
  return { info: rec("info"), warn: rec("warn"), error: rec("error"), lines };
}

function okResponse(text) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** fetch fake: handlers keyed by provider host, call log kept. */
function fakeFetch(byHost) {
  const calls = [];
  const fn = async (url, init) => {
    const host = new URL(url).host;
    calls.push(host);
    const handler = byHost[host];
    if (!handler) throw new Error(`unexpected host ${host}`);
    return typeof handler === "function" ? handler(url, init) : handler;
  };
  fn.calls = calls;
  return fn;
}

const GEMINI = "generativelanguage.googleapis.com";
const MISTRAL = "api.mistral.ai";
const GROQ = "api.groq.com";

function setup(overrides = {}) {
  const logger = overrides.logger ?? silentLogger();
  const fetchImpl = overrides.fetchImpl ?? fakeFetch({ [GEMINI]: () => okResponse("Gemini says hi.") });
  const limiter =
    overrides.limiter ?? createRateLimiter({ rules: [{ windowMs: 60_000, max: 100 }] });
  const env = overrides.env ?? BOTH_KEYS;
  const handler = createHandler({ env, fetchImpl, limiter, logger, random: () => 0 });
  return { handler, logger, fetchImpl, limiter, env };
}

async function errorOf(res) {
  const json = await res.json();
  assert.equal(typeof json.error, "object");
  assert.equal(typeof json.error.code, "string");
  assert.equal(typeof json.error.message, "string");
  assert.ok(json.error.message.length > 0);
  assert.deepEqual(Object.keys(json), ["error"]);
  return json.error;
}

function assertStandardHeaders(res) {
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
}

function assertNoCors(res) {
  for (const [name] of res.headers) {
    assert.ok(!name.toLowerCase().startsWith("access-control-"), `unexpected CORS header ${name}`);
  }
}

test("GET -> 405 method_not_allowed with Allow: POST", async () => {
  const { handler, fetchImpl } = setup();
  const res = await handler(makeRequest({ method: "GET" }));
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST");
  assert.equal((await errorOf(res)).code, "method_not_allowed");
  assertStandardHeaders(res);
  assertNoCors(res);
  assert.equal(fetchImpl.calls.length, 0);
});

test("OPTIONS -> 405 with no CORS headers at all", async () => {
  const { handler } = setup();
  const res = await handler(
    makeRequest({
      method: "OPTIONS",
      headers: { "access-control-request-method": "POST" },
    }),
  );
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST");
  assert.equal((await errorOf(res)).code, "method_not_allowed");
  assertStandardHeaders(res);
  assertNoCors(res);
});

test("cross-origin -> 403 forbidden_origin and no provider call", async () => {
  const { handler, fetchImpl } = setup();
  const res = await handler(makeRequest({ headers: { origin: "https://evil.com" } }));
  assert.equal(res.status, 403);
  assert.equal((await errorOf(res)).code, "forbidden_origin");
  assertStandardHeaders(res);
  assertNoCors(res);
  assert.equal(fetchImpl.calls.length, 0);
});

test("missing Origin -> 403 forbidden_origin", async () => {
  const { handler, fetchImpl } = setup();
  const res = await handler(makeRequest({ omit: ["origin"] }));
  assert.equal(res.status, 403);
  assert.equal((await errorOf(res)).code, "forbidden_origin");
  assert.equal(fetchImpl.calls.length, 0);
});

test("the injected env is what isAllowedRequest sees", async () => {
  const env = { ...BOTH_KEYS, VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://example.com" };
  const { handler } = setup({ env });
  // localhost is only allowed when VERCEL_ENV is unset/development, so the default process.env would allow it.
  const denied = await handler(makeRequest());
  assert.equal(denied.status, 403);
  const allowed = await handler(makeRequest({ headers: { origin: "https://example.com" } }));
  assert.equal(allowed.status, 200);
});

test("wrong content-type -> 415 unsupported_media_type", async () => {
  const { handler } = setup();
  const res = await handler(makeRequest({ headers: { "content-type": "text/plain" } }));
  assert.equal(res.status, 415);
  assert.equal((await errorOf(res)).code, "unsupported_media_type");
  assertStandardHeaders(res);
});

test("missing content-type -> 415", async () => {
  const { handler } = setup();
  const req = new Request(URL_, { method: "POST", headers: { origin: ORIGIN } });
  const res = await handler(req);
  assert.equal(res.status, 415);
});

test("content-type check is case-insensitive and accepts a charset parameter", async () => {
  const { handler } = setup();
  const res = await handler(
    makeRequest({ headers: { "content-type": "Application/JSON; charset=utf-8" } }),
  );
  assert.equal(res.status, 200);
});

test("rate limit -> 429 rate_limited with numeric Retry-After", async () => {
  const limiter = createRateLimiter({ rules: [{ windowMs: 60_000, max: 1 }] });
  const { handler } = setup({ limiter });
  const first = await handler(makeRequest());
  assert.equal(first.status, 200);
  const second = await handler(makeRequest());
  assert.equal(second.status, 429);
  assert.equal((await errorOf(second)).code, "rate_limited");
  assert.match(second.headers.get("retry-after"), /^\d+$/);
  assert.ok(Number(second.headers.get("retry-after")) >= 1);
  assertStandardHeaders(second);
});

test("rate limiter is keyed by x-forwarded-for", async () => {
  const seen = [];
  const limiter = { check: (key) => (seen.push(key), { allowed: true, retryAfterSeconds: 0 }) };
  const { handler } = setup({ limiter });
  await handler(makeRequest({ headers: { "x-forwarded-for": `${CLIENT_IP}, 10.0.0.1` } }));
  assert.deepEqual(seen, [CLIENT_IP]);
});

test("body over 16,384 via Content-Length -> 413 payload_too_large", async () => {
  const { handler, fetchImpl } = setup();
  const res = await handler(
    makeRequest({ body: chatBody("x".repeat(20_000)), headers: { "content-length": "20100" } }),
  );
  assert.equal(res.status, 413);
  assert.equal((await errorOf(res)).code, "payload_too_large");
  assertStandardHeaders(res);
  assert.equal(fetchImpl.calls.length, 0);
});

test("20,000-byte body -> 413", async () => {
  const { handler } = setup();
  const res = await handler(makeRequest({ body: chatBody("x".repeat(20_000)) }));
  assert.equal(res.status, 413);
});

test("body exactly at the cap is read, not rejected as too large", async () => {
  const { handler } = setup();
  const pad = " ".repeat(LIMITS.MAX_BODY_BYTES - chatBody("hi").length);
  const body = chatBody("hi") + pad;
  assert.equal(Buffer.byteLength(body), LIMITS.MAX_BODY_BYTES);
  const res = await handler(makeRequest({ body }));
  assert.equal(res.status, 200);
});

test("oversize streamed body with no Content-Length -> 413 and the stream is cancelled", async () => {
  const { handler } = setup();
  let pulls = 0;
  let cancelled = false;
  const chunk = new TextEncoder().encode("x".repeat(4096));
  const stream = new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls > 1000) controller.close(); // would be ~4 MB if never bounded
      else controller.enqueue(chunk);
    },
    cancel() {
      cancelled = true;
    },
  });
  const req = new Request(URL_, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: stream,
    duplex: "half",
  });
  assert.equal(req.headers.get("content-length"), null);
  const res = await handler(req);
  assert.equal(res.status, 413);
  assert.equal((await errorOf(res)).code, "payload_too_large");
  assert.equal(cancelled, true);
  assert.ok(pulls < 50, `read too much of the stream (${pulls} pulls)`);
});

test("lying (small) Content-Length with an oversize actual body -> 413", async () => {
  const { handler } = setup();
  const req = {
    method: "POST",
    headers: new Headers({
      origin: ORIGIN,
      "content-type": "application/json",
      "content-length": "50",
    }),
    body: new Blob([chatBody("x".repeat(20_000))]).stream(),
  };
  const res = await handler(req);
  assert.equal(res.status, 413);
});

test("multi-byte body is measured in bytes, not characters", async () => {
  const { handler } = setup();
  // 450 chars x 3 bytes in JSON as raw UTF-8 is ~1.4 KB: fine. 6,000 x 3 bytes = 18 KB: too big.
  const res = await handler(makeRequest({ body: chatBody("€".repeat(6_000)) }));
  assert.equal(res.status, 413);
});

test("bad JSON -> 400 invalid_json", async () => {
  const { handler } = setup();
  const res = await handler(makeRequest({ body: "{" }));
  assert.equal(res.status, 400);
  assert.equal((await errorOf(res)).code, "invalid_json");
});

test("bad shape -> 400 invalid_request", async () => {
  const { handler } = setup();
  for (const body of [
    JSON.stringify({ messages: [{ role: "system", content: "x" }] }),
    JSON.stringify({ messages: [] }),
    JSON.stringify({ nope: true }),
    JSON.stringify([]),
    JSON.stringify({ messages: [{ role: "assistant", content: "hi" }] }),
  ]) {
    const res = await handler(makeRequest({ body }));
    assert.equal(res.status, 400, body);
    assert.equal((await errorOf(res)).code, "invalid_request", body);
  }
});

test("501-char last user message -> 400 message_too_long", async () => {
  const { handler, fetchImpl } = setup();
  const res = await handler(makeRequest({ body: chatBody("a".repeat(501)) }));
  assert.equal(res.status, 400);
  const err = await errorOf(res);
  assert.equal(err.code, "message_too_long");
  assert.equal(fetchImpl.calls.length, 0);
});

test("no provider keys -> 503 not_configured, chain never called, error logged without data", async () => {
  const { handler, fetchImpl, logger } = setup({ env: {} });
  const res = await handler(makeRequest());
  assert.equal(res.status, 503);
  assert.equal((await errorOf(res)).code, "not_configured");
  assertStandardHeaders(res);
  assert.equal(fetchImpl.calls.length, 0);
  assert.deepEqual(
    logger.lines.filter((l) => l.level === "error").map((l) => l.args),
    [[{ reason: "no_provider_keys" }]],
  );
});

test("empty-string keys count as not configured", async () => {
  const { handler } = setup({ env: { GEMINI_API_KEY: "", MISTRAL_API_KEY: "" } });
  const res = await handler(makeRequest());
  assert.equal(res.status, 503);
});

test("success: Gemini 200 -> {reply, source:gemini} with cleaned text", async () => {
  const fetchImpl = fakeFetch({ [GEMINI]: () => okResponse("**Bold** move, `friend`.\n\n\n\n- Done.") });
  const { handler } = setup({ fetchImpl });
  const res = await handler(makeRequest());
  assert.equal(res.status, 200);
  assertStandardHeaders(res);
  assertNoCors(res);
  const json = await res.json();
  assert.deepEqual(Object.keys(json).sort(), ["reply", "source"]);
  assert.equal(json.source, "gemini");
  assert.equal(json.reply, "Bold move, friend.\n\nDone.");
});

test("Gemini 429 then Mistral 200 -> source mistral", async () => {
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 429 }),
    [MISTRAL]: () => okResponse("Mistral here."),
  });
  const { handler } = setup({ fetchImpl });
  const json = await (await handler(makeRequest())).json();
  assert.equal(json.source, "mistral");
  assert.equal(json.reply, "Mistral here.");
  assert.deepEqual(fetchImpl.calls, [GEMINI, MISTRAL]);
});

for (const status of [400, 401, 403]) {
  test(`Gemini ${status} falls through to Mistral -> 200 source mistral`, async () => {
    const fetchImpl = fakeFetch({
      [GEMINI]: () => new Response("{}", { status }),
      [MISTRAL]: () => okResponse("Mistral rescue."),
    });
    const { handler } = setup({ fetchImpl });
    const res = await handler(makeRequest());
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.source, "mistral");
    assert.deepEqual(fetchImpl.calls, [GEMINI, MISTRAL]);
  });
}

test("Gemini 422 -> 502 upstream_rejected and Mistral is never called", async () => {
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 422 }),
    [MISTRAL]: () => okResponse("should not be reached"),
  });
  const { handler } = setup({ fetchImpl });
  const res = await handler(makeRequest());
  assert.equal(res.status, 502);
  const err = await errorOf(res);
  assert.equal(err.code, "upstream_rejected");
  assertStandardHeaders(res);
  assert.deepEqual(fetchImpl.calls, [GEMINI]);
  assert.ok(FALLBACK_REPLIES.upstream.includes(err.message));
});

test("every provider 429 -> 200 source fallback with an allDown text", async () => {
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 429 }),
    [MISTRAL]: () => new Response("{}", { status: 429 }),
    [GROQ]: () => new Response("{}", { status: 429 }),
  });
  const { handler } = setup({ fetchImpl, env: { ...BOTH_KEYS, GROQ_API_KEY: FAKE_KEY } });
  const res = await handler(makeRequest());
  assert.equal(res.status, 200);
  assertStandardHeaders(res);
  const json = await res.json();
  assert.equal(json.source, "fallback");
  assert.ok(FALLBACK_REPLIES.allDown.includes(json.reply));
  assert.deepEqual(fetchImpl.calls, [GEMINI, MISTRAL, GROQ]);
});

test("both providers 503 -> 200 fallback", async () => {
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 503 }),
    [MISTRAL]: () => new Response("{}", { status: 503 }),
  });
  const { handler } = setup({ fetchImpl });
  const json = await (await handler(makeRequest())).json();
  assert.equal(json.source, "fallback");
  assert.ok(FALLBACK_REPLIES.allDown.includes(json.reply));
});

test("thrown fetch errors never leak details and never produce a 500", async () => {
  const secret = `boom-${FAKE_KEY}-${CLIENT_IP}-${USER_TEXT}`;
  const logger = silentLogger();
  const fetchImpl = () => {
    throw new Error(secret);
  };
  const { handler } = setup({ fetchImpl, logger });
  const res = await handler(
    makeRequest({ body: chatBody(USER_TEXT), headers: { "x-forwarded-for": CLIENT_IP } }),
  );
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes("boom"));
  assert.ok(!text.includes(FAKE_KEY));
  assert.equal(JSON.parse(text).source, "fallback");
  assert.ok(!JSON.stringify(logger.lines).includes("boom"));
});

test("unexpected internal error -> 200 fallback, logger.error({reason:'unhandled'}), no stack", async () => {
  const logger = silentLogger();
  const limiter = {
    check() {
      throw new Error(`kaboom ${USER_TEXT}`);
    },
  };
  const { handler } = setup({ limiter, logger });
  const res = await handler(makeRequest());
  assert.equal(res.status, 200);
  assertStandardHeaders(res);
  assert.equal((await res.json()).source, "fallback");
  assert.deepEqual(
    logger.lines.filter((l) => l.level === "error").map((l) => l.args),
    [[{ reason: "unhandled", status: "other" }]],
  );
  assert.ok(!JSON.stringify(logger.lines).includes("kaboom"));
});

test("unhandled log carries only a whitelisted built-in error name", async () => {
  const names = ["TypeError", "RangeError", "SyntaxError", "ReferenceError", "AbortError", "TimeoutError"];
  const make = (name) => {
    const err = new Error(`secret ${USER_TEXT} ${FAKE_KEY}`);
    err.name = name;
    return err;
  };
  for (const name of [...names, "EvilCustomError", "Error"]) {
    const logger = silentLogger();
    const limiter = {
      check() {
        throw make(name);
      },
    };
    const { handler } = setup({ limiter, logger });
    const res = await handler(makeRequest());
    assert.equal(res.status, 200);
    const errors = logger.lines.filter((l) => l.level === "error");
    assert.equal(errors.length, 1);
    assert.deepEqual(errors[0].args, [
      { reason: "unhandled", status: names.includes(name) ? name : "other" },
    ]);
    const dump = JSON.stringify(logger.lines);
    assert.ok(!dump.includes(USER_TEXT) && !dump.includes(FAKE_KEY) && !dump.includes("EvilCustomError"));
  }
  // A thrown non-Error value (null) is also reported as "other".
  const logger = silentLogger();
  const limiter = {
    check() {
      throw null;
    },
  };
  await setup({ limiter, logger }).handler(makeRequest());
  assert.deepEqual(
    logger.lines.map((l) => l.args),
    [[{ reason: "unhandled", status: "other" }]],
  );
});

/** Request-like object whose headers are exactly as given (a real Request may rewrite content-length). */
function rawRequest({ headers = {}, body }) {
  const stream = new ReadableStream({
    start(c) {
      if (body !== undefined) c.enqueue(new TextEncoder().encode(body));
      c.close();
    },
  });
  return {
    method: "POST",
    headers: new Headers({ origin: ORIGIN, "content-type": "application/json", ...headers }),
    body: stream,
  };
}

test("declared Content-Length over the cap alone -> 413 (small valid body) and the body is cancelled", async () => {
  const { handler, fetchImpl } = setup();
  const req = rawRequest({ headers: { "content-length": "99999" }, body: chatBody() });
  let cancelCalled = false;
  const origCancel = req.body.cancel.bind(req.body);
  req.body.cancel = (...args) => {
    cancelCalled = true;
    return origCancel(...args);
  };
  const res = await handler(req);
  assert.equal(res.status, 413);
  assert.equal((await errorOf(res)).code, "payload_too_large");
  assert.equal(cancelCalled, true);
  assert.equal(fetchImpl.calls.length, 0);
});

test("early 413 survives a body whose cancel() rejects or throws", async () => {
  const cancels = [
    () => Promise.reject(new Error("nope")),
    () => {
      throw new Error("nope");
    },
  ];
  for (const cancel of cancels) {
    const { handler } = setup();
    const req = rawRequest({ headers: { "content-length": "99999" }, body: chatBody() });
    req.body = { cancel };
    const res = await handler(req);
    assert.equal(res.status, 413);
  }
});

for (const value of ["10, 10", "abc", "-1", "1e9", ""]) {
  test(`non-numeric or duplicated Content-Length (${JSON.stringify(value)}) falls through to the bounded read`, async () => {
    const { handler } = setup();
    const res = await handler(rawRequest({ headers: { "content-length": value }, body: chatBody() }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).source, "gemini");
  });
}

test("a body stream that errors mid-read -> 200 fallback with the unhandled log line", async () => {
  const logger = silentLogger();
  const { handler } = setup({ logger });
  let sent = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (!sent) {
        sent = true;
        controller.enqueue(new TextEncoder().encode('{"messages":'));
      } else {
        controller.error(new TypeError(`socket died ${USER_TEXT}`));
      }
    },
  });
  const res = await handler({
    method: "POST",
    headers: new Headers({ origin: ORIGIN, "content-type": "application/json" }),
    body: stream,
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.source, "fallback");
  assert.ok(FALLBACK_REPLIES.allDown.includes(json.reply));
  assert.deepEqual(
    logger.lines.filter((l) => l.level === "error").map((l) => l.args),
    [[{ reason: "unhandled", status: "TypeError" }]],
  );
  assert.ok(!JSON.stringify(logger.lines).includes(USER_TEXT));
});

test("Retry-After only on 429 and Allow only on 405", async () => {
  const limiter = createRateLimiter({ rules: [{ windowMs: 60_000, max: 1 }] });
  const { handler } = setup({ limiter });
  const responses = [
    await handler(makeRequest()), // 200
    await handler(makeRequest()), // 429
    await handler(makeRequest({ method: "GET" })), // 405
    await handler(makeRequest({ headers: { origin: "https://evil.com" } })), // 403
    await handler(makeRequest({ headers: { "content-type": "text/plain" } })), // 415
  ];
  assert.deepEqual(responses.map((r) => r.status), [200, 429, 405, 403, 415]);
  for (const res of responses) {
    assert.equal(res.headers.get("retry-after") !== null, res.status === 429, `retry-after on ${res.status}`);
    assert.equal(res.headers.get("allow") !== null, res.status === 405, `allow on ${res.status}`);
  }
  const { handler: unconfigured } = setup({ env: {} });
  for (const res of [await unconfigured(makeRequest({ body: "{" })), await unconfigured(makeRequest())]) {
    assert.equal(res.headers.get("retry-after"), null);
    assert.equal(res.headers.get("allow"), null);
  }
});

test("the outgoing provider request has SYSTEM_PROMPT first and the user message last", async () => {
  let sent;
  const fetchImpl = fakeFetch({
    [GEMINI]: (_url, init) => {
      sent = JSON.parse(init.body);
      return okResponse("ok.");
    },
  });
  const { handler } = setup({ fetchImpl });
  const body = JSON.stringify({
    messages: [
      { role: "user", content: "first question" },
      { role: "assistant", content: "first answer" },
      { role: "user", content: USER_TEXT },
    ],
  });
  const res = await handler(makeRequest({ body }));
  assert.equal(res.status, 200);
  assert.deepEqual(sent.messages[0], { role: "system", content: SYSTEM_PROMPT });
  assert.deepEqual(sent.messages.at(-1), { role: "user", content: USER_TEXT });
  assert.deepEqual(sent.messages.slice(1).map((m) => m.role), ["user", "assistant", "user"]);
});

test("a 900-char provider reply is capped at 700 chars in the response", async () => {
  const fetchImpl = fakeFetch({ [GEMINI]: () => okResponse("word ".repeat(180)) });
  const { handler } = setup({ fetchImpl });
  const json = await (await handler(makeRequest())).json();
  assert.equal(json.source, "gemini");
  assert.ok(json.reply.length > 0 && json.reply.length <= LIMITS.MAX_REPLY_CHARS, String(json.reply.length));
});

test("Gemini 429 then Mistral 422 -> 502 upstream_rejected", async () => {
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 429 }),
    [MISTRAL]: () => new Response("{}", { status: 422 }),
  });
  const { handler } = setup({ fetchImpl, env: { ...BOTH_KEYS, GROQ_API_KEY: FAKE_KEY } });
  const res = await handler(makeRequest());
  assert.equal(res.status, 502);
  assert.equal((await errorOf(res)).code, "upstream_rejected");
  assert.deepEqual(fetchImpl.calls, [GEMINI, MISTRAL]);
});

test("logs never contain user text, the client IP, the key, or the reply", async () => {
  const logger = silentLogger();
  const REPLY = "unique-reply-marker-9917";
  const fetchImpl = fakeFetch({
    [GEMINI]: () => new Response("{}", { status: 500 }),
    [MISTRAL]: () => okResponse(REPLY),
  });
  const { handler } = setup({ fetchImpl, logger });
  const res = await handler(
    makeRequest({ body: chatBody(USER_TEXT), headers: { "x-forwarded-for": CLIENT_IP } }),
  );
  assert.equal((await res.json()).reply, REPLY);
  // Also exercise the failure paths so their lines are covered.
  await handler(makeRequest({ headers: { origin: "https://evil.com", "x-forwarded-for": CLIENT_IP } }));
  await handler(makeRequest({ body: "{", headers: { "x-forwarded-for": CLIENT_IP } }));

  assert.ok(logger.lines.length > 0);
  const dump = JSON.stringify(logger.lines);
  for (const forbidden of [USER_TEXT, CLIENT_IP, FAKE_KEY, REPLY, "Bearer"]) {
    assert.ok(!dump.includes(forbidden), `log leaked ${forbidden}`);
  }
  for (const { args } of logger.lines) {
    for (const arg of args) {
      assert.equal(typeof arg, "object");
      for (const key of Object.keys(arg)) {
        assert.ok(["provider", "status", "reason", "ms"].includes(key), `unexpected log key ${key}`);
      }
    }
  }
});

test("every error status has the standard headers, a safe message, and no CORS headers", async () => {
  const cases = [
    () => makeRequest({ method: "GET" }),
    () => makeRequest({ headers: { origin: "https://evil.com" } }),
    () => makeRequest({ headers: { "content-type": "text/plain" } }),
    () => makeRequest({ body: chatBody("x".repeat(20_000)) }),
    () => makeRequest({ body: "{" }),
    () => makeRequest({ body: JSON.stringify({ messages: "no" }) }),
    () => makeRequest({ body: chatBody("a".repeat(501)) }),
  ];
  for (const make of cases) {
    const { handler } = setup();
    const res = await handler(make());
    assert.ok(res.status >= 400 && res.status < 500);
    assertStandardHeaders(res);
    assertNoCors(res);
    await errorOf(res);
  }
});

test("error messages come from the in-character fallback pools", async () => {
  const { handler } = setup();
  const res = await handler(makeRequest({ method: "GET" }));
  const err = await errorOf(res);
  assert.ok(FALLBACK_REPLIES.methodNotAllowed.includes(err.message));
});

test("handleChat(request, deps) works with injected deps", async () => {
  const res = await handleChat(makeRequest(), {
    env: BOTH_KEYS,
    fetchImpl: fakeFetch({ [GEMINI]: () => okResponse("hello.") }),
    rateLimiter: createRateLimiter({ rules: [{ windowMs: 60_000, max: 5 }] }),
    logger: silentLogger(),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).source, "gemini");
});

test("api/chat.js default export exposes fetch(request)", async () => {
  const mod = await import("../api/chat.js");
  assert.equal(typeof mod.default.fetch, "function");
  // Default env/limiter: a forbidden origin is rejected before anything else happens.
  const res = await mod.default.fetch(makeRequest({ headers: { origin: "https://evil.com" } }));
  assert.equal(res.status, 403);
  assertStandardHeaders(res);
});
