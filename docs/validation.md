# Guidance validation

Checked on 29 October 2026. Documentation checks establish what a provider currently publishes. They do not establish that an account can complete registration or pass review.

## GitHub sample

| Claim                                                                        | Check                                                                                                                                                                                                                          | Result                                                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A developer can register a personal or organization-owned OAuth app          | Read [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)                                                                                                             | Supported; organization administration is required for organization ownership.                                                                     |
| There is no mandatory global approval step in the ordinary registration path | Compared the registration and [authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) flows                                                                                     | No provider-wide review stage is described. This is a reading of the documented path, not a provider guarantee.                                    |
| Customer organization access can need separate approval                      | Read [organization approval](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization)                                                             | Supported when the organization restricts OAuth apps; no verified turnaround.                                                                      |
| A private-code reader should not assume a narrow read-only OAuth scope       | Compared the [scope table](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps) with [user authorization](https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps) | Confirmed broad repository scope; guide recommends considering a GitHub App.                                                                       |
| The registration link reaches the expected setup path                        | Made an unauthenticated HTTPS request to `https://github.com/settings/applications/new`, following the response redirect                                                                                                       | HTTP 200 at GitHub sign-in, with return URL pointing to registration; title “Sign in to GitHub · GitHub”. No credentials were used or app created. |

### What changed after checking

Current GitHub registration documentation allows up to 10 callback URLs and describes expiring user tokens as enabled by default. The guide avoids older one-callback and non-expiring-token assumptions. Exact callbacks with wildcard matching disabled are the default recommendation; provider documentation now explains configurable wildcard matching.

### Not verified

Authenticated form fields, registration, secret creation, OAuth grant, code exchange, refresh behavior, organization approval, and production API access were not attempted. The 30–60 minute setup range is a planning estimate for registration and a first connection with an existing callback handler. It excludes building that handler from scratch and is not a measured result or provider SLA.

## Slack sample

