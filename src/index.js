// Garmin Personal API as a private remote MCP connector for Claude, protected by OAuth + a password.
// Secrets: GARMIN_PERSONAL_API_KEY, LOGIN_PASSWORD
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { TokenProvider } from "garmin-personal-mcp/dist/auth.js";
import { GarminClient } from "garmin-personal-mcp/dist/client.js";
import { buildServer } from "garmin-personal-mcp/dist/server.js";

// Workers require fetch to be called without a bound `this`, hence the wrapper.
const boundFetch = (input, init) => fetch(input, init);
let garmin, garminKey;

const apiHandler = {
  async fetch(request, env) {
    if (!garmin || garminKey !== env.GARMIN_PERSONAL_API_KEY) {
      garminKey = env.GARMIN_PERSONAL_API_KEY;
      garmin = new GarminClient(new TokenProvider({ apiKey: garminKey, fetchImpl: boundFetch }), boundFetch);
    }
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const server = buildServer(garmin);
    await server.connect(transport);
    try {
      return await transport.handleRequest(request);
    } finally {
      void transport.close().catch(() => {});
    }
  },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(body, headers = new Headers(), status = 200) {
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Garmin MCP</title>
<style>body{font-family:system-ui,sans-serif;max-width:420px;margin:12vh auto;padding:0 16px;background:#f6f6f4;color:#222}
.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px #0002}input,button{width:100%;box-sizing:border-box;font-size:16px;padding:12px;margin-top:12px;border-radius:8px;border:1px solid #ccc}
button{background:#1a6b4f;color:#fff;border:0;cursor:pointer}.muted{color:#666;font-size:14px}.err{color:#b00020}</style></head>
<body><div class="card">${body}</div></body></html>`, { status, headers });
}

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

function formHtml(clientName, redirectHost, handle, error = "") {
  return `<h2>Connect Garmin data</h2>
<p><b>${esc(clientName)}</b> wants to read your Garmin data.<br><span class="muted">Redirects to: ${esc(redirectHost)}</span></p>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<form method="post" action="/authorize"><input type="hidden" name="handle" value="${esc(handle)}">
<input type="hidden" name="client" value="${esc(clientName)}"><input type="hidden" name="host" value="${esc(redirectHost)}">
<input type="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus>
<button type="submit">Approve</button></form>`;
}

const defaultHandler = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/authorize" && request.method === "GET") {
      const authReq = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      const info = await env.OAUTH_PROVIDER.describeConsent(authReq);
      const tx = await env.OAUTH_PROVIDER.beginConsent(authReq);
      return page(formHtml(info.clientName, info.redirectHost, tx.handle), tx.headers);
    }
    if (url.pathname === "/authorize" && request.method === "POST") {
      const form = await request.formData();
      const pw = env.LOGIN_PASSWORD ?? "";
      const weak = pw.length < 12 || /^(a-long-password|your-|changeme|password)/i.test(pw);
      if (weak) return page(`<h2>Setup not finished</h2><p>LOGIN_PASSWORD is missing, too short or still the example value. Set a new long password in Cloudflare → your Worker → Settings → Variables and Secrets, then try again.</p>`, new Headers(), 503);
      const ok = await sameSecret(String(form.get("password") ?? ""), pw);
      const handle = String(form.get("handle") ?? "");
      if (!ok) {
        await new Promise((r) => setTimeout(r, 1500)); // slow down guessing
        return page(formHtml(form.get("client") ?? "", form.get("host") ?? "", handle, "Wrong password, try again."), new Headers(), 401);
      }
      const approved = await env.OAUTH_PROVIDER.approveConsent(request, handle);
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: approved.request,
        userId: "owner",
        metadata: { label: "garmin" },
        scope: approved.request.scope,
        props: {},
      });
      const headers = new Headers(approved.headers);
      headers.set("location", redirectTo);
      return new Response(null, { status: 302, headers });
    }
    if (url.pathname === "/") return page(`<h2>Garmin MCP</h2><p class="muted">The server is running. Add <code>${esc(url.origin)}/mcp</code> as a custom connector in Claude.</p>`);
    return new Response("Not found", { status: 404 });
  },
};

const providers = new Map();
function providerFor(origin) {
  if (!providers.has(origin)) {
    providers.set(origin, new OAuthProvider({
      apiRoute: "/mcp",
      apiHandler,
      defaultHandler,
      authorizeEndpoint: "/authorize",
      tokenEndpoint: "/token",
      clientRegistrationEndpoint: "/register",
      clientIdMetadataDocumentEnabled: true,
      resourceMetadata: { resource: `${origin}/mcp`, resource_name: "Garmin (personal)" },
    }));
  }
  return providers.get(origin);
}

export default {
  fetch(request, env, ctx) {
    return providerFor(new URL(request.url).origin).fetch(request, env, ctx);
  },
};
