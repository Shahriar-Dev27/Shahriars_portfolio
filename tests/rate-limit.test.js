import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter, getClientKey } from "../api/_lib/rate-limit.js";

/**
 * Creates a clock whose time can be moved by the test.
 * @param {number} [start]
 */
function makeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      t += ms;
    },
  };
}

test("a per-key window allows up to max hits, then denies with retryAfterSeconds", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 60000, max: 2 }],
    now: clock.now,
  });

  assert.equal(limiter.check("a").allowed, true);
  assert.equal(limiter.check("a").allowed, true);

  const denied = limiter.check("a");
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterSeconds, 60);

  clock.advance(60001);
  assert.equal(limiter.check("a").allowed, true);
});

test("two keys are counted independently", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 60000, max: 1 }],
    now: clock.now,
  });

  assert.equal(limiter.check("a").allowed, true);
  assert.equal(limiter.check("a").allowed, false);
  assert.equal(limiter.check("b").allowed, true);
});

test("a global rule denies the fourth call across keys", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 60000, max: 10 }],
    globalRules: [{ windowMs: 60000, max: 3 }],
    now: clock.now,
  });

  assert.equal(limiter.check("a").allowed, true);
  assert.equal(limiter.check("b").allowed, true);
  assert.equal(limiter.check("c").allowed, true);
  assert.equal(limiter.check("d").allowed, false);
});

test("a denied call does not consume quota", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 1000, max: 1 }],
    globalRules: [{ windowMs: 10000, max: 2 }],
    now: clock.now,
  });

  assert.equal(limiter.check("a").allowed, true); // global 1, key a 1
  assert.equal(limiter.check("a").allowed, false); // key a denied, nothing recorded
  clock.advance(1001);
  assert.equal(limiter.check("a").allowed, true); // global 2 (denial did not add a third hit)
  clock.advance(1001);
  assert.equal(limiter.check("b").allowed, false); // global window of 2 is full
});

test("maxKeys evicts the oldest-inserted keys", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 60000, max: 5 }],
    maxKeys: 2,
    now: clock.now,
  });

  limiter.check("a");
  limiter.check("b");
  limiter.check("c");
  assert.ok(limiter.size() <= 2, `size was ${limiter.size()}`);
});

test("getClientKey takes the first x-forwarded-for entry", () => {
  const request = new Request("https://x/api/chat", {
    headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
  });
  assert.equal(getClientKey(request), "1.1.1.1");
});

test("getClientKey falls back to x-real-ip", () => {
  const request = new Request("https://x/api/chat", {
    headers: { "x-real-ip": "3.3.3.3" },
  });
  assert.equal(getClientKey(request), "3.3.3.3");
});

test("getClientKey returns anonymous when no IP header is present", () => {
  const request = new Request("https://x/api/chat");
  assert.equal(getClientKey(request), "anonymous");
});

/**
 * Builds a request carrying one x-forwarded-for value.
 * @param {string} value
 * @returns {Request}
 */
function forwardedFor(value) {
  return new Request("https://x/api/chat", { headers: { "x-forwarded-for": value } });
}

/**
 * Returns the client key for one x-forwarded-for value.
 * @param {string} value
 * @returns {string}
 */
function keyOf(value) {
  return getClientKey(forwardedFor(value));
}

test("IPv4 keys are unchanged, including an IPv4 with a port", () => {
  assert.equal(keyOf("1.1.1.1"), "1.1.1.1");
  assert.equal(keyOf("1.2.3.4:5555"), "1.2.3.4");
});

test("IPv6 addresses in the same /64 share one key", () => {
  assert.equal(keyOf("2001:db8:1:2::1"), keyOf("2001:db8:1:2:ffff:ffff:ffff:ffff"));
});

test("IPv6 addresses in different /64s get different keys", () => {
  assert.notEqual(keyOf("2001:db8:1:2::1"), keyOf("2001:db8:1:3::1"));
});

test("IPv6 /64 key uses the normalised first four hextets", () => {
  assert.equal(keyOf("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(keyOf("::1"), "0:0:0:0::/64");
});

test("IPv6 full, compressed and uppercase forms produce the same key", () => {
  const compressed = keyOf("2001:db8::1");
  assert.equal(keyOf("2001:db8:0:0:0:0:0:1"), compressed);
  assert.equal(keyOf("2001:DB8::1"), compressed);
});

test("IPv4-mapped IPv6 keys as the IPv4 address", () => {
  assert.equal(keyOf("::ffff:1.2.3.4"), "1.2.3.4");
  assert.equal(keyOf("::FFFF:1.2.3.4"), "1.2.3.4");
});

test("IPv6 zone id is ignored", () => {
  assert.equal(keyOf("fe80::1%eth0"), keyOf("fe80::1"));
});

test("bracketed IPv6 with a port keys as the bare address", () => {
  assert.equal(keyOf("[2001:db8::1]:443"), keyOf("2001:db8::1"));
});

test("malformed values do not throw and fall back to a bounded raw key", () => {
  const garbage = ["not-an-ip", "2001:db8::1::2", "zzzz::1", ":::", "1.2.3", "[::1", "a".repeat(200)];
  for (const value of garbage) {
    const key = keyOf(value);
    assert.equal(typeof key, "string");
    assert.ok(key.length <= 64, `key too long for ${value.slice(0, 20)}`);
  }
  assert.notEqual(keyOf("garbage-a"), keyOf("garbage-b"));
});

test("the per-IP rule stops rotating addresses inside one /64", () => {
  const clock = makeClock();
  const limiter = createRateLimiter({
    rules: [{ windowMs: 60000, max: 6 }],
    globalRules: [{ windowMs: 60000, max: 30 }],
    now: clock.now,
  });

  for (let i = 1; i <= 6; i += 1) {
    const key = keyOf(`2001:db8:1:2::${i.toString(16)}`);
    assert.equal(limiter.check(key).allowed, true, `call ${i} should pass`);
  }
  const denied = limiter.check(keyOf("2001:db8:1:2::ff"));
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterSeconds, 60);
});
