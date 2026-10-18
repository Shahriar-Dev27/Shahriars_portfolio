import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProviderChain, runProviderChain } from "../api/_lib/providers.js";
import { createHandler } from "../api/_lib/handler.js";
import { LIMITS, PROVIDERS } from "../api/_lib/config.js";
import { createMockFetch, startServer } from "../scripts/dev-server.js";

const KEY = "test-key-not-real";
const ENV = { GROQ_API_KEY: KEY, NVIDIA_API_KEY: KEY };
const MESSAGES = [{ role: "user", content: "What is Shahriar's stack?" }];
const QUIET = { info() {}, warn() {}, error() {} };
const options = { systemPrompt: "Test system prompt.", logger: QUIET };
const ok = () => new Response(JSON.stringify({ choices: [{ message: {
  content: "NVIDIA backup reply.", reasoning_content: "private-reasoning-fixture",
} }] }));

test("NVIDIA is optional, second after Groq, and uses GPT-OSS 20B", () => {
  const [groq, nvidia] = buildProviderChain(ENV);
  assert.equal(groq.id, "groq");
  assert.equal(nvidia.id, "nvidia");
  assert.equal(nvidia.model, "openai/gpt-oss-20b");
  assert.deepEqual(nvidia.extraBody, { reasoning_effort: "low" });
  for (const key of [undefined, "", "   "]) {
    assert.deepEqual(buildProviderChain({ GROQ_API_KEY: KEY, NVIDIA_API_KEY: key }).map(p => p.id), ["groq"]);
  }
  const [only] = buildProviderChain({ NVIDIA_API_KEY: ` ${KEY} `, NVIDIA_MODEL: "custom-model" });
  assert.equal(only.id, "nvidia");
  assert.equal(only.apiKey, KEY);
  assert.equal(only.model, "custom-model");
});

test("a successful Groq reply does not call NVIDIA", async () => {
  const urls = [];
  const result = await runProviderChain(buildProviderChain(ENV), MESSAGES, {
    ...options, fetchImpl: async url => { urls.push(url); return ok(); },
  });
  assert.equal(result.source, "groq");
  assert.deepEqual(urls, [PROVIDERS.groq.url]);
});

for (const status of [400, 401, 403, 404, 422, 429, 500, 503]) {
  test(`Groq ${status} falls back to NVIDIA with its documented request format`, async () => {
    const calls = [];
    const result = await runProviderChain(buildProviderChain(ENV), MESSAGES, {
      ...options, fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return url === PROVIDERS.groq.url ? new Response("{}", { status }) : ok();
      },
    });
    assert.deepEqual(result, { ok: true, text: "NVIDIA backup reply.", source: "nvidia" });
    assert.deepEqual(calls.map(c => c.url), [PROVIDERS.groq.url, PROVIDERS.nvidia.url]);
    const { init } = calls[1];
    const body = JSON.parse(init.body);
    assert.equal(init.headers.Authorization, `Bearer ${KEY}`);
    assert.equal(init.redirect, "error");
    assert.equal(body.model, "openai/gpt-oss-20b");
    assert.equal(body.max_tokens, 1024);
    assert.equal(body.reasoning_effort, "low");
    assert.equal(body.stream, false);
    assert.equal(body.max_completion_tokens, undefined);
    assert.equal(body.include_reasoning, undefined);
    assert.equal(body.reasoning_format, undefined);
    assert.deepEqual(body.messages, [{ role: "system", content: options.systemPrompt }, ...MESSAGES]);
  });
}

for (const [name, response] of [
  ["network error", () => { throw new TypeError("fetch failed"); }],
  ["timeout", () => { throw new DOMException("timed out", "TimeoutError"); }],
  ["invalid JSON", () => new Response("not-json")],
  ["empty content", () => new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }))],
]) {
  test(`Groq ${name} falls back to NVIDIA`, async () => {
    const result = await runProviderChain(buildProviderChain(ENV), MESSAGES, {
      ...options, fetchImpl: async url => url === PROVIDERS.groq.url ? response() : ok(),
    });
    assert.equal(result.source, "nvidia");
  });
}

test("an exhausted total budget prevents the backup call", async () => {
  let time = 0;
  const urls = [];
  const result = await runProviderChain(buildProviderChain(ENV), MESSAGES, {
    ...options, now: () => time, fetchImpl: async url => {
      urls.push(url);
      time += LIMITS.TOTAL_BUDGET_MS;
      return new Response("{}", { status: 503 });
    },
  });
  assert.deepEqual(result, { ok: false, fatal: false });
  assert.deepEqual(urls, [PROVIDERS.groq.url]);
});

for (const [status, expected] of [[503, 200], [422, 502]]) {
  test(`both providers fail with ${status}: handler returns ${expected} safely`, async () => {
    let calls = 0;
    const handler = createHandler({ env: ENV, logger: QUIET,
      limiter: { check: () => ({ allowed: true }) },
      fetchImpl: async () => { calls++; return new Response("private-upstream-error", { status }); },
    });
    const res = await handler(new Request("http://localhost:3000/api/chat", {
      method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ messages: MESSAGES }),
    }));
    assert.equal(res.status, expected);
    assert.equal(calls, 2);
    const data = await res.json();
    assert.equal(status === 422 ? data.error.code : data.source, status === 422 ? "upstream_rejected" : "fallback");
    assert.ok(!JSON.stringify(data).includes("private-upstream-error"));
    assert.ok(!JSON.stringify(data).includes(KEY));
  });
}

test("local HTTP endpoint returns the NVIDIA backup when Groq is rate limited", async () => {
  const env = { ALLOWED_ORIGINS: "" };
  const urls = [];
  const server = await startServer({ port: 0, mock: "backup", env, mockDelayMs: 0,
    logger: QUIET, onMockRequest: url => urls.push(url),
  });
  try {
    const origin = `http://127.0.0.1:${server.port}`;
    env.ALLOWED_ORIGINS = origin;
    const res = await fetch(`${origin}/api/chat`, {
      method: "POST", headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ messages: MESSAGES }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.source, "nvidia");
    assert.ok(data.reply.startsWith("Mock reply from nvidia."));
    assert.deepEqual(urls, [PROVIDERS.groq.url, PROVIDERS.nvidia.url]);
  } finally {
    await server.close();
  }
});

test("the NVIDIA mock is available without using the network", async () => {
  const res = await createMockFetch("ok", { delayMs: 0 })(PROVIDERS.nvidia.url);
  assert.equal(res.status, 200);
});
