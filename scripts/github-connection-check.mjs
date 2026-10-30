import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const callbackUrl = "http://127.0.0.1:8788/callback";
const safeHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
  "x-content-type-options": "nosniff",
};

function page(title, message, start = false) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title><style>body{font:17px/1.6 system-ui;max-width:640px;margin:70px auto;padding:24px;color:#25382d}a{color:#346346}</style><h1>${title}</h1><p>${message}</p>${start ? '<p><a href="/start">Start the GitHub connection check</a></p>' : ''}</html>`, {
    headers: { ...safeHeaders, "content-type": "text/html; charset=utf-8" },
  });
}

export function createConnectionCheck(config, fetcher = fetch) {
  if (!config.clientId || !config.clientSecret)
    throw new Error("Supply clientId and clientSecret in a private local configuration file.");
  const pending = new Map();
  let report = { provider: "GitHub", status: "ready", callback: callbackUrl, requestedScopes: [] };
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const providerHeaders = {
    accept: "application/json",
    "user-agent": "OAuth-Atlas-Connection-Check",
  };

  async function tokenRequest(params) {
    const response = await fetcher("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { ...providerHeaders, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...params }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json();
    if (!response.ok || typeof data.access_token !== "string")
      throw new Error(`Token request failed (HTTP ${response.status}).`);
    return { data, status: response.status };
  }

  async function readIdentity(token) {
    const response = await fetcher("https://api.github.com/user", {
      headers: { ...providerHeaders, authorization: `Bearer ${token}`, "x-github-api-version": "2026-03-10" },
      signal: AbortSignal.timeout(15_000),
    });
    const user = await response.json();
    if (!response.ok || typeof user.login !== "string")
      throw new Error(`Identity check failed (HTTP ${response.status}).`);
    return { status: response.status, matchesExpected: !config.expectedLogin || user.login === config.expectedLogin };
  }

  async function revoke(token) {
    const response = await fetcher(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/grant`, {
      method: "DELETE",
      headers: { ...providerHeaders, authorization: `Basic ${basic}`, "content-type": "application/json", "x-github-api-version": "2026-03-10" },
      body: JSON.stringify({ access_token: token }),
      signal: AbortSignal.timeout(15_000),
    });
    return response.status;
  }

  async function handle(request) {
    const url = new URL(request.url);
    if (url.origin !== "http://127.0.0.1:8788" || request.method !== "GET")
      return new Response("Local GET requests only.", { status: 403, headers: safeHeaders });
    if (url.pathname === "/")
      return page("OAuth Atlas connection check", "This local test requests public profile access only, checks the authorization code flow, and revokes its own test grant afterward. It does not request repository access.", true);
    if (url.pathname === "/status.json")
      return Response.json(report, { headers: safeHeaders });
    if (url.pathname === "/result")
      return page("Connection check result", report.status === "completed"
        ? "The code exchange and identity check passed. Any issued refresh token was tested, and the test grant was revoked. The saved report contains no credentials."
        : "The check did not complete. Read the local status report for the recorded stage; no credentials are displayed here.");
    if (url.pathname === "/start") {
      const state = crypto.randomBytes(32).toString("base64url");
      const verifier = crypto.randomBytes(32).toString("base64url");
      const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
      pending.clear();
      pending.set(state, { verifier, expiresAt: Date.now() + 10 * 60_000 });
      const target = new URL("https://github.com/login/oauth/authorize");
      target.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: callbackUrl, scope: "", state, code_challenge: challenge, code_challenge_method: "S256", allow_signup: "false" }).toString();
      report = { ...report, status: "awaiting_consent", startedAt: new Date().toISOString() };
      return new Response(null, { status: 302, headers: { ...safeHeaders, location: target.href } });
    }
    if (url.pathname !== "/callback")
      return new Response("Not found.", { status: 404, headers: safeHeaders });
    const state = url.searchParams.get("state");
    const transaction = state && pending.get(state);
    if (!transaction || transaction.expiresAt < Date.now())
      return new Response("The authorization state is missing, expired, or already used.", { status: 400, headers: safeHeaders });
    pending.delete(state);
    if (url.searchParams.has("error") || !url.searchParams.get("code")) {
      report = { ...report, status: "cancelled", finishedAt: new Date().toISOString() };
      return new Response(null, { status: 303, headers: { ...safeHeaders, location: "/result" } });
    }
    let accessToken;
    try {
      report.stage = "code_exchange";
      const exchange = await tokenRequest({ code: url.searchParams.get("code"), redirect_uri: callbackUrl, code_verifier: transaction.verifier });
      accessToken = exchange.data.access_token;
      report = { ...report, exchangeStatus: exchange.status, grantedScopes: typeof exchange.data.scope === "string" ? exchange.data.scope.split(/[ ,]+/).filter(Boolean) : [], expiresIn: exchange.data.expires_in ?? null, refreshIssued: typeof exchange.data.refresh_token === "string" };
      if (report.grantedScopes.length)
        throw new Error("Unexpected non-empty scopes; the test stops rather than using them.");
      report.stage = "identity_check";
      const identity = await readIdentity(accessToken);
      report = { ...report, identityStatus: identity.status, identityMatchesExpected: identity.matchesExpected };
      if (!identity.matchesExpected) throw new Error("The consenting account did not match the expected account.");
      if (exchange.data.refresh_token) {
        report.stage = "token_refresh";
        const refreshed = await tokenRequest({ grant_type: "refresh_token", refresh_token: exchange.data.refresh_token });
        accessToken = refreshed.data.access_token;
        const refreshedIdentity = await readIdentity(accessToken);
        report = { ...report, refreshStatus: refreshed.status, refreshedIdentityStatus: refreshedIdentity.status, refreshedIdentityMatchesExpected: refreshedIdentity.matchesExpected };
        if (!refreshedIdentity.matchesExpected) throw new Error("Refreshed identity did not match.");
      }
      report.status = "completed";
    } catch {
      report = { ...report, status: "failed", error: `The connection check stopped during ${report.stage}. No provider response or credentials were recorded.` };
    } finally {
      if (accessToken) {
        try {
          report.revokeStatus = await revoke(accessToken);
          report.testGrantRevoked = report.revokeStatus === 204;
          if (!report.testGrantRevoked) report.status = "cleanup_needed";
        } catch {
          report = { ...report, status: "cleanup_needed", testGrantRevoked: false };
        }
      }
      report.finishedAt = new Date().toISOString();
    }
    return new Response(null, { status: 303, headers: { ...safeHeaders, location: "/result" } });
  }
  return { handle, getReport: () => structuredClone(report) };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("Usage: node scripts/github-connection-check.mjs /path/to/private-config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const check = createConnectionCheck(config);
  const reportPath = path.join(path.dirname(configPath), "connection-report.json");
  const server = http.createServer(async (req, res) => {
    try {
      const response = await check.handle(new Request(`http://${req.headers.host}${req.url}`, { method: req.method }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      fs.writeFileSync(reportPath, JSON.stringify(check.getReport(), null, 2) + "\n", { mode: 0o600 });
    } catch {
      res.writeHead(500, safeHeaders);
      res.end("The local test could not finish. No credentials were logged.");
    }
  });
  server.requestTimeout = 90_000;
  server.listen(8788, "127.0.0.1", () => console.log("Local connection check: http://127.0.0.1:8788"));
}
