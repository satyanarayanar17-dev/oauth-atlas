# Short evaluator demo

Allow about four minutes, including a live request. The latest recorded Calendly and Figma runs took 65.1 and 85.7 seconds; provider availability and model capacity can change that. The [validation log](validation.md) separates source checks, runtime behavior, and the authenticated GitHub test.

## Before presenting

Use the [hosted experience](https://oauth-atlas-fieldguide.satya-tethala.workers.dev) for full investigation. The dialog should show the live research mode. Browsing and generation require no separate model key or provider credentials. Keep credentials out of the app description and shared guide.

`npm run dev` provides the library and source scans locally. The hosted model binding is attached by the deployment configuration described in the README. Configuration alone does not prove that a request will succeed.

## 0:00–0:30 — Explain the pieces

Open **How it works**. Distinguish one provider app registration, the integration's OAuth callback/token handler, and each user's connection. Check the managed OAuth directory before assuming a developer needs their own registration; exact per-toolkit suitability still needs confirmation.

## 0:30–1:20 — Compare the library

- **GitHub:** registration is approachable; organization access is a separate gate and private repository reads deserve a GitHub App decision. Show the [authenticated public-profile check](evidence/github-connection.md): code exchange, identity, refresh, and refreshed identity returned 200; revocation returned 204. No repository scopes were requested.
- **Slack:** compare pilot and commercial distribution. Show the ten-workspace policy, weekly-active-user criterion, meaningful in-Slack functionality, and review estimates.
- **Google Drive:** compare selected-file access with broad read-only access and its restricted-scope obligations. Registration effort and provider waiting are separate estimates.

## 1:20–3:20 — Investigate another provider

Choose **Investigate a new app** and let the evaluator name a provider or supply its official documentation URL. The current library contains three guides; outside-library requests retrieve and generate new drafts.

Two recorded examples:

- App: `Calendly`. Intent: “External customers connect their own Calendly account so my agent can read scheduled events. Read endpoints only, without webhooks. Explain production setup and approval uncertainty.”
- Website: `https://developers.figma.com/docs/rest-api/oauth-apps/`. Intent: “External customers connect their Figma account so my agent can read file JSON contents. No comments, writes, or dev resources. Explain public launch and draft/private audience restrictions.”

Inspect the research receipt, intended use, sources, minimal scopes, next actions, and unknown wait. For Figma and Calendly, open the Evidence section to show the dated editorial notes. Explain that these reviewed corrections apply only when the matching official document and policy markers were fetched; they are not fresh discoveries or a claim that every generated sentence was verified.

For an unfamiliar provider without reviewed notes, inspect the primary sources before treating its eligibility or permissions as established. If identity or retrieval fails, try a direct official OAuth documentation URL and show the limitation. A source scan is identified as limited retrieval rather than a synthesized launch plan.

## 3:20–4:00 — Share and hand off

Mark a checklist step and reload to show local progress. Copy a generated guide link into a fresh tab, then export Markdown. Check that intended use, source links, evidence limits, and ownership survive.

Finish with the boundary: one GitHub public-profile OAuth connection was exercised and revoked. Other authenticated providers, broader permissions, and provider approvals remain untested. The app helps research and preparation; account owners handle authenticated setup, consent, secret storage, and required submissions. Generated drafts still need source review. The current automated suite has 68 passing tests plus TypeScript checks.
