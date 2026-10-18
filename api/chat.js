import { handleChat } from "./_lib/handler.js";

/** Vercel Web-handler entry point (`fetch(request)`); delegates every request to handleChat. */
export default { fetch: (request) => handleChat(request) };