| Claim                                                 | Check                                                                                                                                                                                                          | Result                                                                                                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A pilot and a commercial launch have different gates  | Read [distribution guidance](https://docs.slack.dev/app-management/distribution/)                                                                                                                              | Unlisted distribution suits early-customer pilots. Commercial distribution calls for Marketplace approval; a workspace may also require admin approval.                                     |
| Current install threshold is ten, not five            | Compared the [September 2026 update](https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement/) with [older guidance](https://docs.slack.dev/changelog/2025/07/08/slack-marketplace/) | The later policy requires ten active workspace installations maintained throughout review. The older temporary five-workspace threshold is stale.                                           |
| Approval can materially delay launch                  | Read the [review process](https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/)                                                                                                            | Published estimates: up to ten business days for preliminary feedback, followed by up to ten weeks for new-app functional review. Feedback loops add time.                                  |
| A generic MCP connector can be ineligible             | Read [submission criteria](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/)                                                                                        | A server without meaningful in-Slack functionality is unsuitable. The page also discusses active users; ten installations alone do not establish eligibility.                               |
| A pilot may not support high-volume message retrieval | Read the [rate-limit change](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/)                                                                                         | Affected commercial non-Marketplace installations have one request/minute and fifteen objects/request for history and replies. This is not a universal limit for internal or approved apps. |
| Public registration entry is reachable                | Opened `https://api.slack.com/apps?new_app=1` without credentials through the research reader                                                                                                                  | The page showed “Your Apps” and required sign-in to create an application. Stopped there. No authenticated creation form was inspected.                                                     |

### What changed after checking

We removed the assumption that public distribution means commercial approval and used the current ten-workspace policy. We also stopped treating a successful OAuth pilot as proof that message-history performance or Marketplace eligibility is ready for launch.

### Not verified

No app was created, installed, granted credentials, or submitted. The callback and token exchange were not executed. The 30–60 minute registration estimate assumes a callback already works; product development, pilot recruitment, and review preparation are additional work. No provider turnaround was measured.

## Google Drive sample

| Claim                                                       | Check                                                                                                                                                                                                                              | Result                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selected-file and broad-Drive access need different plans   | Read the [Drive scope table](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)                                                                                                                           | `drive.file` is non-sensitive. `drive.readonly`, `drive`, and metadata-readonly access are restricted. Narrow access is not feature-equivalent to whole-Drive discovery.                                              |
| Branding and data access are separate reviews               | Compared [consent configuration](https://developers.google.com/workspace/guides/configure-oauth-consent) and [brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) | Branding automation usually takes minutes; manual review usually takes two to three business days. That is not the restricted-scope review duration.                                                                  |
| Broad server-side access can add an ongoing assessment      | Read [restricted verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)                                                                                         | Restricted verification can take several weeks. Restricted data accessed through a server generally needs annual independent security assessment, subject to exceptions. No price or guaranteed deadline is asserted. |
| Testing is unsuitable for persistent production connections | Read [token behavior](https://developers.google.com/identity/protocols/oauth2)                                                                                                                                                     | External Testing refresh tokens normally expire in seven days for Drive scopes. The guide distinguishes refresh-token lifetime from access-token lifetime.                                                            |
| AI-specific client configuration is documented              | Reopened [Create access credentials](https://developers.google.com/workspace/guides/create-credentials), Web application step 6                                                                                                    | The documentation describes an optional immutable AI-powered-agent setting and separate clients for mixed workflows. **Console-dependent: not inspected after login.** It is not presented as a tested UI step.       |
| Public setup entry reaches authentication                   | Opened `https://console.cloud.google.com/auth/clients` without credentials through the research reader                                                                                                                             | Redirected to Google sign-in for Cloud Platform. Stopped there. No project or client was created.                                                                                                                     |

### What changed after checking

Read-only does not imply a light review. The guide separates selected-file access from broad access and avoids a single Google approval estimate. It also avoids claiming that selecting `drive.file` removes every branding or configuration requirement.

An official-docs inconsistency remains: the general [credential guide](https://developers.google.com/workspace/guides/create-credentials) says web applications do not use client secrets, while the specific [confidential web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server) instructs developers to protect a client-secret file. The guide follows the specific server flow and says to protect any secret the chosen client uses. Actual client settings need confirmation in the signed-in console.

### Not verified

No authenticated console form, consent grant, token exchange/refresh, production call, brand approval, scope review, or security assessment was attempted. The 45–90 minute registration range is a planning estimate with ready public pages and a callback; it excludes implementing Picker and security-assessment work. Customer organization policy and Composio managed-app availability remain unverified.

## Evidence handling

Source review, public-entry checks, planning estimates, and completed authenticated tests are separate categories. A checked source supports only the associated claim, not the entire launch. New generated guides should retain unknowns when primary evidence is absent, and a failed fetch should be shown as a research limitation rather than a provider requirement.

## Working-experience checks

On 29 October 2026, the actual local Worker returned a live Notion source scan with four sources and a Linear scan with one source. The first Worker test exposed an unsupported fetch redirect option in DNS preflight; switching to explicit manual redirects corrected it. These checks establish live retrieval, not model synthesis or provider registration.

Browser checks in the narrow in-app preview covered provider selection, Slack’s Evidence tab, saving a checklist item and retaining it on reload, a live Linear investigation outside the curated library, and copying the generated share link. A Unicode share-link round trip is covered by automated tests. Full desktop and accessibility audits have not been completed.

At that stage, 24 automated tests and TypeScript checking passed, and the production build completed. Later tests add inference and guide-assembly coverage. The optional OpenAI branch has not been exercised with a real key; it is no longer required by the hosted deployment.

After the initial publication, the public site and research configuration returned HTTP 200 without sign-in. A hosted Linear investigation also returned HTTP 200 with a retrieved official source. Public browser rendering was checked. That deployment ran source scans rather than full model synthesis.

## Hosting update - 30 October 2026

The public demo moved to [Cloudflare Workers](https://oauth-atlas-fieldguide.satya-tethala.workers.dev). After new-subdomain HTTPS activation, the homepage and research configuration returned HTTP 200 with standard certificate validation. A live Notion investigation returned four sources. The account is permanent; this is not an expiring temporary preview. This first neutral-host deployment used the source-scan mode.

## Workers AI upgrade - 30 October 2026

The current deployment adds a Cloudflare Workers AI binding, using `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. No separate model API key is required. The local development server still defaults to source scans; deployment through `wrangler.deploy.json` supplies the AI binding.

An actual minimal JSON-schema inference probe succeeded with the 70B model. The initially selected 8B model rejected JSON-mode requests despite advertising the response-format field in its model schema. This was corrected by selecting a model explicitly listed in Cloudflare's [JSON-mode documentation](https://developers.cloudflare.com/workers-ai/features/json-mode/). A small successful probe establishes model availability and JSON output, not the complete app's research quality.

Two complete production API investigations in the initial single-draft pipeline returned HTTP 200 in `agent` mode:

| Submitted app               | Intended use                                                                                                                 | Observed duration | Generated result                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| Calendly, submitted by name | External customers connect accounts so a SaaS agent can read scheduled events; public production setup requested             | 30.4 seconds      | Five retrieved sources, six steps, four blocker remedies |
| Figma, submitted by website | External customers connect accounts so an agent can read file contents; public production and draft/private limits requested | 29.6 seconds      | Four retrieved sources, six steps, four blocker remedies |

These were fresh source retrieval and model synthesis, not prewritten library entries or source-scan fallbacks. Durations describe these runs, not a promised response time. Both results preserve the intended use and explicitly state that provider registration, consent, token exchange, and approval were not attempted.

The hosted browser also completed the Calendly form-to-guide flow and displayed the intended use and research receipt. Its share link was copied through the interface and opened in a fresh Chrome tab; the generated guide and intended use were preserved after loading. This checks visible generation and snapshot sharing in addition to the API.

The first Figma draft omitted important distinctions around draft, private, and public app availability. Subsequent drafts remained shallow in that area, and a Calendly draft included irrelevant webhook advice for a read-events use case. These are content-quality failures despite valid JSON and citations. Longer required fields and stronger synthesis instructions alone did not resolve them.

The pipeline therefore added a second model pass that checks the draft against the retrieved documents before returning a revised guide. It explicitly checks audience-mode restrictions, unsupported review steps, irrelevant webhook advice, scope names, and credential constraints. Repetitive source excerpts are also deduplicated. Production checks of this two-pass revision returned HTTP 200 in `agent` mode:

| Submitted app | Observed duration | Generated result                                 |
| ------------- | ----------------- | ------------------------------------------------ |
| Figma         | 63.6 seconds      | Four sources, six steps, four blocker remedies   |
| Calendly      | 71.1 seconds      | Five sources, seven steps, four blocker remedies |

The second pass improved the setup steps but introduced or retained other problems: Figma recommendations expanded into an example scope list, while Calendly retained irrelevant webhook advice and an unsupported mandatory review handoff. The Figma audience distinctions also still need careful human reading against the provider's current documentation. These observations show why model review cannot be treated as independent factual verification.

Server-owned handoffs and targeted assembly rules were then added. If model review increases the number of recommended scopes, the initial list is retained as provisional and the disagreement is disclosed. Unverified review/launch directives become a clarification gate, and a relevance filter attempts to exclude unrequested webhook blockers. At that stage, 47 automated tests passed. These narrow guards reduce observed failures; they do not prove the retained scopes are minimal or every audience restriction is captured.

Production verification of that guard revision, version `8223d62f-ee40-427e-a983-c035350692fd`, returned HTTP 200 in `agent` mode for both apps:

| Submitted app | Observed duration | Generated result                                 |
| ------------- | ----------------- | ------------------------------------------------ |
| Calendly      | 77.8 seconds      | Five sources, seven steps, four blocker remedies |
| Figma         | 78.6 seconds      | Five sources, six steps, four blocker remedies   |

The exact requests, run metadata, and unchanged responses are preserved in [live generation snapshots](examples/README.md). Sample review accepted the core minimum scope recommendations for the requested actions, and both guides kept review durations unknown. Further inspection still found errors: the Figma audience sentence conflates provider review with end-user authorization; the Calendly PKCE step places the verifier in the wrong request, and its read-only intent still receives a webhook blocker. These snapshots establish functioning retrieval, synthesis, evidence review, and sharing—not fully accepted provider instructions.

Source corrections after these captures standardize PKCE instructions, recognize explicitly negated webhook intent, and reject leaked metadata or malformed prose through validation and one repair attempt. The saved snapshots do not establish production behavior of that later code. Final test totals and deployment checks should be read alongside their exact revision; the recorded durations are observations, not response-time guarantees.

Mock inference tests cover the requested JSON configuration, object/string response parsing, malformed output, quota and capacity errors, timeout cleanup, and absence of automatic retries in the inference wrapper. Guide-assembly tests cover intended use, source references, evidence demotion, server-owned source and validation metadata, malformed steps, and evidence-derived action URLs. Two assembly issues were corrected during those checks: null steps now fail safely, and model-supplied action links cannot survive without retrieved source support.

These validations establish software boundaries. They do not establish factual entailment for every generated claim, authenticated provider setup, consent, token behavior, or completed provider review.


## Final submission checks

The corrected pipeline generated another Figma guide over the public API with HTTP 200 in 62.0 seconds on version `ba0ad0bc-39df-4523-b418-2045bb7552dd`: five fetched sources, five steps, four blockers, and `file_content:read`. It described public review, private team/organization limits, and draft testing with the creator/admins. Provider waiting remained unknown. The [raw response](examples/final-figma-response.json) and [request metadata](examples/final-figma-request-meta.json) are preserved.

This check confirmed complete generation after the PKCE, negated-webhook, and prose-validation corrections. It also exposed a remaining ownership problem: the model assigned registration/configuration steps to the agent. The final presentation now keeps authenticated setup with the developer, supplies server-owned research capabilities and human handoffs, and removes duplicate readiness gates. A dedicated test covers that boundary; the software does not have provider-login or app-creation tools.

The final suite passes **50 automated tests**, TypeScript checking, and the production build. The UI labels generated citations as “Source cited · review interpretation.” Public generation and sharing were exercised; the later ownership projection is covered by automated and recorded-response checks. This is still a draft research assistant, not a completed provider setup or an independent factual verifier.

The standard PKCE correction follows [RFC 7636 sections 4.3–4.5](https://www.rfc-editor.org/rfc/rfc7636): the challenge goes to the authorization endpoint, while the verifier belongs in the token request. The correction does not claim that a token exchange was run. No secrets were found by the submission's basic credential-pattern check; ignored local credentials and build output are excluded from the repository.
