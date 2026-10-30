import test from "node:test";
import assert from "node:assert/strict";
import { assembleGuide } from "../lib/research/worker-agent.ts";
import { ResearchError } from "../lib/research/sources.ts";

const intent = "External customers connect an account to read issues.";
const pages = [
  {
    url: "https://linear.app/developers/oauth-2-0-authentication",
    title: "OAuth documentation fixture",
    text: "A test fixture for app registration and scope selection.",
    links: [],
  },
];
const scan = {
  guide: { name: "Linear", domain: "linear.app" },
  trace: [],
  pages,
};

function modelGuide() {
  return {
    name: "Linear",
    summary:
      "Register an OAuth app, then confirm the scopes for the intended action.",
    difficulty: "Needs investigation",
    setupTime: "Not established",
    waitTime: "Not established",
    timeNote: "This fixture contains no timing claim.",
    review: "Confirm whether review applies to this app type.",
    scopeNote: "Choose the minimum permissions for the action.",
    recommendedScopes: [],
    prerequisites: ["A developer account"],
    steps: [
      {
        title: "Read the app registration instructions",
        detail: "Open the retrieved OAuth documentation.",
        owner: "developer",
        evidence: "documented",
        sourceIds: ["s1"],
      },
      {
        title: "Confirm production access",
        detail: "Check which approval requirements apply to this use case.",
        owner: "developer",
        evidence: "unverified",
        sourceIds: [],
      },
    ],
    blockers: [
      {
        title: "Approval requirements remain unclear",
        detail: "The fixture does not establish a review policy.",
        resolution: "Read the full provider requirements before launch.",
        sourceIds: ["s1"],
      },
    ],
    agentCan: ["Prepare a checklist from the retrieved documentation."],
    humanMust: ["Sign in, register the app, and test a real connection."],
    unknowns: ["Account-specific approval requirements"],
  };
}

test("assembly accepts retrieved source IDs and preserves the requested intent", () => {
  const raw = modelGuide();
  raw.intent = "A different model-supplied use case";
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.intent, intent);
  assert.equal(guide.domain, "linear.app");
  assert.equal(guide.researchMode, "agent");
  assert.equal(guide.generated, true);
  assert.deepEqual(guide.steps[0].sourceIds, ["s1"]);
  assert.equal(guide.steps[0].actionUrl, pages[0].url);
  assert.equal(guide.steps[0].id, "step-1");
  assert.match(guide.timeNote, /Planning estimate, not a measured/);
});

test("an unverified launch action stays behind an explicit readiness check", () => {
  const raw = modelGuide();
  raw.steps[1].title = "Launch Production";
  raw.steps[1].detail = "Publish the integration.";
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.steps[1].title, "Confirm readiness before external launch");
  assert.match(guide.steps[1].detail, /before external rollout/);
  assert.equal(guide.steps[1].evidence, "unverified");
});

test("review cannot silently grow the requested scope list", () => {
  const raw = modelGuide();
  raw.recommendedScopes = ["content:read", "comments:write"];
  const guide = assembleGuide(raw, scan, intent, pages, ["content:read"]);
  assert.deepEqual(guide.recommendedScopes, ["content:read"]);
  assert.match(guide.scopeNote, /not been added automatically/);
  assert.ok(guide.validation.notChecked.some((item) => /disagreed on permissions/.test(item)));
});

test("handoffs do not claim an undocumented review is mandatory", () => {
  const raw = modelGuide();
  raw.humanMust = ["Submit mandatory provider review."];
  raw.blockers.push({ title: "Webhooks fail", detail: "Optional feature", resolution: "Check scopes", sourceIds: [] });
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.ok(guide.humanMust.some((item) => /any provider review required/.test(item)));
  assert.ok(!guide.humanMust.some((item) => /mandatory/.test(item)));
  assert.ok(!guide.blockers.some((item) => /webhook/i.test(item.title)));
  const noWebhooks = assembleGuide(raw, scan, intent + " without webhooks", pages);
  assert.ok(!noWebhooks.blockers.some((item) => /webhook/i.test(item.title)));
});

test("PKCE instructions keep the verifier out of the authorization URL", () => {
  const raw = modelGuide();
  raw.steps[0].title = "Implement PKCE";
  raw.steps[0].detail = "Send code challenge and verifier in the authorization request.";
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.match(guide.steps[0].detail, /send code_verifier to the token endpoint, not in the authorization URL/);
});

