import test from "node:test";
import assert from "node:assert/strict";
import { discoverProvider } from "../lib/research/discovery.ts";

function catalogResponse(icons) {
  return new Response(JSON.stringify({ icons }), {
    headers: { "content-type": "application/json" },
  });
}

test("name discovery matches a normalized exact title and reuses catalog metadata", async () => {
  let requests = 0;
  const fetcher = async (url, options) => {
    requests++;
    assert.equal(url, "https://cdn.jsdelivr.net/npm/simple-icons@latest/_data/simple-icons.json");
    assert.equal(options.redirect, "manual");
    return catalogResponse([
      { title: "Calendly", source: "https://calendly.com/newsroom" },
      { title: "HubSpot", source: "https://www.hubspot.com/style-guide" },
    ]);
  };
  assert.deepEqual(await discoverProvider("  CALENDLY  ", { fetcher }), {
    name: "Calendly",
    domain: "calendly.com",
    urls: ["https://calendly.com/newsroom", "https://calendly.com/"],
    method: "brand-catalog",
  });
  assert.equal((await discoverProvider("Hub Spot", { fetcher })).domain, "hubspot.com");
  assert.equal(await discoverProvider("Calendly Pro", { fetcher }), null);
  assert.equal(await discoverProvider("Unknown App", { fetcher }), null);
  assert.equal(requests, 1);
});

test("discovery rejects executable, private, and shared-host source leads", async () => {
  const sources = [
    "javascript:alert(1)",
    "https://user:secret@calendly.com/",
    "https://127.0.0.1/",
    "https://metadata.google.internal/",
    "https://github.com/company/app",
    "https://en.wikipedia.org/wiki/App",
    "https://commons.wikimedia.org/wiki/File:Logo.svg",
    "https://cdn.jsdelivr.net/npm/app",
  ];
  for (const source of sources) {
    const fetcher = async () => catalogResponse([{ title: "App", source }]);
    assert.equal(await discoverProvider("App", { fetcher }), null, source);
  }
});

test("unavailable, oversized, and ambiguous catalogs produce no invented domain", async () => {
  const responses = [
    () => new Response("Unavailable", { status: 503 }),
    () => new Response("{}", { headers: { "content-type": "application/json", "content-length": "1000001" } }),
    () => new Response("x".repeat(1_000_001), { headers: { "content-type": "application/json" } }),
    () => catalogResponse([
      { title: "App", source: "https://first.com/" },
      { title: "A pp", source: "https://second.com/" },
    ]),
  ];
  for (const response of responses) {
    assert.equal(await discoverProvider("App", { fetcher: async () => response() }), null);
  }
});
