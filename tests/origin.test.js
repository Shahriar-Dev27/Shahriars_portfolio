import { test } from "node:test";
import assert from "node:assert/strict";
import { getAllowedOrigins, isAllowedRequest } from "../api/_lib/origin.js";

/**
 * Builds a POST request to the chat endpoint with the given Origin and,
 * optionally, a Sec-Fetch-Site header.
 * @param {string | undefined} origin
 * @param {string} [secFetchSite]
 * @returns {Request}
 */
function makeRequest(origin, secFetchSite) {
  const headers = {};
  if (origin !== undefined) headers.origin = origin;
  if (secFetchSite !== undefined) headers["sec-fetch-site"] = secFetchSite;
  return new Request("https://x/api/chat", { method: "POST", headers });
}

test("local env allows the dev origin on port 3000", () => {
  assert.equal(isAllowedRequest(makeRequest("http://localhost:3000"), {}), true);
});

test("local env denies an unknown localhost port", () => {
  assert.equal(isAllowedRequest(makeRequest("http://localhost:4000"), {}), false);
});

test("missing Origin is denied", () => {
  assert.equal(isAllowedRequest(makeRequest(undefined), {}), false);
});

test("production allows ALLOWED_ORIGINS entries, with trailing slash stripped", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com, https://www.a.com/" };
  assert.equal(isAllowedRequest(makeRequest("https://www.a.com"), env), true);
});

test("production denies localhost", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com, https://www.a.com/" };
  assert.equal(isAllowedRequest(makeRequest("http://localhost:3000"), env), false);
});

test("production denies an unlisted origin", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com, https://www.a.com/" };
  assert.equal(isAllowedRequest(makeRequest("https://evil.com"), env), false);
});

test("preview allows the deployment URL", () => {
  const env = { VERCEL_ENV: "preview", VERCEL_URL: "p-123.vercel.app" };
  assert.equal(isAllowedRequest(makeRequest("https://p-123.vercel.app"), env), true);
});

test("production denies the deployment URL", () => {
  const env = { VERCEL_ENV: "production", VERCEL_URL: "p-123.vercel.app" };
  assert.equal(isAllowedRequest(makeRequest("https://p-123.vercel.app"), env), false);
});

test("cross-site Sec-Fetch-Site is denied even for an allowed origin", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com" };
  assert.equal(isAllowedRequest(makeRequest("https://a.com", "cross-site"), env), false);
});

test("same-origin Sec-Fetch-Site is allowed", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com" };
  assert.equal(isAllowedRequest(makeRequest("https://a.com", "same-origin"), env), true);
});

test("no Sec-Fetch-Site header is allowed for an allowed origin", () => {
  const env = { VERCEL_ENV: "production", ALLOWED_ORIGINS: "https://a.com" };
  assert.equal(isAllowedRequest(makeRequest("https://a.com"), env), true);
});

test("getAllowedOrigins includes DEV_ORIGINS only when VERCEL_ENV is unset or development", () => {
  assert.equal(getAllowedOrigins({}).has("http://localhost:3000"), true);
  assert.equal(getAllowedOrigins({ VERCEL_ENV: "development" }).has("http://127.0.0.1:3000"), true);
  assert.equal(getAllowedOrigins({ VERCEL_ENV: "preview" }).has("http://localhost:3000"), false);
});

test("getAllowedOrigins adds the production URL when set", () => {
  const origins = getAllowedOrigins({
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "site.vercel.app",
  });
  assert.equal(origins.has("https://site.vercel.app"), true);
});

test("getAllowedOrigins ignores blank ALLOWED_ORIGINS entries", () => {
  const origins = getAllowedOrigins({ VERCEL_ENV: "production", ALLOWED_ORIGINS: " , https://a.com,, " });
  assert.deepEqual([...origins], ["https://a.com"]);
});
