import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assembleGuide } from "../lib/research/worker-agent.ts";
import { applyReviewedNotes, checkGuideScopes, isReadOnlyIntent } from "../lib/research/reviewed-notes.ts";

function recorded(name) {
  return JSON.parse(readFileSync(new URL(`../docs/examples/${name}`, import.meta.url), "utf8")).guide;
}

function sourcePages(guide, textByUrl = {}) {
  return guide.sources.map((source) => ({
    url: source.url,
    title: source.title,
    text: textByUrl[source.url] || "OAuth source fixture.",
    links: [],
  }));
}

const figmaUrl = "https://developers.figma.com/docs/rest-api/oauth-apps/";
const calendlyUrl = "https://developer.calendly.com/docs/authentication/creating-an-oauth-app";
const calendlyScopes = "https://developer.calendly.com/docs/authentication/scopes";

// Marker fixtures exercise the source gate; they are not a copy of provider docs.
const figmaMarkers = "admins for your plan; private OAuth apps; when Figma approves your public OAuth app; only opportunity: Client Secret; file_content:read.";
const calendlyMarkers = "exactly one URI; every OAuth app must use PKCE; HTTP Basic authentication; cannot view the client ID again.";

test("scope checks reject absent identifiers rather than accepting a matching prefix", () => {
  const guide = recorded("final-figma-response.json");
  guide.recommendedScopes = ["content:read", "invented:read"];
  const pages = sourcePages(guide);
  pages[0].text = "Available OAuth scope: content:read_more.";
  const result = checkGuideScopes(guide, pages, "Read file contents only.");
  assert.deepEqual(result.recommendedScopes, []);
  assert.match(result.scopeNote, /absent from the retrieved documentation/);
  assert.ok(result.validation.notChecked.some((item) => /does not establish minimum permissions/.test(item)));
});

test("a one-for-one write/admin scope substitution cannot bypass read-only checks", () => {
  const guide = recorded("final-figma-response.json");
  guide.recommendedScopes = ["content:admin", "content:write", "content:read"];
  guide.steps[0].detail = "Request content:admin to read the file.";
  const pages = sourcePages(guide);
  pages[0].text = "OAuth scopes content:admin content:write content:read.";
  const result = checkGuideScopes(guide, pages, "External users connect so an agent can read file contents. No writes or comments.");
  assert.deepEqual(result.recommendedScopes, ["content:read"]);
  assert.equal(result.steps[0].evidence, "unverified");
  assert.ok(!result.steps[0].detail.includes("content:admin"));
});

test("read-only detection handles negated extras without dropping a positive write action", () => {
  assert.equal(isReadOnlyIntent("Read file contents. No comments, writes, or dev resources."), true);
  assert.equal(isReadOnlyIntent("Read issues, without webhooks."), true);
  assert.equal(isReadOnlyIntent("Read issues and post a comment."), false);
  assert.equal(isReadOnlyIntent("Read issues. Do not edit them, but create a follow-up issue."), false);
});

test("reviewed Figma notes correct audience, one-time secret handling, and code exchange", () => {
  const raw = recorded("final-figma-response.json");
  raw.review = "Figma authorizes public users; use a private app for external customers.";
  raw.summary = "Use a private app for external customer connections.";
  raw.recommendedScopes = ["file_content:read", "file_comments:write", "current_user:read"];
  raw.blockers.push({ title: "Public review is slow", detail: "Use a private app instead.", resolution: "Invite all external users to the private app.", sourceIds: ["s1"] });
  const pages = sourcePages(raw, { [figmaUrl]: figmaMarkers });
  const intent = "External customers connect their Figma accounts to read file JSON contents. No comments, writes, or dev resources.";
  const result = assembleGuide(raw, { guide: raw, pages, trace: [] }, intent, pages);

  assert.deepEqual(result.recommendedScopes, ["file_content:read"]);
  assert.match(result.review, /creator and admins for that plan/);
  assert.match(result.review, /private apps serve users in the associated team or organization without Figma review/);
  assert.match(result.review, /Public apps need Figma approval before other users can authorize/);
  assert.match(result.review, /every user still grants their own consent/);
  assert.match(result.summary, /public Figma OAuth app/);
  assert.ok(result.steps.some((step) => /shown only once/.test(step.detail)));
  assert.ok(result.steps.some((step) => /within 30 seconds/.test(step.detail) && /HTTP Basic/.test(step.detail)));
  assert.ok(result.steps.every((step) => step.owner === "developer"));
  assert.ok(!result.blockers.some((item) => /private app instead|Invite all external/.test(`${item.detail} ${item.resolution}`)));
  assert.match(result.validation.correction, /2026-10-31/);
  assert.match(result.validation.correction, /dated editorial corrections/);
  assert.ok(result.validation.notChecked.some((item) => /not attempted/.test(item)));
});

