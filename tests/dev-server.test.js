import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  contentTypeFor,
  resolveStaticPath,
  loadEnvLocal,
  describeProviderKeys,
  createMockFetch,
  isAllowedHost,
  parseCliArgs,
  startServer,
  MOCK_MODES,
  FAKE_KEY,
} from "../scripts/dev-server.js";
import { PROVIDERS } from "../api/_lib/config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUIET = { info() {}, warn() {}, error() {} };
const SECRET_VALUE = "super-secret-value-do-not-print";

function chatBody(text = "Why should I hire Shahriar?") {
  return JSON.stringify({ messages: [{ role: "user", content: text }] });
}

/** Raw HTTP request: fetch() normalises dot segments, http.request does not. */
function rawGet(port, rawPath, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: rawPath, method, headers, agent: false },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("contentTypeFor", () => {
  const cases = {
    "a.html": "text/html; charset=utf-8",
    "a.js": "text/javascript; charset=utf-8",
    "a.css": "text/css; charset=utf-8",
    "a.svg": "image/svg+xml",
    "a.png": "image/png",
    "a.jpg": "image/jpeg",
    "a.jpeg": "image/jpeg",
    "a.pdf": "application/pdf",
    "a.woff2": "font/woff2",
    "a.json": "application/json; charset=utf-8",
    "a.webp": "image/webp",
    "a.ico": "image/x-icon",
    "A.PNG": "image/png",
  };
  for (const [file, type] of Object.entries(cases)) {
    test(`${file} -> ${type}`, () => assert.equal(contentTypeFor(file), type));
  }
  test("unknown extension is null (not served)", () => {
    assert.equal(contentTypeFor("a.md"), null);
    assert.equal(contentTypeFor("a"), null);
  });
});

describe("resolveStaticPath: allowlist", () => {
  const allowed = [
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/script.js", "script.js"],
    ["/style.css", "style.css"],
    ["/liquid-background.js", "liquid-background.js"],
    ["/images/agent-avatar.svg", path.join("images", "agent-avatar.svg")],
    ["/images/logo/js.png", path.join("images", "logo", "js.png")],
    ["/favicon/SID.png", path.join("favicon", "SID.png")],
    ["/fonts/x.woff2", path.join("fonts", "x.woff2")],
    ["/script.js?v=3#frag", "script.js"],
    ["/images/Certificate/certificate_student.pdf", path.join("images", "Certificate", "certificate_student.pdf")],
    ["/images/a%20b.png", path.join("images", "a b.png")],
  ];
  for (const [url, rel] of allowed) {
    test(`allows ${url}`, () => {
      const r = resolveStaticPath(ROOT, url);
      assert.equal(r.ok, true);
      assert.equal(r.file, path.join(ROOT, rel));
      assert.ok(r.contentType);
    });
  }

  const blocked = [
    "/.env",
    "/.env.local",
    "/.env.example",
    "/.git/config",
    "/.gitignore",
    "/.vercelignore",
    "/.agency/x/ledger.md",
    "/api/chat.js",
    "/api/_lib/persona.js",
    "/api/_lib/config.js",
    "/docs/plans/ai-chat-agent.md",
    "/tests/dev-server.test.js",
    "/scripts/dev-server.js",
    "/node_modules/x/index.js",
    "/package.json",
    "/package-lock.json",
    "/vercel.json",
    "/readme.md",
    "/Scripts/dev-server.js",
    "/API/_lib/persona.js",
    "/INDEX.HTML",
    "/images/.hidden.png",
    "/images/.env",
    "/images/README.md",
    "/images/",
    "/images",
    "/images/logo/",
    "/nonexistent-dir/x.js",
  ];
  for (const url of blocked) {
    test(`blocks ${url}`, () => {
      const r = resolveStaticPath(ROOT, url);
      assert.equal(r.ok, false);
      assert.ok([400, 403, 404].includes(r.status), `status ${r.status}`);
      assert.equal(r.file, undefined);
    });
  }
});

