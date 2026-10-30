import test from "node:test";
import assert from "node:assert/strict";
import { runJson } from "../lib/research/inference.ts";
import { ResearchError } from "../lib/research/sources.ts";

const schema = {
  type: "object",
  properties: { summary: { type: "string" } },
  required: ["summary"],
};

test("inference sends the exact JSON schema configuration once", async () => {
  const calls = [];
  const ai = {
    async run(model, input) {
      calls.push({ model, input });
      return { response: { summary: "Ready" } };
    },
  };
  const result = await runJson(
    ai,
    "Use only evidence.",
    { app: "Linear" },
    schema,
  );
  assert.deepEqual(result, { summary: "Ready" });
  assert.deepEqual(calls, [
    {
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      input: {
        messages: [
          { role: "system", content: "Use only evidence." },
          { role: "user", content: '{"app":"Linear"}' },
        ],
        max_tokens: 4200,
        temperature: 0.1,
        response_format: { type: "json_schema", json_schema: schema },
      },
    },
  ]);
});

test("inference parses JSON string responses and supports explicit model options", async () => {
  let received;
  const ai = {
    async run(model, input) {
      received = { model, input };
      return { response: '{"summary":"Ready"}' };
    },
  };
  assert.deepEqual(
    await runJson(ai, "System", "Research input", schema, {
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      maxTokens: 5000,
    }),
    { summary: "Ready" },
  );
  assert.equal(received.model, "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  assert.equal(received.input.max_tokens, 5000);
  assert.equal(received.input.messages[1].content, "Research input");
});

test("inference rejects missing, malformed, and truncated outputs without retrying", async () => {
  for (const response of [
    null,
    {},
    { response: "" },
    { response: '{"summary":' },
    { response: "```json\n{}\n```" },
    { response: "{}", finish_reason: "length" },
  ]) {
    let calls = 0;
    const ai = {
      async run() {
        calls++;
        return response;
      },
    };
    await assert.rejects(
      runJson(ai, "System", "Input", schema),
      (error) => error instanceof ResearchError && error.status === 502,
    );
    assert.equal(calls, 1);
  }
});

test("Cloudflare quota and capacity errors become distinct safe messages", async () => {
  await assert.rejects(
    runJson(
      {
        async run() {
          return {
            success: false,
            errors: [{ code: 3036, message: "Daily allocation exhausted" }],
          };
        },
      },
      "System",
      "Input",
      schema,
    ),
    (error) =>
      error.status === 429 && /daily model allowance/.test(error.message),
  );
  await assert.rejects(
    runJson(
      {
        async run() {
          return { error: "Capacity temporarily exceeded", code: 3040 };
        },
      },
      "System",
      "Input",
      schema,
    ),
    (error) => error.status === 503 && /model is busy/.test(error.message),
  );
});

test("unavailable model and JSON-mode failures have useful safe errors", async () => {
  await assert.rejects(
    runJson(
      {
        async run() {
          throw new Error("5035 Model requires Workers Paid plan");
        },
      },
      "System",
      "Input",
      schema,
    ),
    (error) =>
      error.status === 503 &&
      /unavailable for this account/.test(error.message),
  );
  await assert.rejects(
    runJson(
      {
        async run() {
          throw new Error("JSON Mode couldn't be met");
        },
      },
      "System",
      "Input",
      schema,
    ),
    (error) => error.status === 502 && /valid guide JSON/.test(error.message),
  );
});

test("unexpected provider errors never expose request details", async () => {
  const sensitive = "private-input-should-not-appear";
  await assert.rejects(
    runJson(
      {
        async run() {
          throw new Error(`Unexpected upstream detail: ${sensitive}`);
        },
      },
      "System",
      sensitive,
      schema,
    ),
    (error) => error.status === 503 && !error.message.includes(sensitive),
  );
});

test("inference times out after sixty seconds without issuing another request", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const pending = runJson(
    {
      run() {
        calls++;
        return new Promise(() => {});
      },
    },
    "System",
    "Input",
    schema,
  );
  const assertion = assert.rejects(
    pending,
    (error) =>
      error instanceof ResearchError &&
      error.status === 504 &&
      /timed out/.test(error.message),
  );
  await Promise.resolve();
  t.mock.timers.tick(60_000);
  await assertion;
  assert.equal(calls, 1);
});

test("the timeout is cleared when inference finishes early", async (t) => {
  let cleared = 0;
  const original = globalThis.clearTimeout;
  t.mock.method(globalThis, "clearTimeout", (timer) => {
    cleared++;
    return original(timer);
  });
  await runJson(
    {
      async run() {
        return { response: { summary: "Ready" } };
      },
    },
    "System",
    "Input",
    schema,
  );
  assert.equal(cleared, 1);
});
