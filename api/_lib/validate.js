/**
 * Request parsing, validation and history normalization for POST /api/chat.
 *
 * validateChatRequest applies these steps, in this order:
 *   1. Shape and role checks (object, messages array of 1-20, each item an object with
 *      role "user" or "assistant" and string content).
 *   2. Strip control characters, then trim each content.
 *   3. The last item must be a user turn of 1-500 chars (over 500 gives message_too_long,
 *      empty gives invalid_request).
 *   4. Drop any other empty item.
 *   5. Truncate assistant items to 1,200 chars and other user items to 500 chars.
 *      Truncated text is made well-formed with toWellFormed, so no lone surrogate remains.
 *   6. Drop leading assistant items.
 *   7. Merge consecutive same-role items, joined by a blank line.
 *   8. Keep the last 10 items.
 *   8b. Drop the oldest items while the total content length exceeds MAX_HISTORY_CHARS,
 *       never dropping the last item.
 *   8c. If the total still exceeds MAX_HISTORY_CHARS, only the last item remains (it can be
 *       a merged user turn larger than the cap). Keep its newest MAX_HISTORY_CHARS chars
 *       (slice from the end) and make the result well-formed with toWellFormed.
 *   9. Drop a leading assistant item if one is present (re-run after 8c).
 * Output objects contain only role and content.
 */
import { LIMITS } from "./config.js";

/** U+0000-U+0008, U+000B, U+000C, U+000E-U+001F and U+007F. Newline and tab are kept. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Removes U+0000-U+0008, U+000B, U+000C, U+000E-U+001F and U+007F; keeps newline and tab.
 * @param {string} text Raw text.
 * @returns {string} Text without disallowed control characters.
 */
export function stripControlChars(text) {
  return text.replace(CONTROL_CHARS, "");
}

/**
 * Parses a request body as JSON.
 * @param {string} rawText Raw request body.
 * @returns {{ ok: true, value: unknown } | { ok: false, code: "invalid_json" }}
 */
export function parseJsonBody(rawText) {
  try {
    return { ok: true, value: JSON.parse(rawText) };
  } catch {
    return { ok: false, code: "invalid_json" };
  }
}

/**
 * @param {unknown} value
 * @returns {boolean} true for non-null, non-array objects.
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Truncates text to max code units and makes the result well-formed, so a cut
 * through a surrogate pair cannot leave a lone surrogate.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncateWellFormed(text, max) {
  return text.length > max ? text.slice(0, max).toWellFormed() : text;
}

/**
 * Validates the chat request body and normalizes the history per the API contract
 * (see the module header for the step order).
 * @param {unknown} body Parsed JSON body.
 * @param {typeof LIMITS} [limits] Limits to apply.
 * @returns {{ ok: true, messages: Array<{role: "user"|"assistant", content: string}> }
 *   | { ok: false, status: 400, code: "invalid_request" | "message_too_long" }}
 */
export function validateChatRequest(body, limits = LIMITS) {
  const invalid = { ok: false, status: 400, code: "invalid_request" };

  if (!isPlainObject(body) || !Array.isArray(body.messages)) return invalid;
  const raw = body.messages;
  if (raw.length < 1 || raw.length > limits.MAX_REQUEST_MESSAGES) return invalid;

  // 1. Shape and role checks. Each item's fields are read once into locals.
  const shaped = [];
  for (const item of raw) {
    if (!isPlainObject(item)) return invalid;
    const { role, content } = item;
    if (role !== "user" && role !== "assistant") return invalid;
    if (typeof content !== "string") return invalid;
    shaped.push({ role, content });
  }

  // 2. Strip control characters, then trim each content.
  const cleaned = shaped.map(({ role, content }) => ({
    role,
    content: stripControlChars(content).trim(),
  }));

  // 3. The last item must be a user turn of 1-500 chars.
  const last = cleaned[cleaned.length - 1];
  if (last.role !== "user" || last.content.length === 0) return invalid;
  if (last.content.length > limits.MAX_USER_MESSAGE_CHARS) {
    return { ok: false, status: 400, code: "message_too_long" };
  }

  // 4. Drop any other empty item.
  let items = cleaned.filter(({ content }) => content.length > 0);

  // 5. Truncate assistant items to 1,200 and other user items to 500. The last item is
  //    already within 500, so this only affects earlier user items.
  items = items.map(({ role, content }) => {
    const max =
      role === "assistant" ? limits.MAX_ASSISTANT_MESSAGE_CHARS : limits.MAX_USER_MESSAGE_CHARS;
    return { role, content: truncateWellFormed(content, max) };
  });

  // 6. Drop leading assistant items.
  let start = 0;
  while (start < items.length && items[start].role === "assistant") start += 1;
  items = items.slice(start);

  // 7. Merge consecutive same-role items, joined by a blank line.
  const merged = [];
  for (const { role, content } of items) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === role) {
      prev.content = `${prev.content}\n\n${content}`;
    } else {
      merged.push({ role, content });
    }
  }

  // 8. Keep the last N items.
  let kept = merged.slice(-limits.MAX_HISTORY_MESSAGES);

  // 8b. Drop the oldest items while the total exceeds the history character cap.
  //     The last item is never dropped.
  let total = kept.reduce((sum, item) => sum + item.content.length, 0);
  let drop = 0;
  while (total > limits.MAX_HISTORY_CHARS && drop < kept.length - 1) {
    total -= kept[drop].content.length;
    drop += 1;
  }
  kept = kept.slice(drop);

  // 8c. Step 8b stops only when the total fits or one item is left, so an over-cap total
  //     means the last item alone is larger than the cap. Keep its newest chars.
  if (total > limits.MAX_HISTORY_CHARS) {
    const tail = kept[kept.length - 1];
    const from = Math.max(0, tail.content.length - limits.MAX_HISTORY_CHARS);
    kept = [{ role: tail.role, content: tail.content.slice(from).toWellFormed() }];
  }

  // 9. Drop a leading assistant item if one is present (a no-op after 8c, which keeps a user turn).
  if (kept.length > 0 && kept[0].role === "assistant") kept = kept.slice(1);

  return { ok: true, messages: kept };
}