describe("resolveStaticPath: traversal and malformed input", () => {
  const bad = [
    "/../package.json",
    "/%2e%2e/package.json",
    "/%2E%2E/package.json",
    "/images/../package.json",
    "/images/%2e%2e/%2e%2e/package.json",
    "/images/..%2fpackage.json",
    "/images/..%2f..%2f.env.local",
    "/images/%5c..%5cpackage.json",
    "/images/..\\package.json",
    "/images\\agent-avatar.svg",
    "/images/a%00.png",
    "/images/a\u0000.png",
    "/images/%00/../../package.json",
    "//etc/passwd",
    "/images//agent-avatar.svg",
    "/C:/Windows/win.ini",
    "/images/C:/x.png",
    "/images/x.png:stream",
    "http://evil.example/index.html",
    "index.html",
    "",
    "/images/%zz.png",
    "/images/%c0%ae%c0%ae/package.json",
    "/images/./agent-avatar.svg",
    "/./index.html",
  ];
  for (const url of bad) {
    test(`rejects ${JSON.stringify(url)}`, () => {
      const r = resolveStaticPath(ROOT, url);
      assert.equal(r.ok, false);
      assert.ok([400, 403, 404].includes(r.status));
      assert.equal(r.file, undefined);
    });
  }

  test("no accepted path ever resolves outside the root", () => {
    const attempts = ["/images/" + "../".repeat(10) + "package.json", "/%2e%2e".repeat(5) + "/package.json"];
    for (const url of attempts) assert.equal(resolveStaticPath(ROOT, url).ok, false);
  });
});

describe("isAllowedHost", () => {
  test("accepts loopback names only", () => {
    for (const h of ["localhost", "localhost:3000", "127.0.0.1:3000", "127.0.0.1", "[::1]:3000", "LOCALHOST:3000"]) {
      assert.equal(isAllowedHost(h), true, h);
    }
    for (const h of ["evil.example", "evil.example:3000", "localhost.evil.example", "", undefined, "0.0.0.0:3000", "127.0.0.1.evil.example"]) {
      assert.equal(isAllowedHost(h), false, String(h));
    }
  });
});

describe("parseCliArgs", () => {
  test("defaults", () => {
    assert.deepEqual(parseCliArgs([], {}), { mock: false, port: 3000 });
  });
  test("--mock variants", () => {
    assert.equal(parseCliArgs(["--mock"], {}).mock, "ok");
    assert.equal(parseCliArgs(["--mock=fatal"], {}).mock, "fatal");
    assert.equal(parseCliArgs(["--mock=slow"], {}).mock, "slow");
  });
  test("--port and PORT", () => {
    assert.equal(parseCliArgs(["--port", "4000"], {}).port, 4000);
    assert.equal(parseCliArgs(["--port=4001"], {}).port, 4001);
    assert.equal(parseCliArgs([], { PORT: "4002" }).port, 4002);
    assert.equal(parseCliArgs(["--port=4003"], { PORT: "4002" }).port, 4003);
  });
  test("rejects bad input", () => {
    assert.throws(() => parseCliArgs(["--mock=nope"], {}), /mock/i);
    assert.throws(() => parseCliArgs(["--port=abc"], {}), /port/i);
    assert.throws(() => parseCliArgs(["--port=70000"], {}), /port/i);
    assert.throws(() => parseCliArgs(["--wat"], {}), /unknown/i);
  });
  test("--port without a value is an error, never a silent default", () => {
    assert.throws(() => parseCliArgs(["--port"], {}), /port.*(requires|value)/i);
    assert.throws(() => parseCliArgs(["--port", "--mock"], {}), /port.*(requires|value)/i);
    assert.throws(() => parseCliArgs(["--port="], {}), /port/i);
    assert.throws(() => parseCliArgs(["--mock", "--port"], {}), /port/i);
  });
  test("non-numeric and out-of-range ports are errors", () => {
    for (const bad of ["abc", "3000x", "4e3", "-1", "1.5", "65536", "70000", " ", "0x10"]) {
      assert.throws(() => parseCliArgs([`--port=${bad}`], {}), /port/i, bad);
    }
    assert.throws(() => parseCliArgs([], { PORT: "abc" }), /port/i);
    assert.equal(parseCliArgs(["--port=0"], {}).port, 0);
    assert.equal(parseCliArgs(["--port=65535"], {}).port, 65535);
    assert.equal(parseCliArgs([], { PORT: "" }).port, 3000);
  });
});