test("reviewed Calendly notes replace unsafe protocol advice and invented approval requirements", () => {
  const raw = recorded("calendly-response.json");
  raw.review = "A private app needs mandatory provider review.";
  const pages = sourcePages(raw, {
    [calendlyUrl]: calendlyMarkers,
    [calendlyScopes]: "scheduled_events:read; webhooks:write is not required if the integration relies on polling.",
  });
  const intent = "External customers connect their own Calendly account to read scheduled events, without webhooks.";
  const result = assembleGuide(raw, { guide: raw, pages, trace: [] }, intent, pages);
  const details = result.steps.map((step) => step.detail).join("\n");
  assert.deepEqual(result.recommendedScopes, ["scheduled_events:read"]);
  assert.match(details, /exactly one callback/);
  assert.match(details, /Sandbox permits HTTPS or HTTP on localhost; Production requires HTTPS/);
  assert.match(details, /client ID, client secret, and webhook signing key/);
  assert.match(details, /none can currently be viewed again/);
  assert.match(details, /Every app requires S256 PKCE/);
  assert.match(details, /retain the verifier for code exchange/);
  assert.match(details, /Server apps also use HTTP Basic/);
  assert.ok(result.steps.findIndex((step) => /one-time credentials/.test(step.title)) <
    result.steps.findIndex((step) => /authenticate the token exchange/.test(step.title)));
  assert.match(result.review, /do not establish a separate provider approval process or turnaround/);
  assert.equal(result.waitTime, "Not established by reviewed sources");
  assert.ok(!result.blockers.some((item) => /webhook/i.test(item.title)));
  assert.match(result.validation.correction, /dated editorial corrections/);
});

test("reviewed notes require the exact official source and current policy markers", () => {
  const guide = recorded("final-figma-response.json");
  const wrongSite = sourcePages(guide, { [figmaUrl]: figmaMarkers }).map((page) => ({ ...page, url: page.url === figmaUrl ? "https://other-provider.dev/oauth-apps/" : page.url }));
  assert.equal(applyReviewedNotes(guide, wrongSite, "External customers read files."), guide);
  const changedPolicy = sourcePages(guide, { [figmaUrl]: "This fixture's policy text has changed." });
  assert.equal(applyReviewedNotes(guide, changedPolicy, "External customers read files."), guide);
});

test("a reviewed source URL alone cannot add a scope absent from the fetched text", () => {
  const raw = recorded("final-figma-response.json");
  const pages = sourcePages(raw, { [figmaUrl]: figmaMarkers.replace("file_content:read", "scope catalog unavailable") });
  const result = assembleGuide(raw, { guide: raw, pages, trace: [] }, "External customers read file JSON contents only.", pages);
  assert.deepEqual(result.recommendedScopes, []);
  assert.match(result.validation.correction, /Reviewed Figma policy notes/);
});

