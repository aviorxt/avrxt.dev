// Existing production gateway, retained for the profile and main site.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.ts
var STATUS_SOURCES = ["https://avrxt-dev.betteruptime.com/index.json", "https://status.avrxt.dev/index.json"];
var PUBLIC_CONFIG_CACHE_KEY = new Request("https://avrxt.internal/cache/public-profile-config");
var requestBuckets = /* @__PURE__ */ new Map();
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://avrxt.dev",
  "https://www.avrxt.dev",
  "https://me.avrxt.dev",
  "https://muzix.avrxt.dev",
  "http://localhost:3000"
]);
var PUBLIC_PROXY_ROUTES = {
  "/v1/contact": "/api/contact",
  "/v1/subscribe": "/api/subscribe",
  "/v1/status/details": "/api/status/details",
  "/v1/health": "/api/health",
  "/v1/link-preview": "/api/link-preview",
  "/v1/og": "/api/og",
  "/v1/profile/config": "/api/profile/config",
  "/v1/spotify/now-playing": "/api/spotify/now-playing",
  "/v1/spotify/chart": "/api/spotify/chart"
};
var CACHEABLE_PROXY_ROUTES = {
  "/v1/status/details": 60
  // Spotify playback is intentionally excluded: it is a live, uncached
  // source that also publishes changes to the realtime status channel.
};
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.avrxt.dev";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
__name(corsHeaders, "corsHeaders");
function json(request, value, status = 200, extra = {}) {
  return Response.json(value, {
    status,
    headers: { ...corsHeaders(request), ...extra }
  });
}
__name(json, "json");
function withCors(request, response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
  headers.set("X-AVRXT-Gateway", "api-v1");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
__name(withCors, "withCors");
async function proxyToSite(request, env, targetPath, cacheTtl) {
  const source = new URL(request.url);
  const target = new URL(targetPath, env.SITE_ORIGIN || "https://www.avrxt.dev");
  target.search = source.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  if (cacheTtl) headers.delete("cookie");
  headers.set("X-Forwarded-Host", source.host);
  headers.set("X-AVRXT-Gateway", "api-v1");
  for (const name of ["x-avrxt-client-ip", "x-avrxt-client-time", "x-avrxt-client-signature"]) headers.delete(name);
  const gatewaySecret = env.GATEWAY_SHARED_SECRET || env.MAIL_AI_SHARED_SECRET;
  const clientIp = request.headers.get("cf-connecting-ip");
  if (gatewaySecret && clientIp) {
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(gatewaySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}
${clientIp}`));
    headers.set("x-avrxt-client-ip", clientIp);
    headers.set("x-avrxt-client-time", timestamp);
    headers.set("x-avrxt-client-signature", Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""));
  }
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? void 0 : request.body,
    redirect: "manual",
    ...cacheTtl ? { cf: { cacheEverything: true, cacheTtl } } : {}
  });
  return response;
}
__name(proxyToSite, "proxyToSite");
function rateLimited(request, maximum = 120, windowMs = 6e4) {
  const ip = request.headers.get("cf-connecting-ip") || "anonymous";
  const now = Date.now();
  const record = requestBuckets.get(ip);
  if (!record || now >= record.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    if (requestBuckets.size > 1e4) requestBuckets.clear();
    return false;
  }
  if (record.count >= maximum) return true;
  record.count += 1;
  return false;
}
__name(rateLimited, "rateLimited");
function state(value) {
  switch (typeof value === "string" ? value.toLowerCase().replace(/[\s-]/g, "_") : "") {
    case "operational":
    case "resolved":
      return "operational";
    case "degraded":
    case "degraded_performance":
      return "degraded";
    case "down":
    case "downtime":
    case "partial_outage":
    case "major_outage":
      return "down";
    case "maintenance":
    case "under_maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}
__name(state, "state");
var STATUS_LABELS = {
  operational: "All systems operational",
  degraded: "Some services are degraded",
  down: "Service disruption",
  maintenance: "Maintenance in progress",
  unknown: "Status temporarily unavailable"
};
async function externalJson(request, upstream, cacheTtl) {
  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cf: { cacheEverything: true, cacheTtl }
    });
    if (!response.ok) return json(request, { error: "Upstream service unavailable" }, response.status, { "Cache-Control": "no-store" });
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Cache-Control", `public, max-age=${cacheTtl}`);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return json(request, { error: "Upstream service unavailable" }, 502, { "Cache-Control": "no-store" });
  }
}
__name(externalJson, "externalJson");
async function getPublicConfig(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const cache = await caches.open("avrxt-public-config");
  const cached = await cache.match(PUBLIC_CONFIG_CACHE_KEY);
  if (cached) {
    try {
      return await cached.json();
    } catch {
    }
  }
  try {
    const upstream = new URL("/rest/v1/me_config", env.SUPABASE_URL);
    upstream.search = "select=data&key=eq.main_config";
    const response = await fetch(upstream.toString(), {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: "application/json" }
    });
    if (!response.ok) return null;
    const rows = await response.json();
    const config = rows[0]?.data;
    if (!config || typeof config !== "object") return null;
    await cache.put(PUBLIC_CONFIG_CACHE_KEY, new Response(JSON.stringify(config), { headers: { "Cache-Control": "public, max-age=60" } }));
    return config;
  } catch {
    return null;
  }
}
__name(getPublicConfig, "getPublicConfig");
async function handleGeo(request, mode) {
  const input = new URL(request.url);
  const upstream = new URL(mode === "search" ? "https://geocoding-api.open-meteo.com/v1/search" : "https://api.open-meteo.com/v1/forecast");
  if (mode === "search") {
    const query = input.searchParams.get("name")?.trim() || "";
    if (!query || query.length > 120) return json(request, { error: "Invalid location query" }, 400);
    upstream.searchParams.set("name", query);
    const count = Number(input.searchParams.get("count") || "5");
    upstream.searchParams.set("count", String(Number.isFinite(count) ? Math.min(Math.max(Math.floor(count), 1), 10) : 5));
    const language = input.searchParams.get("language");
    if (language && /^[a-z]{2}$/i.test(language)) upstream.searchParams.set("language", language);
    return externalJson(request, upstream, 3600);
  }
  const latitude = Number(input.searchParams.get("latitude"));
  const longitude = Number(input.searchParams.get("longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return json(request, { error: "Invalid coordinates" }, 400);
  }
  upstream.searchParams.set("latitude", String(latitude));
  upstream.searchParams.set("longitude", String(longitude));
  for (const key of ["current", "hourly", "daily", "timezone", "forecast_days", "past_days"]) {
    const value = input.searchParams.get(key);
    if (value && value.length <= 500 && /^[a-zA-Z0-9_,.+\-/]+$/.test(value)) upstream.searchParams.set(key, value);
  }
  return externalJson(request, upstream, 900);
}
__name(handleGeo, "handleGeo");
async function handleDiscord(request, discordId) {
  if (!/^\d{15,22}$/.test(discordId)) return json(request, { error: "Invalid Discord user ID" }, 400);
  return externalJson(request, new URL(`https://api.lanyard.rest/v1/users/${discordId}`), 15);
}
__name(handleDiscord, "handleDiscord");
async function handleDiscordGateway(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response("Forbidden", { status: 403 });
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected a WebSocket upgrade.", { status: 426 });
  }
  const upstream = await fetch("https://api.lanyard.rest/socket", {
    headers: { Upgrade: "websocket", Origin: origin }
  });
  if (!upstream.webSocket) return new Response("Discord presence service unavailable.", { status: 503 });
  const [client, relay] = Object.values(new WebSocketPair());
  const remote = upstream.webSocket;
  relay.accept({ allowHalfOpen: true });
  remote.accept({ allowHalfOpen: true });
  const close = /* @__PURE__ */ __name((socket, event) => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
      socket.close(event.code || 1e3, event.reason || "Relay closed");
    }
  }, "close");
  relay.addEventListener("message", (event) => {
    if (remote.readyState === WebSocket.OPEN) remote.send(event.data);
  });
  remote.addEventListener("message", (event) => {
    if (relay.readyState === WebSocket.OPEN) relay.send(event.data);
  });
  relay.addEventListener("close", (event) => close(remote, event));
  remote.addEventListener("close", (event) => close(relay, event));
  relay.addEventListener("error", () => remote.close(1011, "Relay error"));
  remote.addEventListener("error", () => relay.close(1011, "Upstream error"));
  return new Response(null, { status: 101, webSocket: client });
}
__name(handleDiscordGateway, "handleDiscordGateway");
async function handleSpotify(request, env) {
  const config = await getPublicConfig(env);
  if (config?.site?.profileEnabled === false) return json(request, { error: "PROFILE_DISABLED" }, 404, { "Cache-Control": "no-store" });
  const response = await proxyToSite(request, env, "/api/spotify/now-playing");
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(handleSpotify, "handleSpotify");
async function handleStatus(request, env) {
  const config = await getPublicConfig(env);
  if (config?.site?.statusPageEnabled === false) return json(request, { error: "STATUS_DISABLED", externalStatusUrl: "https://status.avrxt.dev" }, 404, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  for (const source of STATUS_SOURCES) {
    try {
      const response = await fetch(source, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;
      const payload = await response.json();
      const current = state(payload.data?.attributes?.aggregate_state);
      return json(request, { status: current, label: STATUS_LABELS[current], badgeEnabled: config?.site?.statusBadgeEnabled !== false }, 200, { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
    } catch {
    }
  }
  return json(request, { status: "unknown", label: STATUS_LABELS.unknown, badgeEnabled: config?.site?.statusBadgeEnabled !== false }, 200, { "Cache-Control": "no-store" });
}
__name(handleStatus, "handleStatus");
function escapeAiHtml(html) {
  return html.replace(/<\s*(script|iframe|object|embed|form|input|button|svg|math|style|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*(script|iframe|object|embed|form|input|button|svg|math|style|link|meta|base)\b[^>]*\/?\s*>/gi, "").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s+(href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\2/gi, "").replace(/\s+(href|src|action|formaction)\s*=\s*(?:javascript|data):[^\s>]*/gi, "");
}
__name(escapeAiHtml, "escapeAiHtml");
async function generateMailDraft(request, env) {
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405, { Allow: "POST", "Cache-Control": "no-store" });
  const expected = env.MAIL_AI_SHARED_SECRET?.trim();
  const supplied = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const suppliedBytes = new TextEncoder().encode(supplied);
  const expectedBytes = new TextEncoder().encode(expected || "missing-secret");
  let mismatch = suppliedBytes.length ^ expectedBytes.length;
  for (let index = 0; index < Math.max(suppliedBytes.length, expectedBytes.length); index++) {
    mismatch |= (suppliedBytes[index] || 0) ^ (expectedBytes[index] || 0);
  }
  if (!expected || mismatch !== 0) {
    return json(request, { error: "Unauthorized" }, 401, { "Cache-Control": "no-store" });
  }
  const limited = await env.MAIL_AI_LIMITER.limit({ key: "newsletter-draft" });
  if (!limited.success) return json(request, { error: "Email AI is busy. Please try again shortly." }, 429, { "Cache-Control": "no-store" });
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 8e3) return json(request, { error: "Prompt is too large" }, 413, { "Cache-Control": "no-store" });
  let prompt;
  try {
    prompt = (await request.json()).prompt;
  } catch {
    return json(request, { error: "Invalid JSON body" }, 400, { "Cache-Control": "no-store" });
  }
  if (typeof prompt !== "string" || prompt.trim().length < 8 || prompt.length > 2e3) {
    return json(request, { error: "Prompt must be between 8 and 2,000 characters" }, 400, { "Cache-Control": "no-store" });
  }
  const model = "@cf/zai-org/glm-4.7-flash";
  let failureStage = "inference";
  try {
    const output = await env.AI.run(model, {
      response_format: { type: "json_object" },
      // Keep synchronous generation within server-action limits and avoid enormous drafts.
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: "Create an email marketing/newsletter draft from the user request. Return a JSON object with exactly subject, previewText, and html string fields. HTML must be complete, responsive, email-client-safe HTML using tables and inline CSS; use a restrained black, white, and grayscale visual style. Keep the writing clear and polished. Do not invent company facts, claims, dates, prices, links, or offers absent from the prompt; use neutral copy/placeholders where needed. Do not include scripts, forms, iframes, external stylesheets, tracking pixels, or unsubscribe links/footers. The application adds the unsubscribe footer. Do not use markdown fences." },
        { role: "user", content: prompt.trim() }
      ]
    });
    failureStage = "response";
    const generatedText = typeof output.response === "string" ? output.response : output.choices?.[0]?.message?.content;
    if (typeof generatedText !== "string") throw new Error("Invalid AI response");
    const responseText = generatedText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(responseText);
    if (typeof parsed.subject !== "string" || typeof parsed.previewText !== "string" || typeof parsed.html !== "string" || !parsed.subject.trim() || !parsed.html.trim() || parsed.subject.length > 200 || parsed.previewText.length > 240 || parsed.html.length > 5e4) {
      throw new Error("Invalid AI draft");
    }
    return json(request, { draft: { subject: parsed.subject.trim(), previewText: parsed.previewText.trim(), html: escapeAiHtml(parsed.html.trim()) }, model }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("mail_ai_generation_failed", failureStage, error instanceof Error ? error.name : "UnknownError");
    return json(request, {
      error: failureStage === "inference" ? "Cloudflare Workers AI inference failed. Check that the AI binding is enabled and the model is available." : "The AI response was not valid email JSON. Try a shorter or more specific prompt."
    }, 502, { "Cache-Control": "no-store" });
  }
}
__name(generateMailDraft, "generateMailDraft");
var worker = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    const url = new URL(request.url);
    if (rateLimited(request)) return json(request, { error: "Too many requests" }, 429, { "Cache-Control": "no-store", "Retry-After": "60" });
    if (url.pathname === "/") {
      return json(request, {
        service: "AVRXT API Gateway",
        version: "v1",
        status: "online",
        documentation: "https://www.avrxt.dev/system/api/doc"
      }, 200, { "Cache-Control": "public, max-age=60" });
    }
    if (url.pathname === "/v1/youtube/search") return json(request, { error: "YouTube search is available through the authenticated admin editor." }, 403);
    if (url.pathname === "/v1/mail/generate") return generateMailDraft(request, env);
    if (url.pathname === "/v1/discord/presence/socket" && request.method === "GET") return handleDiscordGateway(request);
    if (url.pathname === "/v1/geo/forecast" && request.method === "GET") return withCors(request, await handleGeo(request, "forecast"));
    if (url.pathname === "/v1/geo/search" && request.method === "GET") return withCors(request, await handleGeo(request, "search"));
    if (url.pathname.startsWith("/v1/discord/presence/") && request.method === "GET") {
      const id = url.pathname.slice("/v1/discord/presence/".length);
      return withCors(request, await handleDiscord(request, id));
    }
    if (url.pathname === "/v1/spotify/now-playing" && request.method === "GET") return withCors(request, await handleSpotify(request, env));
    if (url.pathname === "/v1/status" && request.method === "GET") return await handleStatus(request, env);
    const target = PUBLIC_PROXY_ROUTES[url.pathname];
    if (target) return withCors(request, await proxyToSite(request, env, target, request.method === "GET" ? CACHEABLE_PROXY_ROUTES[url.pathname] : void 0));
    return json(request, { error: "Not found", path: url.pathname }, 404);
  }
};
var worker_default = worker;
export {
  worker_default as default
};


export { json, withCors, rateLimited, getPublicConfig };
