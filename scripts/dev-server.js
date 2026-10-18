/**
 * Local dev server: serves the static site and routes /api/chat to the real handler.
 *
 *   node scripts/dev-server.js                 real providers, keys from .env.local
 *   node scripts/dev-server.js --mock[=mode]   no keys, no network (see MOCK_MODES)
 *   node scripts/dev-server.js --port 4000     default 3000 (also PORT env)
 *
 * Binds to 127.0.0.1 only. Serves an explicit allowlist of public files (index.html, script.js,
 * style.css, liquid-background.js, images/, favicon/, fonts/). This is stricter than production,
 * which also serves files such as package.json, vercel.json and readme.md (.vercelignore only
 * excludes docs/, tests/, scripts/, .agency/ and .env*). Never prints env values.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import { handleChat } from "../api/_lib/handler.js";
import { createRateLimiter } from "../api/_lib/rate-limit.js";
import { PROVIDERS, PROVIDER_ORDER, RATE_LIMITS } from "../api/_lib/config.js";

/** Port the local dev server listens on when no PORT is given (matches DEV_ORIGINS). */
export const DEFAULT_PORT = 3000;
const HOST = "127.0.0.1";

/** The only fake key ever used; mock mode never needs a real one. */
export const FAKE_KEY = "test-key-not-real";

/* ------------------------------------------------------------------------------------ */
/* Static files                                                                          */
/* ------------------------------------------------------------------------------------ */

/** Top-level files that are served. Everything else at the top level is a 404. */
const PUBLIC_FILES = Object.freeze(["index.html", "script.js", "style.css", "liquid-background.js"]);
/** Top-level directories that are served (recursively, known extensions only). */
const PUBLIC_DIRS = Object.freeze(["images", "favicon", "fonts"]);

const CONTENT_TYPES = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
});

/**
 * Content-Type for a file name, or null when the extension is not servable.
 * @param {string} file
 * @returns {string | null}
 */
export function contentTypeFor(file) {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] ?? null;
}

const UNSAFE_SEGMENT = /[/\\:\u0000-\u001f\u007f]/;

/**
 * Maps a raw request target (path plus optional query) to a file inside the public set.
 * Pure: it does not touch the disk. Rejects traversal, NUL bytes, backslashes, drive
 * letters, dotfiles, empty segments and anything outside PUBLIC_FILES / PUBLIC_DIRS.
 * @param {string} root Absolute repo root.
 * @param {string} rawUrl Raw request target, e.g. "/images/a.png?v=1".
 * @returns {{ ok: true, file: string, contentType: string } | { ok: false, status: 400 | 403 | 404 }}
 */
export function resolveStaticPath(root, rawUrl) {
  const bad = (status) => ({ ok: false, status });
  if (typeof rawUrl !== "string" || !rawUrl.startsWith("/") || rawUrl.startsWith("//")) return bad(400);

  const rawPath = rawUrl.split(/[?#]/, 1)[0];
  if (/[\\\u0000-\u001f\u007f]/.test(rawPath)) return bad(400);

  if (rawPath === "/") return resolveSegments(root, ["index.html"]);

  // Split before decoding so an encoded slash can never become a separator.
  const segments = [];
  const parts = rawPath.slice(1).split("/");
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part === "") return i === parts.length - 1 ? bad(404) : bad(400); // directory or "//"
    let segment;
    try {
      segment = decodeURIComponent(part);
    } catch {
      return bad(400);
    }
    if (UNSAFE_SEGMENT.test(segment)) return bad(400);
    if (segment.startsWith(".")) return bad(segment === "." || segment === ".." ? 400 : 404);
    if (segment.endsWith(".") || segment.endsWith(" ")) return bad(400); // Windows strips these
    segments.push(segment);
  }
  return resolveSegments(root, segments);
}

function resolveSegments(root, segments) {
  const first = segments[0];
  const allowed = segments.length === 1 ? PUBLIC_FILES.includes(first) : PUBLIC_DIRS.includes(first);
  if (!allowed) return { ok: false, status: 404 };

  const contentType = contentTypeFor(segments[segments.length - 1]);
  if (!contentType) return { ok: false, status: 404 };

  const file = path.join(root, ...segments);
  if (!file.startsWith(root + path.sep)) return { ok: false, status: 403 }; // defence in depth
  return { ok: true, file, contentType };
}