test("the captured Figma HTTPS-only blocker becomes a registered-callback check", () => {
  const raw = recorded("final-figma-response.json");
  // This blocker appeared in the production acceptance capture.
  raw.blockers = [{ title: "HTTPS Redirect URI", detail: "Redirect URI not using HTTPS (s1).", resolution: "Update redirect URI to use HTTPS (s1)", sourceIds: ["s1"] }];
  const pages = sourcePages(raw, { [figmaUrl]: figmaMarkers });
  const result = applyReviewedNotes(raw, pages, "External customers read file contents.");
  assert.ok(!result.blockers.some((item) => item.title === "HTTPS Redirect URI"));
  const callback = result.blockers.find((item) => /registered redirect URL/.test(item.title));
  assert.ok(callback);
  assert.match(callback.detail, /token request must use the same redirect URI/);
  assert.match(callback.detail, /HTTPS-only provider requirement was not verified/);
  assert.match(callback.resolution, /HTTPS for production as a deployment recommendation/);
  assert.deepEqual(callback.sourceIds, ["s1"]);
});

test("the captured Calendly redirect blocker preserves the localhost Sandbox exception", () => {
  const raw = recorded("calendly-response.json");
  // The universal HTTPS remedy was wrong for a Sandbox localhost callback.
  raw.blockers = [{ title: "Invalid Redirect URI", detail: "Redirect URI is not a valid HTTPS URI. Check redirect URI rules in the Calendly documentation and update redirect URI.", resolution: "Update redirect URI to a valid HTTPS URI.", sourceIds: ["s4"] }];
  const pages = sourcePages(raw, { [calendlyUrl]: calendlyMarkers });
  const result = applyReviewedNotes(raw, pages, "Read scheduled events with a localhost development callback.");
  assert.ok(!result.blockers.some((item) => item.resolution === "Update redirect URI to a valid HTTPS URI."));
  const callback = result.blockers.find((item) => /selected environment/.test(item.title));
  assert.ok(callback);
  assert.match(callback.detail, /exactly one redirect URI/);
  assert.match(callback.detail, /Sandbox permits HTTPS or HTTP on localhost; Production requires HTTPS/);
  assert.match(callback.resolution, /local HTTP testing, use a Sandbox app and a localhost callback/);
  assert.deepEqual(callback.sourceIds, ["s4"]);
});

test("the captured Figma credential remedy cannot promise dashboard retrieval of a one-time secret", () => {
  const raw = recorded("final-figma-response.json");
  raw.blockers = [{ title: "Missing Client ID or Client Secret", detail: "Re-register the OAuth app or retrieve the Client ID and Client Secret from the Figma developer dashboard (s1).", resolution: "Re-register or retrieve credentials", sourceIds: ["s1"] }];
  const pages = sourcePages(raw, { [figmaUrl]: figmaMarkers });
  const result = applyReviewedNotes(raw, pages, "External customers read file contents.");
  assert.ok(!result.blockers.some((item) => /retrieve the Client ID and Client Secret|Re-register or retrieve credentials/.test(`${item.detail} ${item.resolution}`)));
  const credentials = result.blockers.find((item) => /secret was not saved/.test(item.title));
  assert.ok(credentials);
  assert.match(credentials.detail, /only when the app is created/);
  assert.match(credentials.resolution, /current credential-replacement flow/);
  assert.match(credentials.resolution, /Do not assume the dashboard can display the original secret again/);
  assert.deepEqual(credentials.sourceIds, ["s1"]);
});

test("Calendly credential blockers preserve the one-time visibility of all three creation values", () => {
  const raw = recorded("calendly-response.json");
  raw.blockers = [{ title: "Missing credentials", detail: "Find the missing client secret in Developer tools.", resolution: "Return to the app and display its original signing key and client secret.", sourceIds: ["s4"] }];
  const pages = sourcePages(raw, { [calendlyUrl]: calendlyMarkers });
  const result = applyReviewedNotes(raw, pages, "Read scheduled events.");
  assert.ok(!result.blockers.some((item) => /display its original signing key/.test(item.resolution)));
  const credentials = result.blockers.find((item) => /Creation credentials/.test(item.title));
  assert.ok(credentials);
  assert.match(credentials.detail, /client ID, client secret, and webhook signing key/);
  assert.match(credentials.detail, /cannot currently be viewed again/);
  assert.match(credentials.resolution, /current credential-replacement process/);
  assert.deepEqual(credentials.sourceIds, ["s4"]);
});
