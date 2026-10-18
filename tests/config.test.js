import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  PROVIDER_ORDER,
  PROVIDERS,
  FATAL_UPSTREAM_STATUSES,
} from "../api/_lib/config.js";

test("LIMITS holds the shared message caps", () => {
  assert.equal(LIMITS.MAX_USER_MESSAGE_CHARS, 500);
  assert.equal(LIMITS.MAX_HISTORY_MESSAGES, 10);
  assert.equal(LIMITS.MAX_HISTORY_CHARS, 8000);
});

test("LIMITS is frozen", () => {
  assert.equal(Object.isFrozen(LIMITS), true);
});

test("Groq is primary and NVIDIA is the backup", () => {
  assert.deepEqual([...PROVIDER_ORDER], ["groq", "nvidia"]);
});

test("every provider URL is https", () => {
  for (const id of PROVIDER_ORDER) {
    assert.ok(PROVIDERS[id].url.startsWith("https://"), `${id} url must be https`);
  }
});

test("FATAL_UPSTREAM_STATUSES is only 422 after all providers fail", () => {
  assert.deepEqual([...FATAL_UPSTREAM_STATUSES], [422]);
});