/**
 * True for loopback Host headers only. A foreign Host means a DNS-rebinding attempt.
 * @param {string | undefined} host
 * @returns {boolean}
 */
export function isAllowedHost(host) {
  return typeof host === "string" && /^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/i.test(host);
}

/* ------------------------------------------------------------------------------------ */
/* .env.local                                                                            */
/* ------------------------------------------------------------------------------------ */

/**
 * Loads a .env file with Node's built-in parser (process.loadEnvFile). Variables that are
 * already set are never overwritten, and inline "#" comments are handled by Node. A missing
 * or unreadable file is not an error. Nothing is printed and no value is returned.
 * @param {string} file
 * @returns {{ found: boolean }}
 */
export function loadEnvLocal(file) {
  try {
    process.loadEnvFile(file);
    return { found: true };
  } catch {
    return { found: false };
  }
}

/**
 * "gemini: yes, mistral: no, groq: no". Presence only, never a value.
 * @param {Record<string, string | undefined>} env
 * @returns {string}
 */
export function describeProviderKeys(env) {
  return PROVIDER_ORDER.map((id) => `${id}: ${env[PROVIDERS[id].keyEnv] ? "yes" : "no"}`).join(", ");
}

/* ------------------------------------------------------------------------------------ */
/* Mock providers                                                                        */
/* ------------------------------------------------------------------------------------ */

/**
 * Mock modes. `statuses` maps provider id to the HTTP status it answers with (200 = a
 * canned reply). delayMs is applied before every answer.
 */
export const MOCK_MODES = Object.freeze({
  ok: { delayMs: 600, statuses: { gemini: 200, mistral: 200, groq: 200 } },
  slow: { delayMs: 3000, statuses: { gemini: 200, mistral: 200, groq: 200 } },
  fatal: { delayMs: 0, statuses: { gemini: 422, mistral: 200, groq: 200 } },
  fallthrough: { delayMs: 0, statuses: { gemini: 401, mistral: 200, groq: 200 } },
  down: { delayMs: 0, statuses: { gemini: 503, mistral: 503, groq: 503 } },
  fail: { delayMs: 0, statuses: { gemini: 503, mistral: 503, groq: 503 } },
  ratelimit: { delayMs: 600, statuses: { gemini: 200, mistral: 200, groq: 200 } },
});

const MOCK_REPLIES = Object.freeze({
  gemini: "Mock reply from gemini. Shahriar would like you to know this joke is load-tested.",
  mistral: "Mock reply from mistral. Shahriar's fallback plan has a fallback plan, and it also ships.",
  groq: "Mock reply from groq. Shahriar writes code fast, but this reply was faster and has no bugs.",
});

const PROVIDER_BY_URL = new Map(PROVIDER_ORDER.map((id) => [PROVIDERS[id].url, id]));

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    if (ms <= 0) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Builds a fetch replacement that answers provider URLs locally. Any other URL is refused,
 * so mock mode cannot reach the network.
 * @param {string} mode A key of MOCK_MODES.
 * @param {{ delayMs?: number, onRequest?: (url: string, init: RequestInit) => void }} [options] onRequest is a test hook.
 * @returns {typeof fetch}
 */
export function createMockFetch(mode, { delayMs, onRequest } = {}) {
  const spec = Object.hasOwn(MOCK_MODES, mode) ? MOCK_MODES[mode] : null;
  if (!spec) {
    throw new Error(`Unknown mock mode "${mode}". Use one of: ${Object.keys(MOCK_MODES).join(", ")}.`);
  }
  const delay = delayMs ?? spec.delayMs;

  return async function mockFetch(input, init = {}) {
    const url = typeof input === "string" ? input : (input?.url ?? String(input));
    const id = PROVIDER_BY_URL.get(url);
    if (!id) throw new Error("mock fetch: refusing a non-provider URL (mock mode never uses the network)");

    onRequest?.(url, init);
    await sleep(delay, init.signal);

    const status = spec.statuses[id] ?? 503;
    const headers = { "content-type": "application/json" };
    if (status === 200) {
      const body = { choices: [{ index: 0, message: { role: "assistant", content: MOCK_REPLIES[id] } }] };
      return new Response(JSON.stringify(body), { status, headers });
    }
    return new Response(JSON.stringify({ error: { message: "mock provider error" } }), { status, headers });
  };
}