describe(".env.local loading (Node's process.loadEnvFile)", () => {
  /** Runs fn with a temp env file in the OS temp dir; removes the file and the given vars after. */
  function withEnvFile(text, vars, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devsrv-env-"));
    const saved = Object.fromEntries(vars.map((k) => [k, process.env[k]]));
    try {
      const file = path.join(dir, ".env.local");
      fs.writeFileSync(file, text);
      return fn(file);
    } finally {
      for (const k of vars) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  function captureConsole(fn) {
    const lines = [];
    const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
    console.log = console.warn = console.error = console.info = (...a) => lines.push(a.join(" "));
    try {
      return { result: fn(), lines };
    } finally {
      Object.assign(console, orig);
    }
  }

  test("loads values, ignores comments, strips inline comments", () => {
    const vars = ["DEVSRV_T_A", "DEVSRV_T_B", "DEVSRV_T_C"];
    withEnvFile(
      ["# full-line comment", "", "DEVSRV_T_A=abc # a note", 'DEVSRV_T_B="keeps # inside quotes"', "export DEVSRV_T_C=1", ""].join("\n"),
      vars,
      (file) => {
        for (const k of vars) delete process.env[k];
        assert.deepEqual(loadEnvLocal(file), { found: true });
        assert.equal(process.env.DEVSRV_T_A, "abc");
        assert.equal(process.env.DEVSRV_T_B, "keeps # inside quotes");
        assert.equal(process.env.DEVSRV_T_C, "1");
      },
    );
  });

  test("never overwrites a variable that is already set", () => {
    withEnvFile("DEVSRV_T_KEEP=from-file\nDEVSRV_T_NEW=new\n", ["DEVSRV_T_KEEP", "DEVSRV_T_NEW"], (file) => {
      process.env.DEVSRV_T_KEEP = "already-set";
      delete process.env.DEVSRV_T_NEW;
      loadEnvLocal(file);
      assert.equal(process.env.DEVSRV_T_KEEP, "already-set");
      assert.equal(process.env.DEVSRV_T_NEW, "new");
    });
  });

  test("a missing file is fine", () => {
    const missing = path.join(os.tmpdir(), "devsrv-definitely-missing", ".env.local");
    assert.deepEqual(loadEnvLocal(missing), { found: false });
  });

  test("an unreadable path (a directory) is fine too", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devsrv-env-"));
    try {
      assert.equal(loadEnvLocal(dir).found, false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("values are never printed or returned", () => {
    withEnvFile(`GROQ_API_KEY=${SECRET_VALUE}\n`, ["GROQ_API_KEY"], (file) => {
      delete process.env.GROQ_API_KEY;
      const { result, lines } = captureConsole(() => {
        const r = loadEnvLocal(file);
        return { r, desc: describeProviderKeys(process.env) };
      });
      assert.ok(!JSON.stringify(result).includes(SECRET_VALUE));
      assert.ok(!lines.join("\n").includes(SECRET_VALUE));
      assert.match(result.desc, /groq: yes/);
    });
  });
});

describe("describeProviderKeys", () => {
  test("reports only yes/no per provider", () => {
    assert.equal(describeProviderKeys({}), "groq: no");
    assert.equal(
      describeProviderKeys({ GROQ_API_KEY: SECRET_VALUE }),
      "groq: yes",
    );
  });
});

describe("createMockFetch", () => {
  const call = (fetchImpl, id, init = {}) =>
    fetchImpl(PROVIDERS[id].url, { method: "POST", headers: {}, body: "{}", ...init });

  test("ok: groq answers 200 with an OpenAI-shaped, witty reply", async () => {
    const f = createMockFetch("ok", { delayMs: 0 });
    const res = await call(f, "groq");
    assert.equal(res.status, 200);
    const data = await res.json();
    const text = data.choices[0].message.content;
    assert.equal(typeof text, "string");
    assert.ok(text.length > 20);
  });

  test("fatal: first provider gives 422", async () => {
    const f = createMockFetch("fatal", { delayMs: 0 });
    assert.equal((await call(f, "groq")).status, 422);
  });

  test("unauthorized: Groq gives 401", async () => {
    const f = createMockFetch("unauthorized", { delayMs: 0 });
    assert.equal((await call(f, "groq")).status, 401);
  });

  test("down and fail: every provider gives 503", async () => {
    for (const mode of ["down", "fail"]) {
      const f = createMockFetch(mode, { delayMs: 0 });
      for (const id of ["groq"]) assert.equal((await call(f, id)).status, 503, `${mode}/${id}`);
    }
  });

  test("ratelimit behaves like ok", async () => {
    const f = createMockFetch("ratelimit", { delayMs: 0 });
    assert.equal((await call(f, "groq")).status, 200);
  });

  test("slow: delays, then succeeds", async () => {
    const f = createMockFetch("slow", { delayMs: 60 });
    const start = Date.now();
    const res = await call(f, "groq");
    assert.equal(res.status, 200);
    assert.ok(Date.now() - start >= 50);
  });

  test("slow defaults to about 3 s and ok to under 1 s", () => {
    assert.equal(MOCK_MODES.slow.delayMs, 3000);
    assert.ok(MOCK_MODES.ok.delayMs < 1000);
  });

  test("delay honours abort and leaves no timer behind", async () => {
    const f = createMockFetch("slow", { delayMs: 60_000 });
    const ctl = new AbortController();
    const p = call(f, "groq", { signal: ctl.signal });
    setTimeout(() => ctl.abort(), 10);
    await assert.rejects(p, (err) => err.name === "AbortError");
  });

  test("unknown URLs are refused instead of reaching the network", async () => {
    const f = createMockFetch("ok", { delayMs: 0 });
    await assert.rejects(f("https://example.com/", { method: "POST" }), /mock/i);
  });

  test("the fake key is the agreed literal", () => {
    assert.equal(FAKE_KEY, "test-key-not-real");
  });

  test("unknown mode throws", () => {
    assert.throws(() => createMockFetch("nope"), /mock/i);
  });
});

describe("integration: server on an ephemeral port", () => {
  async function withServer(opts, fn) {
    const srv = await startServer({ port: 0, root: ROOT, mockDelayMs: 0, logger: QUIET, ...opts });
    try {
      assert.ok(srv.port > 0);
      await fn(srv);
    } finally {
      await srv.close();
    }
  }
  const envFor = (srv) => ({ ALLOWED_ORIGINS: `http://127.0.0.1:${srv.port}` });

  // The env must exist before the port is known; bind first with a permissive holder, then patch.
  async function chatServer(mode, fn, extra = {}) {
    const holder = { ALLOWED_ORIGINS: "" };
    await withServer({ mock: mode, env: holder, ...extra }, async (srv) => {
      holder.ALLOWED_ORIGINS = envFor(srv).ALLOWED_ORIGINS;
      await fn(srv, `http://127.0.0.1:${srv.port}`);
    });
  }
  const post = (origin, body = chatBody(), headers = {}) =>
    fetch(`${origin}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, ...headers },
      body,
    });

  test("binds to 127.0.0.1 only", async () => {
    await withServer({ mock: "ok" }, async (srv) => {
      const addr = srv.server.address();
      assert.equal(addr.address, "127.0.0.1");
    });
  });

  test("serves index.html, script.js and the avatar with the right types", async () => {
    await withServer({ mock: "ok" }, async (srv) => {
      const base = `http://127.0.0.1:${srv.port}`;
      const page = await fetch(`${base}/`);
      assert.equal(page.status, 200);
      assert.match(page.headers.get("content-type"), /^text\/html/);
      assert.equal(page.headers.get("cache-control"), "no-store");
      assert.equal(page.headers.get("x-content-type-options"), "nosniff");
      assert.equal(await page.text(), fs.readFileSync(path.join(ROOT, "index.html"), "utf8"));

      const js = await fetch(`${base}/script.js`);
      assert.match(js.headers.get("content-type"), /^text\/javascript/);
      await js.arrayBuffer();

      const svgPath = path.join(ROOT, "images", "agent-avatar.svg");
      if (fs.existsSync(svgPath)) {
        const svg = await fetch(`${base}/images/agent-avatar.svg`);
        assert.equal(svg.status, 200);
        assert.equal(svg.headers.get("content-type"), "image/svg+xml");
        assert.equal(Number(svg.headers.get("content-length")), fs.statSync(svgPath).size);
        await svg.arrayBuffer();
      }
    });
  });

  test("HEAD returns headers with no body; other methods on static get 405", async () => {
    await withServer({ mock: "ok" }, async (srv) => {
      const base = `http://127.0.0.1:${srv.port}`;
      const head = await fetch(`${base}/style.css`, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.match(head.headers.get("content-type"), /^text\/css/);
      assert.equal((await head.text()), "");

      const postStatic = await fetch(`${base}/style.css`, { method: "POST", body: "x" });
      assert.equal(postStatic.status, 405);
      assert.match(postStatic.headers.get("allow"), /GET/);
      await postStatic.arrayBuffer();
    });
  });

  test("missing public file is 404", async () => {
    await withServer({ mock: "ok" }, async (srv) => {
      const res = await fetch(`http://127.0.0.1:${srv.port}/images/definitely-missing.png`);
      assert.equal(res.status, 404);
      await res.arrayBuffer();
    });
  });

  test("never serves secrets, source or traversal targets", async () => {
    const pkg = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
    await withServer({ mock: "ok" }, async (srv) => {
      const paths = [
        "/../package.json",
        "/%2e%2e/package.json",
        "/images/../../package.json",
        "/images/..%2f..%2fpackage.json",
        "/images/%5c..%5cpackage.json",
        "/.env",
        "/.env.local",
        "/.git/HEAD",
        "/api/_lib/persona.js",
        "/api/chat.js",
        "/docs/plans/ai-chat-agent.md",
        "/tests/dev-server.test.js",
        "/scripts/dev-server.js",
        "/package.json",
        "/package-lock.json",
        "/node_modules/",
      ];
      for (const p of paths) {
        const res = await rawGet(srv.port, p);
        assert.ok([400, 403, 404].includes(res.status), `${p} -> ${res.status}`);
        assert.ok(!res.body.includes('"shahriars-portfolio"'), `${p} leaked package.json`);
        assert.notEqual(res.body, pkg);
      }
    });
  });

  test("rejects a foreign Host header (DNS rebinding)", async () => {
    await withServer({ mock: "ok" }, async (srv) => {
      const res = await rawGet(srv.port, "/", { headers: { Host: "evil.example" } });
      assert.equal(res.status, 403);
    });
  });

  test("POST /api/chat in mock mode 'ok' returns groq", async () => {
    await chatServer("ok", async (_srv, origin) => {
      const res = await post(origin);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.source, "groq");
      assert.equal(typeof data.reply, "string");
      assert.ok(data.reply.length > 0);
    });
  });

  test("mock 'fatal' -> 502 upstream_rejected", async () => {
    await chatServer("fatal", async (_s, origin) => {
      const res = await post(origin);
      assert.equal(res.status, 502);
      assert.equal((await res.json()).error.code, "upstream_rejected");
    });
  });

  test("mock 'unauthorized' -> canned fallback", async () => {
    await chatServer("unauthorized", async (_s, origin) => {
      const res = await post(origin);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).source, "fallback");
    });
  });

  test("mock 'down' and 'fail' -> 200 fallback", async () => {
    for (const mode of ["down", "fail"]) {
      await chatServer(mode, async (_s, origin) => {
        const res = await post(origin);
        assert.equal(res.status, 200);
        assert.equal((await res.json()).source, "fallback");
      });
    }
  });

  test("wrong Origin is refused by the handler", async () => {
    await chatServer("ok", async (_s, origin) => {
      const res = await post(origin, chatBody(), { origin: "http://evil.example" });
      assert.equal(res.status, 403);
      await res.arrayBuffer();
    });
  });

  test("GET /api/chat reaches the handler (405), not the static files", async () => {
    await chatServer("ok", async (_s, origin) => {
      const res = await fetch(`${origin}/api/chat`);
      assert.equal(res.status, 405);
      await res.arrayBuffer();
    });
  });

  test("oversized body is rejected with 413 and the response still arrives", async () => {
    await chatServer("ok", async (_s, origin) => {
      const res = await post(origin, JSON.stringify({ messages: [{ role: "user", content: "x".repeat(40_000) }] }));
      assert.equal(res.status, 413);
      await res.arrayBuffer();
    });
  });

  test("ratelimit mode uses the real limiter (429 after the per-minute cap)", async () => {
    await chatServer("ratelimit", async (_s, origin) => {
      const statuses = [];
      for (let i = 0; i < 8; i += 1) {
        const res = await post(origin);
        statuses.push(res.status);
        await res.arrayBuffer();
      }
      assert.ok(statuses.slice(0, 6).every((s) => s === 200), statuses.join(","));
      assert.ok(statuses.includes(429), statuses.join(","));
    });
  });

  test("non-ratelimit mock modes do not throttle UI development", async () => {
    await chatServer("ok", async (_s, origin) => {
      for (let i = 0; i < 8; i += 1) {
        const res = await post(origin);
        assert.equal(res.status, 200);
        await res.arrayBuffer();
      }
    });
  });

  test("a client-supplied x-forwarded-for does not dodge the limiter", async () => {
    await chatServer("ratelimit", async (_s, origin) => {
      let limited = false;
      for (let i = 0; i < 10; i += 1) {
        const res = await post(origin, chatBody(), { "x-forwarded-for": `198.51.100.${i}` });
        if (res.status === 429) limited = true;
        await res.arrayBuffer();
      }
      assert.ok(limited);
    });
  });

  test("mock mode never touches the real network", async () => {
    const realFetch = globalThis.fetch;
    const seen = [];
    // Count only calls to non-local hosts. The server's fetchImpl must be the mock.
    globalThis.fetch = (url, ...rest) => {
      const u = String(url instanceof Request ? url.url : url);
      if (!u.startsWith("http://127.0.0.1")) seen.push(u);
      return realFetch(url, ...rest);
    };
    try {
      await chatServer("ok", async (_s, origin) => {
        const res = await post(origin);
        assert.equal(res.status, 200);
        await res.arrayBuffer();
      });
    } finally {
      globalThis.fetch = realFetch;
    }
    assert.deepEqual(seen, []);
  });

  test("mock env carries fake keys only, even when real-looking keys are in the given env", async () => {
    const holder = {
      ALLOWED_ORIGINS: "",
      GROQ_API_KEY: SECRET_VALUE,
    };
    const seen = [];
    await withServer(
      { mock: "ok", env: holder, onMockRequest: (url, init) => seen.push(init.headers.Authorization) },
      async (srv) => {
        holder.ALLOWED_ORIGINS = `http://127.0.0.1:${srv.port}`;
        const res = await post(`http://127.0.0.1:${srv.port}`);
        const text = await res.text();
        assert.equal(res.status, 200);
        assert.ok(!text.includes(SECRET_VALUE));
      },
    );
    assert.deepEqual(seen, ["Bearer test-key-not-real"]);
    assert.ok(!JSON.stringify(seen).includes(SECRET_VALUE));
  });

  test("real mode without keys starts and the handler answers 503", async () => {
    const holder = { ALLOWED_ORIGINS: "" };
    await withServer({ env: holder }, async (srv) => {
      holder.ALLOWED_ORIGINS = `http://127.0.0.1:${srv.port}`;
      const res = await post(`http://127.0.0.1:${srv.port}`);
      assert.equal(res.status, 503);
      await res.arrayBuffer();
    });
  });

  /** Opens a raw TCP connection; collects everything received until the socket closes. */
  function rawConnect(port) {
    const socket = net.connect(port, "127.0.0.1");
    let data = "";
    socket.setEncoding("utf8");
    socket.on("data", (d) => (data += d));
    socket.on("error", () => {});
    const closed = new Promise((resolve) => socket.on("close", () => resolve(Date.now())));
    const waitFor = (re, ms = 3000) =>
      new Promise((resolve, reject) => {
        const t0 = Date.now();
        const tick = () => {
          if (re.test(data)) return resolve(data);
          if (Date.now() - t0 > ms) return reject(new Error(`timeout waiting for ${re}; got: ${data.slice(0, 200)}`));
          setTimeout(tick, 10);
        };
        tick();
      });
    return { socket, closed, waitFor, received: () => data };
  }

  const postHeaders = (port, extra) =>
    [
      "POST /api/chat HTTP/1.1",
      `Host: 127.0.0.1:${port}`,
      "Content-Type: application/json",
      ...extra,
      "",
      "",
    ].join("\r\n");

  const getCss = (port) => `GET /style.css HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`;

  test("a rejected POST with a large unread body does not stall the keep-alive connection", async () => {
    await chatServer("ok", async (srv) => {
      const c = rawConnect(srv.port);
      try {
        const body = "x".repeat(800_000);
        c.socket.write(postHeaders(srv.port, ["Origin: http://evil.example", `Content-Length: ${body.length}`]));
        c.socket.write(body);
        await c.waitFor(/HTTP\/1\.1 403/);
        // Same connection, next request.
        c.socket.write(getCss(srv.port));
        await c.waitFor(/HTTP\/1\.1 200[\s\S]*text\/css/);
      } finally {
        c.socket.destroy();
      }
    });
  });

  test("a trickled upload that is rejected early gets the socket closed once the drain budget is spent (bytes)", async () => {
    await chatServer("ok", async (srv) => {
      const c = rawConnect(srv.port);
      const t0 = Date.now();
      let timer;
      try {
        // Declared length is over the 16 KB cap, so the handler answers 413 without reading.
        c.socket.write(postHeaders(srv.port, [`Origin: http://127.0.0.1:${srv.port}`, "Content-Length: 50000000"]));
        c.socket.write("x".repeat(512));
        timer = setInterval(() => c.socket.write("x".repeat(512)), 20);
        await c.waitFor(/HTTP\/1\.1 413/);
        const closedAt = await Promise.race([c.closed, new Promise((r) => setTimeout(() => r(null), 2000))]);
        assert.ok(closedAt, "socket was not closed");
        assert.ok(closedAt - t0 < 1900);
      } finally {
        clearInterval(timer);
        c.socket.destroy();
      }
    }, { drainLimits: { maxBytes: 4096, maxMs: 5000 } });
  });

  test("a very slow upload is cut off by the drain time budget", async () => {
    await chatServer("ok", async (srv) => {
      const c = rawConnect(srv.port);
      const t0 = Date.now();
      let timer;
      try {
        c.socket.write(postHeaders(srv.port, [`Origin: http://127.0.0.1:${srv.port}`, "Content-Length: 50000000"]));
        timer = setInterval(() => c.socket.write("x"), 50);
        await c.waitFor(/HTTP\/1\.1 413/);
        const closedAt = await Promise.race([c.closed, new Promise((r) => setTimeout(() => r(null), 2000))]);
        assert.ok(closedAt, "socket was not closed");
        assert.ok(closedAt - t0 >= 250, "closed before the time budget");
      } finally {
        clearInterval(timer);
        c.socket.destroy();
      }
    }, { drainLimits: { maxBytes: 1_000_000, maxMs: 300 } });
  });

  test("a streamed body that exceeds the cap mid-read (413 via cancel) is also bounded", async () => {
    await chatServer("ok", async (srv) => {
      const c = rawConnect(srv.port);
      let timer;
      try {
        c.socket.write(postHeaders(srv.port, [`Origin: http://127.0.0.1:${srv.port}`, "Transfer-Encoding: chunked"]));
        const chunk = (n) => `${n.toString(16)}\r\n${"x".repeat(n)}\r\n`;
        c.socket.write(chunk(20_000)); // over the 16 KB cap: the handler cancels the stream
        timer = setInterval(() => c.socket.write(chunk(512)), 20);
        await c.waitFor(/HTTP\/1\.1 413/);
        const closedAt = await Promise.race([c.closed, new Promise((r) => setTimeout(() => r(null), 2000))]);
        assert.ok(closedAt, "socket was not closed");
      } finally {
        clearInterval(timer);
        c.socket.destroy();
      }
    }, { drainLimits: { maxBytes: 4096, maxMs: 5000 } });
  });

  test("an upload that finishes within the budget keeps the connection usable", async () => {
    await chatServer("ok", async (srv) => {
      const c = rawConnect(srv.port);
      try {
        const body = "x".repeat(2000);
        c.socket.write(postHeaders(srv.port, [`Origin: http://127.0.0.1:${srv.port}`, `Content-Length: 50000`]));
        c.socket.write(body);
        await c.waitFor(/HTTP\/1\.1 413/);
        c.socket.write("x".repeat(48_000)); // finish the declared 50000 bytes
        c.socket.write(getCss(srv.port));
        await c.waitFor(/HTTP\/1\.1 200[\s\S]*text\/css/);
      } finally {
        c.socket.destroy();
      }
    }, { drainLimits: { maxBytes: 1_000_000, maxMs: 5000 } });
  });

  test("close() releases the port", async () => {
    const srv = await startServer({ port: 0, root: ROOT, mock: "ok" });
    const { port } = srv;
    await srv.close();
    await assert.rejects(fetch(`http://127.0.0.1:${port}/`));
  });

  test("invalid mock mode is rejected by startServer", async () => {
    await assert.rejects(startServer({ port: 0, root: ROOT, mock: "nope" }), /mock/i);
  });
});