test("response metadata leaked inside prose is rejected for repair", () => {
  const raw = modelGuide();
  raw.steps[0].detail = "Read the docs. 'owner': 'developer', 'sourceIds': ['s1']}";
  assert.throws(() => assembleGuide(raw, scan, intent, pages), ResearchError);
});

test("the research-only agent cannot assign itself authenticated setup work", () => {
  const raw = modelGuide();
  raw.steps[0].owner = "agent";
  raw.agentCan = ["Sign in and create an OAuth app."];
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.steps[0].owner, "developer");
  assert.ok(!guide.agentCan.some((item) => /sign in|create an OAuth app/i.test(item)));
});

test("assembly rejects step references that are absent from the retrieved sources", () => {
  const raw = modelGuide();
  raw.steps[0].sourceIds = ["s404"];
  assert.throws(
    () => assembleGuide(raw, scan, intent, pages),
    (error) =>
      error instanceof ResearchError &&
      /invalid source reference/.test(error.message),
  );
});

test("assembly rejects dangling blocker references and missing source evidence", () => {
  const raw = modelGuide();
  raw.blockers[0].sourceIds = ["not-retrieved"];
  assert.throws(() => assembleGuide(raw, scan, intent, pages), ResearchError);
  assert.throws(
    () => assembleGuide(modelGuide(), scan, intent, []),
    ResearchError,
  );
});

test("a source-less documented step is demoted while a supported step remains documented", () => {
  const raw = modelGuide();
  raw.steps[1].evidence = "documented";
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.steps[0].evidence, "documented");
  assert.equal(guide.steps[1].evidence, "unverified");
  assert.deepEqual(guide.steps[1].sourceIds, []);
});

test("assembly rejects a guide when none of its steps have documented source support", () => {
  const raw = modelGuide();
  raw.steps.forEach((step) => {
    step.evidence = "documented";
    step.sourceIds = [];
  });
  assert.throws(
    () => assembleGuide(raw, scan, intent, pages),
    (error) =>
      error instanceof ResearchError &&
      /did not support an actionable/.test(error.message),
  );
});

test("model-supplied sources and verification metadata cannot replace server evidence", () => {
  const raw = modelGuide();
  raw.sources = [
    {
      id: "s1",
      title: "Invented evidence",
      url: "https://invented-source.invalid/approved",
      checkedAt: "2099-01-01",
    },
  ];
  raw.validation = {
    checked: ["Provider registration tested and approval completed"],
    notChecked: [],
  };
  raw.domain = "invented-provider.invalid";
  raw.updatedAt = "2099-01-01";
  raw.researchMode = "source-scan";
  raw.verified = true;
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.sources.length, 1);
  assert.equal(guide.sources[0].url, pages[0].url);
  assert.equal(guide.sources[0].title, pages[0].title);
  assert.equal(
    guide.sources[0].checkedAt,
    new Date().toISOString().slice(0, 10),
  );
  assert.equal(guide.domain, "linear.app");
  assert.equal(guide.researchMode, "agent");
  assert.equal(guide.verified, undefined);
  assert.ok(
    guide.validation.checked.some((item) =>
      item.includes("Fetched 1 public documents"),
    ),
  );
  assert.ok(
    guide.validation.notChecked.some((item) =>
      item.includes("approval were not attempted"),
    ),
  );
  assert.ok(
    guide.validation.notChecked.includes(
      "Account-specific approval requirements",
    ),
  );
  assert.ok(
    !guide.validation.checked.some((item) =>
      item.includes("approval completed"),
    ),
  );
});

test("action links are derived from evidence rather than model-supplied URLs", () => {
  const raw = modelGuide();
  raw.steps[0].actionUrl = "https://unrelated.example.com/start";
  raw.steps[1].actionUrl = "https://unrelated.example.com/approve";
  const guide = assembleGuide(raw, scan, intent, pages);
  assert.equal(guide.steps[0].actionUrl, pages[0].url);
  assert.equal(guide.steps[1].actionUrl, undefined);
});

test("null or incomplete model steps produce a safe validation failure", () => {
  for (const step of [null, {}, "invalid-step"]) {
    const raw = modelGuide();
    raw.steps[0] = step;
    assert.throws(() => assembleGuide(raw, scan, intent, pages), ResearchError);
  }
});