/* ------------------------------------------------------------------------------------ */
/* node:http <-> Web bridge                                                              */
/* ------------------------------------------------------------------------------------ */

const DROPPED_REQUEST_HEADERS = new Set(["x-forwarded-for", "x-real-ip"]);
const DROPPED_RESPONSE_HEADERS = new Set(["connection", "transfer-encoding", "keep-alive", "set-cookie"]);

/** Upload bytes and time we are willing to read and discard after answering without a full read. */
export const DRAIN_LIMITS = Object.freeze({ maxBytes: 1024 * 1024, maxMs: 5000 });

const draining = new WeakSet();

/**
 * Reads and discards whatever is left of a request body so a keep-alive connection can serve
 * the next request. Bounded: after limits.maxBytes discarded or limits.maxMs elapsed, whichever
 * comes first, the connection is dropped (Connection: close if headers are still unsent, then
 * the socket is destroyed) so a slow or endless upload cannot hold it open.
 * Safe to call more than once and when the body was already fully read.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {{ maxBytes: number, maxMs: number }} limits
 */
function startDrain(req, res, limits) {
  if (req.readableEnded || draining.has(req)) return;
  draining.add(req);
  req.removeAllListeners("data"); // detach the Web-stream bridge; nothing reads the body any more

  let drained = 0;
  const stop = () => {
    clearTimeout(timer);
    req.off("data", onData);
    req.off("end", stop);
    req.off("close", stop);
  };
  const cut = () => {
    stop();
    if (!res.headersSent) res.setHeader("Connection", "close");
    req.socket.destroy();
  };
  const onData = (chunk) => {
    drained += chunk.length;
    if (drained > limits.maxBytes) cut();
  };
  const timer = setTimeout(cut, limits.maxMs);
  timer.unref();

  req.on("data", onData);
  req.on("end", stop);
  req.on("close", stop);
  req.resume();
}

/**
 * Streams an IncomingMessage as a Web ReadableStream. Cancelling it (the handler does this
 * when the body exceeds the cap) calls onCancel, which drains the rest of the upload within
 * a bound instead of destroying the socket, so the 413 response can still be delivered.
 */
function nodeBodyToWeb(req, onCancel) {
  let done = false;
  return new ReadableStream({
    start(controller) {
      req.on("data", (chunk) => {
        if (done) return;
        controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        if (controller.desiredSize !== null && controller.desiredSize <= 0) req.pause();
      });
      req.on("end", () => {
        if (done) return;
        done = true;
        controller.close();
      });
      req.on("error", (err) => {
        if (done) return;
        done = true;
        controller.error(err);
      });
      req.on("close", () => {
        if (done || req.complete) return;
        done = true;
        controller.error(new Error("request aborted"));
      });
    },
    pull() {
      req.resume();
    },
    cancel() {
      done = true;
      onCancel();
    },
  });
}

function toWebRequest(req, origin, onCancel) {
  const headers = new Headers();
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    const name = req.rawHeaders[i].toLowerCase();
    // Like Vercel, the client's own forwarding headers are never trusted.
    if (!DROPPED_REQUEST_HEADERS.has(name)) headers.append(name, req.rawHeaders[i + 1]);
  }
  headers.set("x-forwarded-for", req.socket.remoteAddress ?? HOST);

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = nodeBodyToWeb(req, onCancel);
    init.duplex = "half";
  }
  return new Request(`${origin}${req.url}`, init);
}

async function sendWebResponse(response, req, res) {
  res.statusCode = response.status;
  for (const [name, value] of response.headers) {
    if (!DROPPED_RESPONSE_HEADERS.has(name)) res.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) res.setHeader("set-cookie", cookies);

  if (req.method === "HEAD" || !response.body) {
    await response.body?.cancel().catch(() => {});
    res.end();
    return;
  }
  await pipeline(Readable.fromWeb(response.body), res).catch(() => {});
}

