# OAuth Atlas

[Live experience](https://oauth-atlas-fieldguide.satya-tethala.workers.dev) · [Source repository](https://github.com/satyanarayanar17-dev/oauth-atlas)

A focused slice of the APM Integrations take-home: three researched OAuth launch guides, live investigation for another app, and shareable results. Each guide separates registration work, provider waiting, scope decisions, blockers, and the point where a developer must take over.

The hosted app uses Cloudflare Workers AI without a separate OpenAI key. Production requests have generated structured drafts for Calendly and Figma; these require human review and do not represent completed provider setups. See [validation](docs/validation.md) for observed runs and remaining quality checks.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). The default local development server has no AI binding: browsing, checklists, exports, and live source scans work without credentials. A source scan retrieves documentation and records unknowns; it does not synthesize a complete launch plan.

## Deploy the full investigator

```sh
npx wrangler login
npm run deploy
```

`wrangler.deploy.json` builds and publishes the server and client assets together, and binds Workers AI as `AI`. Choose your own Worker name in that file when deploying a separate copy. Wrangler uses your signed-in Cloudflare account and its `workers.dev` subdomain.

The investigator uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through `env.AI.run()`. There is no model API key to copy into the app. Cloudflare's free allocation is finite; quota, capacity, and model failures return explicit errors. Local development does not attach this production binding automatically. [Workers AI setup](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/), [usage limits and pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

Check the selected runtime mode with `GET /api/research`. A response of `agent` means an AI binding or optional model key is configured; it is not a health check or proof that generation will succeed.

To run an investigation directly:

```sh
curl https://oauth-atlas-fieldguide.satya-tethala.workers.dev/api/research \
  -H 'Content-Type: application/json' \
  --data '{"query":"Calendly","intent":"External customers connect their Calendly account so my agent can read scheduled events. Explain public production setup."}'
```

## What the experience does

- **Library:** GitHub, Slack, and Google Drive demonstrate different launch gates, with linked requirements, estimates, blockers, and explicit validation limits.
- **Live investigation:** submit an app name or public HTTPS website and describe the intended action. Documentation starting points and public brand metadata supply research leads. The agent chooses follow-up documents, the server fetches them, and the model drafts a guide. A second model pass checks the draft against those documents and revises it before assembly. A lead alone is never treated as proof of OAuth support.
- **Evidence boundaries:** sources, action links, human handoffs, and validation notes are assembled on the server. Rules constrain added scope recommendations, turn unverified launch directives into clarification steps, and remove unrelated webhook blockers. These rules and the second model pass are not independent factual validation; generated guidance still needs human review. A model failure is shown as a failure in the Workers AI path, rather than silently presenting a source scan as a completed guide.
- **Progress and sharing:** checklist progress and generated guides stay in browser storage. Curated guides have query links; generated snapshots travel as compressed JSON in the URL fragment. Markdown export provides a portable copy. Anyone receiving a share link can read its guide.

Neither research mode creates provider apps, handles their secrets, grants consent, or completes approvals. No provider credentials are required for the demo. Keep credentials out of submitted app descriptions, guide content, and share links.

## Check the code

```sh
npm test
npm run check
npm run build
```

Tests cover URL/DNS restrictions, retrieval and discovery failures, model response handling, evidence assembly, and sharing round trips. Mock model tests establish request and validation behavior, not live inference quality. See the [validation log](docs/validation.md), [captured production responses and review notes](docs/examples/README.md), [product decisions](docs/product-decisions.md), and [demo script](docs/demo-script.md).

## Decisions and limitations

React and TypeScript run on a Vinext/Cloudflare Worker starter. Provider guidance is ordinary data under `lib/guides/`; `lib/research/` separates discovery, fetching, inference, and guide assembly. There is no database. The slice prioritizes three different launch problems over one hundred placeholder guides.

Curated provider policies were checked on 29 October 2026. Effort ranges are planning estimates, not measured setup times. Authenticated registration, token exchange, and provider approvals remain untested. Public sources can be inaccessible, stale, contradictory, or insufficient; citations and schema validation do not prove every generated interpretation.

Browser storage and URL snapshots are take-home persistence choices. Name discovery depends partly on public brand metadata and may need an official website to disambiguate an app. The per-isolate request guard is not durable abuse control. Public DNS checks block private addresses, but cannot pin the later fetch connection; production hardening should include an egress boundary against DNS rebinding.

An optional legacy OpenAI Responses/web-search path remains available through server-side `OPENAI_API_KEY` and `OPENAI_MODEL` settings when no Workers AI binding is present. It is not required by the hosted demo and has not been tested with a real OpenAI key.
