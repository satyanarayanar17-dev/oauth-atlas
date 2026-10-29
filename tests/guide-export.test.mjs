import test from "node:test";
import assert from "node:assert/strict";
import {
  isGuide,
  safeLink,
  shareUrl,
  readSharedGuide,
} from "../lib/guide-export.ts";
import { githubGuide } from "../lib/guides/github.ts";
import { slackGuide } from "../lib/guides/slack.ts";
import { googleDriveGuide } from "../lib/guides/google-drive.ts";

test("curated guides have complete source references", () => {
  for (const guide of [githubGuide, slackGuide, googleDriveGuide]) {
    assert.equal(isGuide(guide), true, guide.name);
    const ids = new Set(guide.sources.map((source) => source.id));
    assert.equal(
      ids.size,
      guide.sources.length,
      `${guide.name}: unique sources`,
    );
    for (const step of guide.steps) {
      if (step.evidence === "documented")
        assert.ok(step.sourceIds.length, `${guide.name}: ${step.id}`);
      for (const id of step.sourceIds)
        assert.ok(ids.has(id), `${guide.name}: source ${id}`);
    }
    for (const blocker of guide.blockers) {
      for (const id of blocker.sourceIds)
        assert.ok(ids.has(id), `${guide.name}: blocker source ${id}`);
    }
  }
});

test("shared-guide validation rejects an object where correction text is expected", () => {
  const guide = structuredClone(githubGuide);
  guide.validation.correction = {
    unexpected: "This would crash a React paragraph.",
  };
  assert.equal(isGuide(guide), false);
});

test("shared-guide validation rejects invalid owner and evidence values", () => {
  for (const [property, value] of [
    ["owner", "customer"],
    ["evidence", "verified"],
  ]) {
    const guide = structuredClone(githubGuide);
    guide.steps[0][property] = value;
    assert.equal(isGuide(guide), false, property);
  }
});

test("shared-guide validation rejects an invalid difficulty", () => {
  const guide = structuredClone(githubGuide);
  guide.difficulty = "Instant approval";
  assert.equal(isGuide(guide), false);
});

test("shared-guide validation rejects malformed and dangling source references", () => {
  for (const id of [42, {}, "missing-source"]) {
    const guide = structuredClone(githubGuide);
    guide.steps[0].sourceIds = [id];
    assert.equal(isGuide(guide), false, String(id));
  }
});

test("shared-guide validation rejects duplicate source identifiers", () => {
  const guide = structuredClone(githubGuide);
  guide.sources[1].id = guide.sources[0].id;
  assert.equal(isGuide(guide), false);
});

test("shared-guide validation rejects non-string action URLs", () => {
  const guide = structuredClone(githubGuide);
  guide.steps[0].actionUrl = {
    url: "https://github.com/settings/applications/new",
  };
  assert.equal(isGuide(guide), false);
});

test("links permit HTTPS and reject executable or relative schemes", () => {
  assert.equal(
    safeLink("https://docs.github.com/en/apps"),
    "https://docs.github.com/en/apps",
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://docs.github.com",
    "/relative",
    undefined,
  ]) {
    assert.equal(safeLink(value), undefined);
  }
});

test("a generated Unicode guide round-trips through a share fragment", async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    location: { origin: "https://atlas.example", hash: "" },
  };
  try {
    const guide = {
      ...structuredClone(githubGuide),
      generated: true,
      name: "GitHub · 開発者",
    };
    const link = new URL(await shareUrl(guide));
    assert.equal(link.search, "");
    assert.match(link.hash, /^#guide=/);
    globalThis.window.location.hash = link.hash;
    const restored = await readSharedGuide();
    assert.equal(restored.name, guide.name);
    assert.equal(restored.generated, true);
    assert.deepEqual(restored.steps, guide.steps);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