function sendText(res, status, text, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  res.end(text);
}

const STATUS_TEXT = { 400: "Bad request", 403: "Forbidden", 404: "Not found", 405: "Method not allowed" };

async function serveStatic(req, res, root, realRoot) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, STATUS_TEXT[405], { Allow: "GET, HEAD" });
    return;
  }
  const target = resolveStaticPath(root, req.url ?? "");
  if (!target.ok) {
    sendText(res, target.status, STATUS_TEXT[target.status] ?? "Error");
    return;
  }

  // Resolve symlinks and re-check containment against the public set.
  let realFile;
  let stat;
  try {
    realFile = await fs.promises.realpath(target.file);
    stat = await fs.promises.stat(realFile);
  } catch {
    sendText(res, 404, STATUS_TEXT[404]);
    return;
  }
  const rel = path.relative(realRoot, realFile);
  const parts = rel.split(path.sep);
  const insidePublic =
    rel !== "" &&
    !rel.startsWith("..") &&
    !path.isAbsolute(rel) &&
    (parts.length === 1 ? PUBLIC_FILES.includes(parts[0]) : PUBLIC_DIRS.includes(parts[0]));
  if (!insidePublic || !stat.isFile()) {
    sendText(res, 404, STATUS_TEXT[404]);
    return;
  }

  res.writeHead(200, {
    "Content-Type": target.contentType,
    "Content-Length": stat.size,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  await pipeline(fs.createReadStream(realFile), res).catch(() => {});
}

/* ------------------------------------------------------------------------------------ */
/* Server                                                                                */
/* ------------------------------------------------------------------------------------ */

const ALLOW_ALL_LIMITER = Object.freeze({ check: () => ({ allowed: true, retryAfterSeconds: 0 }) });

/**
 * Starts the dev server on 127.0.0.1.
 * @param {object} [options]
 * @param {number} [options.port] 0 picks a free port. Default 3000.
 * @param {string | boolean} [options.mock] false for real providers; true or a MOCK_MODES key for mock mode.
 * @param {string} [options.root] Repo root to serve. Default: the parent of scripts/.
 * @param {Record<string, string | undefined>} [options.env] Env for the handler. Default process.env. Read on every request.
 * @param {number} [options.mockDelayMs] Overrides the mock mode's delay.
 * @param {{ info: Function, warn: Function, error: Function }} [options.logger] Handler logger. Default console.
 * @param {{ maxBytes: number, maxMs: number }} [options.drainLimits] Bound on discarding an unread upload. Default DRAIN_LIMITS.
 * @param {(url: string, init: RequestInit) => void} [options.onMockRequest] Test hook, called for every mocked provider request.
 * @returns {Promise<{ server: http.Server, port: number, close: () => Promise<void> }>}
 */
export async function startServer({
  port = DEFAULT_PORT,
  mock = false,
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  env,
  mockDelayMs,
  logger = console,
  drainLimits = DRAIN_LIMITS,
  onMockRequest,
} = {}) {
  const mockMode = mock === true ? "ok" : mock || null;
  // Throws on an unknown mode, before anything is listening.
  const fetchImpl = mockMode ? createMockFetch(mockMode, { delayMs: mockDelayMs, onRequest: onMockRequest }) : globalThis.fetch;

  const absRoot = path.resolve(root);
  const realRoot = await fs.promises.realpath(absRoot);
  const limiter =
    !mockMode || mockMode === "ratelimit"
      ? createRateLimiter({ rules: RATE_LIMITS.perIp, globalRules: RATE_LIMITS.global })
      : ALLOW_ALL_LIMITER;

  const handlerEnv = () => {
    const base = { ...(env ?? process.env) };
    if (mockMode) {
      for (const id of PROVIDER_ORDER) base[PROVIDERS[id].keyEnv] = FAKE_KEY;
    }
    return base;
  };

  const server = http.createServer(async (req, res) => {
    try {
      if (!isAllowedHost(req.headers.host)) {
        sendText(res, 403, STATUS_TEXT[403]);
        return;
      }
      const pathname = (req.url ?? "").split(/[?#]/, 1)[0];
      if (pathname === "/api/chat") {
        let request;
        try {
          request = toWebRequest(req, `http://${req.headers.host}`, () => startDrain(req, res, drainLimits));
        } catch {
          sendText(res, 400, STATUS_TEXT[400]);
          return;
        }
        const response = await handleChat(request, {
          env: handlerEnv(),
          fetchImpl,
          rateLimiter: limiter,
          logger,
        });
        await sendWebResponse(response, req, res);
      } else {
        await serveStatic(req, res, absRoot, realRoot);
      }
      // Any answer that did not read the whole upload (403/405/413...) still has to get rid of it.
      startDrain(req, res, drainLimits);
    } catch {
      if (!res.headersSent) sendText(res, 500, "Internal error");
      else res.end();
      startDrain(req, res, drainLimits);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    server,
    port: server.address().port,
    close() {
      return new Promise((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    },
  };
}

/* ------------------------------------------------------------------------------------ */
/* CLI                                                                                   */
/* ------------------------------------------------------------------------------------ */

/**
 * Parses CLI arguments.
 * @param {string[]} argv Arguments after the script name.
 * @param {Record<string, string | undefined>} env
 * @returns {{ mock: false | string, port: number }}
 */
export function parseCliArgs(argv, env = process.env) {
  let mock = false;
  let portText = env.PORT;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mock") {
      mock = "ok";
    } else if (arg.startsWith("--mock=")) {
      mock = arg.slice("--mock=".length) || "ok";
    } else if (arg === "--port") {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error("--port requires a value, e.g. --port 3000");
      }
      portText = next;
      i += 1;
    } else if (arg.startsWith("--port=")) {
      portText = arg.slice("--port=".length);
      if (portText === "") throw new Error("--port requires a value, e.g. --port=3000");
    } else {
      throw new Error(`Unknown argument "${arg}". Usage: node scripts/dev-server.js [--mock[=mode]] [--port N]`);
    }
  }
  if (mock && !Object.hasOwn(MOCK_MODES, mock)) {
    throw new Error(`Unknown mock mode "${mock}". Use one of: ${Object.keys(MOCK_MODES).join(", ")}.`);
  }
  const port = portText === undefined || portText === "" ? DEFAULT_PORT : Number(portText);
  if (
    !(portText === undefined || portText === "" || /^\d{1,5}$/.test(portText)) ||
    !Number.isInteger(port) ||
    port > 65535
  ) {
    throw new Error(`Invalid port "${portText}". Use an integer from 0 to 65535.`);
  }
  return { mock, port };
}

async function main() {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2), process.env);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (!options.mock) loadEnvLocal(path.join(root, ".env.local"));

  let running;
  try {
    running = await startServer({ port: options.port, mock: options.mock, root });
  } catch (err) {
    console.error(
      err?.code === "EADDRINUSE"
        ? `Port ${options.port} is already in use. Try: node scripts/dev-server.js --port 3001`
        : `Could not start the dev server: ${err?.code ?? err?.message ?? "unknown error"}`,
    );
    process.exit(1);
  }

  console.log(`Dev server: http://localhost:${running.port}`);
  if (options.mock) {
    console.log(`Mode: mock (${options.mock}). No API keys needed, no network calls.`);
  } else {
    const presence = describeProviderKeys(process.env);
    console.log(`Mode: real providers (${presence})`);
    if (PROVIDER_ORDER.every((id) => !process.env[PROVIDERS[id].keyEnv])) {
      console.log("No provider keys found. Copy .env.example to .env.local and fill in a key, or run: npm run dev:mock");
      console.log("(/api/chat will answer 503 until then.)");
    }
  }
  if (options.port === DEFAULT_PORT) {
    console.log("Chat is allowed from http://localhost:3000 and http://127.0.0.1:3000 only.");
  } else {
    console.log(`Note: the chat origin allowlist only covers port 3000. Set ALLOWED_ORIGINS=http://localhost:${running.port} to chat on this port.`);
  }

  const stop = async () => {
    await running.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

/** True when this file is the script being run, even through a junction or symlink. */
function isMainModule() {
  try {
    if (!process.argv[1]) return false;
    return fs.realpathSync.native(process.argv[1]) === fs.realpathSync.native(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main();
}
