/**
 * Response helpers for the chat endpoint.
 * Every response carries the same content-type, cache and sniffing headers.
 */

/**
 * JSON Response with content-type application/json; charset=utf-8, cache-control no-store, x-content-type-options nosniff.
 * The required headers always win over any caller-supplied header of the same name.
 * @param {number} status HTTP status code.
 * @param {unknown} body Value serialised with JSON.stringify.
 * @param {Record<string, string>} [headers] Extra headers, e.g. Retry-After or Allow.
 * @returns {Response}
 */
export function jsonResponse(status, body, headers = {}) {
  const merged = new Headers(headers);
  merged.set("Content-Type", "application/json; charset=utf-8");
  merged.set("Cache-Control", "no-store");
  merged.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers: merged });
}

/**
 * jsonResponse(status, { error: { code, message } }, headers)
 * @param {number} status HTTP status code.
 * @param {string} code Machine-readable error code.
 * @param {string} message In-character message that is safe to display.
 * @param {Record<string, string>} [headers] Extra headers, e.g. Retry-After.
 * @returns {Response}
 */
export function errorResponse(status, code, message, headers = {}) {
  return jsonResponse(status, { error: { code, message } }, headers);
}
