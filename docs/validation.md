# Evidence and validation

Reviewed on 31 October 2026. This log separates provider documentation, authenticated behavior, generated drafts, and software checks. A valid source ID establishes which page was retrieved; it does not prove that every generated interpretation follows from that page.

## Authenticated GitHub connection

A dedicated OAuth app and the account owner's explicit consent were used on 30 October 2026 UTC. The [connection report](evidence/github-connection.json) records:

| Check | Observed result |
| --- | --- |
| Registration | Authenticated form inspected; one exact loopback callback configured, wildcard matching and device flow off. Expiring tokens were enabled by default. |
| Authorization | Fresh state and S256 PKCE; consent displayed **Public data only**. Requested and granted scopes were empty. No repository scopes were requested. |
| Code exchange and identity | Both returned HTTP 200; the identity matched the consenting account. An eight-hour access token and refresh token were issued. |
| Refresh and identity after refresh | Both returned HTTP 200; identity still matched. |
| Cleanup | Grant revocation returned HTTP 204. The test grant/tokens were revoked, the local server stopped, and the private credential configuration deleted. |

The [walkthrough](evidence/github-connection.md) documents the procedure. The report excludes credentials, codes, and tokens. This verifies one public-profile connection; repositories, organizations, email scopes, and production eligibility remain untested. Its interval includes human consent and is not a registration-effort or provider-review benchmark.

## Curated guide sample checks

| Provider | Primary-source check and resulting guidance |
| --- | --- |
| GitHub | [Registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app): ten callbacks and expiring tokens by default. [OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps): state and S256 PKCE. [Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps): `repo` includes writes, supporting the GitHub App recommendation for finer permissions. Customer [organization approval](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization) is separate. |
| Slack | The [installation update](https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement/) requires ten active workspace installations throughout review. [Submission criteria](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/) also discuss ten weekly active users and exclude an MCP server without meaningful in-Slack functionality. The [review process](https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/) publishes up to ten business days for preliminary feedback and ten weeks for new-app functional review. The [rate-limit policy](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/) applies one request/minute and fifteen objects to affected commercial non-Marketplace history/replies calls. These are conditional limits, not limits on every Slack app. |
| Google Drive | The [scope table](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) classifies `drive.file` as non-sensitive; broad read-only and metadata access are restricted. [Brand checks](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) usually run in minutes, with manual review usually two to three business days. [Restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) can take weeks and generally adds an annual assessment for server access, subject to exceptions. [Token guidance](https://developers.google.com/identity/protocols/oauth2) confirms seven-day refresh-token expiry for External Testing with Drive scopes. |

Slack and Google setup entry points reached sign-in; authenticated setup and reviews were not performed. Hands-on ranges are estimates assuming a working callback and public pages, excluding product implementation, pilot recruitment, and assessments.

## Live investigation and corrections

Both final outside-library checks ran on production version `ea6995c9-bf49-45d5-ba93-f6aaf4f35de3`, retrieved five sources, and returned `researchMode: agent`. [Unchanged captures](examples/README.md) preserve the requests and responses.

| Sample | Observation |
| --- | --- |
| [Calendly by name](examples/final-production-calendly-meta.json) | HTTP 200 in 65.1 seconds; four steps and three blockers. |
| [Figma by documentation URL](examples/final-production-figma-meta.json) | HTTP 200 in 85.7 seconds; six steps and three blockers. |

Inspection confirmed the intended minimum read scopes, Figma audience/review distinctions and 30-second code exchange, Calendly environment/PKCE/client-authentication rules, developer ownership, and unknown provider waits. The final callbacks preserve Calendly's Sandbox localhost exception and distinguish Figma's exact registered-callback requirement from an unverified universal HTTPS-only rule. This accepts those core facts in these runs, not every generated sentence or future account condition. Recorded durations are observations rather than response-time guarantees.

One remaining Figma blocker in the final capture suggested retrieving an existing client secret from the dashboard, contradicting its correct one-time secret rule. Inspection caught this, and a subsequent deterministic, source-gated correction replaces that advice with regression coverage. The raw capture remains unchanged. It does not establish production behavior of the post-capture credential patch. The [earlier captures](examples/README.md#earlier-captures-and-corrections) likewise retain their original errors and versions.

Inspection found wrong PKCE wording, irrelevant webhooks, permission expansion, unclear audiences, and setup steps assigned to the agent. Raw captures preserve those mistakes. Current corrections include:

- Server-owned handoffs: authenticated setup stays with the developer; the investigator has public research and drafting capabilities.
- Scope rejection checks: identifiers must occur in retrieved text, and obvious write/admin permissions are removed for read-only requests. Identifier presence alone does not establish necessity or account eligibility.
- Source-gated notes for [Figma](https://developers.figma.com/docs/rest-api/oauth-apps/) and [Calendly](https://developer.calendly.com/docs/authentication/creating-an-oauth-app): exact URLs and policy markers must be fetched before dated editorial corrections apply. These cover audience gates, one-time credentials, callbacks, code exchange, and review uncertainty. Scope corrections additionally require retrieved scope evidence.
- Each corrected guide discloses the source-maintained editorial notes. They are not fresh model discoveries, completed setup, or independent verification of every generated sentence. No review SLA is invented.

PKCE follows [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636): challenge in authorization, verifier in token exchange. New guards were checked with fixtures and recorded responses. Historical captures predate these notes.

## Software and browser checks

**70 automated tests and TypeScript checking pass.** Coverage includes URL/DNS restrictions, retrieval failures, model errors, malformed prose, scope guards, source-gated notes, handoffs, and sharing. The pipeline test checks that planned sources reach drafting and review. Mock tests verify these boundaries, not universal factual accuracy.

Browser checks covered the curated guides, evidence tabs, checklist persistence, Calendly generation, and fresh-tab sharing with intended use intact. Export/share tests check content preservation. Public access to the demo and repository was checked.

Final deployment `75f24097-b3d7-4471-9675-505250d542fe` includes the post-capture credential correction and a selectable share URL alongside clipboard copying. A browser loaded the captured Calendly snapshot and exported its Markdown; the saved file retained intent, minimum scope, human handoffs, and the editorial disclosure. No additional model request was run after the credential-blocker patch; its exact captured failure is covered by a regression test.

## Remaining limits

Provider approvals, other authenticated providers, broader GitHub permissions, and customer-admin restrictions remain untested. Public sources can be inaccessible or stale; reviewed notes need refreshes and generated instructions need source review. The hosted model has finite quota and can fail or time out. Browser storage and basic throttling are take-home choices; production needs durable revisions, stronger abuse controls, and a network-egress boundary.
