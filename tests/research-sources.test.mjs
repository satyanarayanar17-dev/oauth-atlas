import test from "node:test";
import assert from "node:assert/strict";
import {
  publicUrl,
  parsePage,
  documentationLinks,
  fetchPage,
  assertPublicDns,
  isPublicAddress,
} from "../lib/research/sources.ts";
const verifiedDns = async () => {};

test("public URL guard rejects local networks, alternate protocols, credentials and custom ports", () => {
  for (const url of [
    "http://docs.provider.com",
    "https://localhost",
    "https://app.localhost/a",
    "https://app.local/a",
    "https://127.0.0.1",
    "https://2130706433",
    "https://0x7f000001",
    "https://[::1]",
    "https://169.254.169.254",
    "https://user:secret@docs.provider.com",
    "https://docs.provider.com:8443",
    "file:///etc/passwd",
    "https://metadata.google.internal",
  ]) {
    assert.throws(() => publicUrl(url), undefined, url);
  }
});

test("valid public HTTPS documentation URLs preserve query but drop fragments", () => {
  assert.equal(
    publicUrl("/docs/oauth?version=2#start", "https://provider.com").href,
    "https://provider.com/docs/oauth?version=2",
  );
});

test("HTML parsing removes executable code and navigation from source text", () => {
  const page = parsePage(
    "<title>OAuth &amp; apps</title><nav>Menu</nav><main><h1>Create an app</h1><p>Use OAuth &amp; request limited permissions.</p><script>stealCredentials()</script><style>.hidden{}</style></main>",
    "https://provider.com/docs",
  );
  assert.equal(page.title, "OAuth & apps");
  assert.match(page.text, /Use OAuth & request limited permissions/);
  assert.doesNotMatch(page.text, /stealCredentials|hidden|Menu/);
});

test("discovery follows provider docs and excludes unrelated domains and login links", () => {
  const page = parsePage(
    '<main>OAuth setup</main><a href="https://docs.provider.com/oauth">OAuth</a><a href="https://other.com/oauth">Other</a><a href="/login">Login</a><a href="javascript:alert(1)">bad</a><a href="/developers">Developer</a>',
    "https://provider.com/",
  );
  assert.deepEqual(documentationLinks(page), [
    "https://docs.provider.com/oauth",
    "https://provider.com/developers",
  ]);
});

test("a redirect to a private host is rejected before fetching it", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/secrets" },
    });
  };
  await assert.rejects(
    fetchPage("https://provider.com/docs", fetcher, verifiedDns),
    /Local networks/,
  );
  assert.equal(calls, 1);
});

test("redirects are bounded", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { location: `https://provider.com/path/${calls}` },
    });
  };
  await assert.rejects(
    fetchPage("https://provider.com/docs", fetcher, verifiedDns),
    /too many times/,
  );
  assert.equal(calls, 4);
});

test("provider HTTP failures do not become successful evidence", async () => {
  await assert.rejects(
    fetchPage(
      "https://provider.com/docs",
      async () => new Response("not found", { status: 404 }),
      verifiedDns,
    ),
    /HTTP 404/,
  );
});

test("binary and oversized responses are rejected", async () => {
  await assert.rejects(
    fetchPage(
      "https://provider.com/docs",
      async () =>
        new Response("binary", {
          headers: { "content-type": "application/pdf" },
        }),
      verifiedDns,
    ),
    /readable documentation/,
  );
  await assert.rejects(
    fetchPage(
      "https://provider.com/docs",
      async () =>
        new Response("large", {
          headers: { "content-type": "text/html", "content-length": "1000001" },
        }),
      verifiedDns,
    ),
    /too large/,
  );
});

test("an actual readable source retains its final URL and parsed evidence", async () => {
  const content =
    "<title>Provider OAuth</title><main><p>" +
    "Register your OAuth app and configure callback permissions. ".repeat(4) +
    "</p></main>";
  const page = await fetchPage(
    "https://provider.com/docs",
    async () =>
      new Response(content, { headers: { "content-type": "text/html" } }),
    verifiedDns,
  );
  assert.equal(page.url, "https://provider.com/docs");
  assert.equal(page.title, "Provider OAuth");
  assert.match(page.text, /Register your OAuth app/);
});

test("public address check rejects private and reserved IPv4 and IPv6 ranges", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "192.0.2.1",
    "198.51.100.2",
    "203.0.113.1",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
    "2001:db8::1",
    "2002:7f00:0001::1",
  ])
    assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of [
    "1.1.1.1",
    "8.8.8.8",
    "104.18.1.1",
    "2001:4860:4860::8888",
    "2606:4700:4700::1111",
  ])
    assert.equal(isPublicAddress(ip), true, ip);
});

test("DNS preflight blocks public-looking names resolving to internal addresses", async () => {
  const resolver = async (input) =>
    Response.json({ Status: 0, Answer: [{ type: 1, data: "127.0.0.1" }] });
  await assert.rejects(
    assertPublicDns("127.0.0.1.nip.io", resolver),
    /public internet addresses/,
  );
});

test("DNS preflight blocks mixed public and private addresses and local CNAME aliases", async () => {
  await assert.rejects(
    assertPublicDns("provider.com", async () =>
      Response.json({
        Status: 0,
        Answer: [
          { type: 1, data: "1.1.1.1" },
          { type: 28, data: "::1" },
        ],
      }),
    ),
    /public internet addresses/,
  );
  await assert.rejects(
    assertPublicDns("provider.com", async () =>
      Response.json({
        Status: 0,
        Answer: [
          { type: 1, data: "1.1.1.1" },
          { type: 5, data: "metadata.google.internal." },
        ],
      }),
    ),
    /Local networks/,
  );
});

test("DNS failures fail closed instead of skipping the check", async () => {
  await assert.rejects(
    assertPublicDns("provider.com", async () => Response.json({ Status: 3 })),
    /could not be verified/,
  );
  await assert.rejects(
    assertPublicDns(
      "provider.com",
      async () => new Response(null, { status: 500 }),
    ),
    /could not be verified/,
  );
});

test("DNS preflight permits only publicly resolved names", async () => {
  await assertPublicDns("provider.com", async (input) =>
    Response.json({
      Status: 0,
      Answer: input.includes("AAAA")
        ? [{ type: 28, data: "2606:4700:4700::1111" }]
        : [{ type: 1, data: "1.1.1.1" }],
    }),
  );
});