describe("CLI entry point", () => {
  function runCli(script, args) {
    const child = spawn(process.execPath, [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const exited = new Promise((resolve) => child.on("exit", (code) => resolve(code)));
    const waitFor = (re, ms = 5000) =>
      new Promise((resolve, reject) => {
        const t0 = Date.now();
        const tick = () => {
          if (re.test(out)) return resolve(out);
          if (Date.now() - t0 > ms) return reject(new Error(`timeout waiting for ${re}; got: ${out.slice(0, 300)}`));
          setTimeout(tick, 20);
        };
        tick();
      });
    return { child, exited, waitFor, output: () => out };
  }

  test("starts when invoked through a junction/symlink to the scripts directory", async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devsrv-link-"));
    const link = path.join(dir, "linked-scripts");
    try {
      try {
        fs.symlinkSync(path.join(ROOT, "scripts"), link, "junction");
      } catch {
        t.skip("cannot create a junction/symlink here");
        return;
      }
      const cli = runCli(path.join(link, "dev-server.js"), ["--mock", "--port", "0"]);
      try {
        const out = await cli.waitFor(/Dev server: http:\/\/localhost:\d+[\s\S]*Mode: mock/);
        assert.match(out, /Mode: mock/);
      } finally {
        cli.child.kill();
        await cli.exited;
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("--port with no value exits non-zero with a clear message", async () => {
    const cli = runCli(path.join(ROOT, "scripts", "dev-server.js"), ["--port"]);
    const code = await cli.exited;
    assert.notEqual(code, 0);
    assert.match(cli.output(), /port/i);
    assert.doesNotMatch(cli.output(), /Dev server: http/);
  });
});
