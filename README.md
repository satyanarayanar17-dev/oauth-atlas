# OAuth Atlas

[Hosted preview](https://oauth-atlas-fieldguide.satya-tethala.workers.dev) · [Source repository](https://github.com/satyanarayanar17-dev/oauth-atlas)

Both links are public. Live research currently uses the key-free source scan; full agent synthesis still needs a model key and an end-to-end test.

A focused slice of the APM Integrations take-home: three researched OAuth launch guides, an investigation flow for another app, and shareable results. The guides separate registration work, provider waiting, scope decisions, and the point where a developer must take over.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173). No provider credentials or model key are needed to browse the library or run the limited source scan.

For model-assisted investigation, create an ignored `.dev.vars` file in the project root and restart the server:

```dotenv
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-4.1
```

`OPENAI_MODEL` is optional; the selected model must support the Responses API and web search. Keep keys server-side. Check the configured mode with:

```sh
curl http://localhost:5173/api/research
```

This returns `source-scan` or `agent`. It detects key configuration, not whether the key/model is valid. Hosted environments need the same variables set as runtime secrets; local files are not deployed.

## What works

- **GitHub, Slack, Google Drive:** source-linked setup steps, blockers, scope tradeoffs, effort estimates, ownership, and explicit validation limits.
- **Live investigation:** submit a name or public HTTPS website. Known names have official documentation starting points, fetched again each run. An unknown name needs its website in scan mode.
- **Two honest modes:** without a key, the server fetches public pages, follows a bounded set of documentation links, and produces a dated source brief with unknown timing and approval conclusions. With a key, an agent searches and synthesizes a structured guide. Failed or invalid model research falls back to the scan when possible.
- **Progress and sharing:** checklist progress and generated guides stay in browser storage. Curated guides have query links; generated guides travel as compressed JSON in the URL fragment. Markdown export provides a portable copy. Share links are snapshots, not durable database records; anyone receiving a link can read its guide.

The full model branch is implemented but **has not been exercised with a real API key** in this build. A source scan is not a complete provider-specific agent guide. Neither mode creates provider apps or completes approvals. Do not place credentials in guide content or links.

## Check the code

```sh
npm test
npm run check
npm run build
```

The tests cover source retrieval boundaries, documentation discovery, guide/source validation, and share-link round trips. They do not establish real provider setup or approval. See [guidance validation](docs/validation.md) for actual documentation checks and sign-in gates reached.

## Structure and decisions

- `app/page.tsx`, `components/`: library, guide views, and investigation dialog.
- `app/api/research/route.ts`: request validation and research mode selection.
- `lib/guides/`: three curated guides using `lib/types.ts`.
- `lib/research/`: public-source retrieval, discovery, optional model synthesis and validation.
- `lib/guide-export.ts`: Markdown export and snapshot sharing.

React and TypeScript run on the supplied Vinext/Cloudflare Worker starter. There is no database. The scope is deliberately small enough to inspect: three different launch problems, rather than one hundred repetitive placeholders. See [product decisions](docs/product-decisions.md), [validation](docs/validation.md), and the [three-minute demo](docs/demo-script.md).

Public fetches can fail on browser-only docs or sign-in. Model citations are checked against retrieved URLs, but that does not prove every interpretation. Effort estimates are not measured setup results. Policies are a snapshot dated 29 October 2026. Browser storage, URL sharing, and the per-isolate request guard are take-home choices, not a production persistence or abuse-control system.

The source fetcher checks public DNS and blocks private addresses, redirects, and oversized pages. DNS resolution cannot pin the later fetch address, so a production deployment still needs an egress boundary that prevents DNS rebinding.

## Publish to Cloudflare Workers

```sh
npx wrangler login
npm run deploy
```

`wrangler.deploy.json` builds and publishes the server and client assets together. The deployment uses the signed-in Cloudflare account and its workers.dev subdomain. Configure optional research-service secrets separately in that account; local secret files are not uploaded.
