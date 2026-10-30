import test from "node:test";
import assert from "node:assert/strict";
import { investigateWithWorker } from "../lib/research/worker-agent.ts";
import { guideSchema } from "../lib/guide-schema.ts";

const registrationUrl = "https://provider.dev/docs/oauth";
const scopesUrl = "https://provider.dev/docs/scopes";
const intent = "External customers connect their own account to read file contents.";

function draftGuide() {
  return {
    name: "Provider OAuth guide",
    summary: "Draft: use a private app for external customers.",
    difficulty: "Conditional review",
    setupTime: "1–2 hours",
    waitTime: "Unknown",
    timeNote: "Assumes an existing callback handler.",
    review: "Review requirements need confirmation.",
    scopeNote: "The draft has not yet narrowed its permissions.",
    recommendedScopes: ["all:write"],
    prerequisites: ["A provider account", "A working HTTPS callback"],
    steps: [
      {
        title: "Register the app",
        detail: "Open the provider registration page and configure a public OAuth app for external customers. Save its credentials securely and confirm the exact callback matches your integration.",
        owner: "developer",
        evidence: "documented",
        sourceIds: ["s1"],
      },
      {
        title: "Select the minimum scope",
        detail: "The draft has not confirmed its scope selection yet. Review the endpoint requirements before requesting permissions, then test a harmless request against the intended content endpoint.",
        owner: "developer",
        evidence: "unverified",
        sourceIds: [],
      },
    ],
    blockers: [],
    agentCan: ["Prepare a registration checklist from the retrieved documents."],
    humanMust: ["Sign in, register the app, and test consent."],
    unknowns: ["Review turnaround time"],
  };
}

test("the pipeline fetches planned evidence and returns the reviewed guide rather than its draft", async (t) => {
  const events = [];
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin === "https://cloudflare-dns.com") {
      assert.equal(url.searchParams.get("name"), "provider.dev");
      return Response.json({
        Status: 0,
        Answer: url.searchParams.get("type") === "A"
          ? [{ type: 1, data: "93.184.216.34" }]
          : [],
      });
    }
    events.push(`fetch:${url.href}`);
    if (url.href === registrationUrl) {
      return new Response(
        "<title>Provider OAuth registration fixture</title><main><p>Register an OAuth app with an exact HTTPS callback. Draft apps permit creator testing only. Private apps serve the associated organization. Public apps require provider approval before external customers can authorize.</p></main>",
        { headers: { "content-type": "text/html" } },
      );
    }
    if (url.href === scopesUrl) {
      return new Response(
        "<title>Provider OAuth scopes fixture</title><main><p>The content:read scope permits reading file contents. It does not grant writes. Match scopes to the intended endpoint, request only the necessary access, and verify the returned user grant after authorization.</p></main>",
        { headers: { "content-type": "text/html" } },
      );
    }
    assert.fail(`Unexpected outbound request: ${url.href}`);
  });

  const draft = draftGuide();
  const reviewed = structuredClone(draft);
  reviewed.summary = "Use a public app and content:read for external file readers.";
  reviewed.review = "Draft apps permit creator testing only; private apps are limited to the associated organization. External customers require a public app and provider approval. Review turnaround is not established by the retrieved evidence.";
  reviewed.scopeNote = "content:read permits the requested file reads without write access.";
  reviewed.recommendedScopes = ["content:read"];
  reviewed.steps[1] = {
    title: "Request content:read",
    detail: "Select content:read for the file-reading endpoint, without adding write permissions. Complete a test authorization and inspect the granted scope before calling a harmless read endpoint.",
    owner: "developer",
    evidence: "documented",
    sourceIds: ["s2"],
  };

  let modelCalls = 0;
  const ai = {
    async run(_model, input) {
      modelCalls++;
      const request = JSON.parse(input.messages[1].content);
      if (modelCalls === 1) {
        events.push("model:plan");
        assert.equal(request.intent, intent);
        assert.deepEqual(request.documents.map((source) => source.url), [registrationUrl]);
        return { response: { name: "Provider", domain: "provider.dev", urls: [scopesUrl] } };
      }
      if (modelCalls === 2) {
        events.push("model:draft");
        assert.deepEqual(request.documents.map((source) => source.url), [registrationUrl, scopesUrl]);
        assert.match(request.documents[1].text, /content:read/);
        return { response: structuredClone(draft) };
      }
      assert.equal(modelCalls, 3, "No unnecessary repair or retry should run.");
      events.push("model:review");
      assert.deepEqual(request.draft, draft);
      assert.equal(request.intent, intent);
      assert.match(request.documents[0].text, /Private apps serve the associated organization/);
      return { response: reviewed };
    },
  };

  const result = await investigateWithWorker(registrationUrl, intent, ai);
  assert.deepEqual(events, [
    `fetch:${registrationUrl}`,
    "model:plan",
    `fetch:${scopesUrl}`,
    "model:draft",
    "model:review",
  ]);
  assert.equal(guideSchema.safeParse(result.guide).success, true);
  assert.equal(result.guide.summary, reviewed.summary);
  assert.notEqual(result.guide.summary, draft.summary);
  assert.deepEqual(result.guide.recommendedScopes, ["content:read"]);
  assert.match(result.guide.review, /External customers require a public app/);
  assert.deepEqual(result.guide.steps[1].sourceIds, ["s2"]);
  assert.equal(result.guide.steps[1].actionUrl, scopesUrl);
  assert.equal(result.guide.researchMode, "agent");
  assert.equal(result.guide.intent, intent);
  assert.ok(result.trace.some((item) => item.label === "Targeted source retrieved"));
  assert.match(result.trace.at(-1).detail, /second model pass/);
});
