# Live investigation captures

These files preserve exact production responses from `POST /api/research` on the [hosted experience](https://oauth-atlas-fieldguide.satya-tethala.workers.dev). Metadata records requests, HTTP statuses, durations, and deployed versions. The research form received no provider credentials or model keys. A successful request and this sample review do not certify every generated sentence.

## Final production checks

Both requests below ran on version `ea6995c9-bf49-45d5-ba93-f6aaf4f35de3` and returned `researchMode: agent`.

| Submitted app | Request/run metadata | Unchanged response | Observed result |
| --- | --- | --- | --- |
| Calendly by name | [Metadata](final-production-calendly-meta.json) | [Response](final-production-calendly-response.json) | HTTP 200; 65.1 seconds; five sources, four steps, three blockers |
| Figma by documentation URL | [Metadata](final-production-figma-meta.json) | [Response](final-production-figma-response.json) | HTTP 200; 85.7 seconds; five sources, six steps, three blockers |

Inspection confirmed the core permission, audience, and callback corrections in these particular responses:

- **Figma:** `file_content:read` for file JSON contents; creator/plan-admin draft testing; private apps limited to the associated team or organization; public approval before external-user authorization; separate user consent; one-time client-secret storage; code exchange within 30 seconds. Its callback blocker requires a registered matching URI and distinguishes a production HTTPS recommendation from an unverified universal provider restriction.
- **Calendly:** `scheduled_events:read` for scheduled-event reads; one callback; Sandbox permits localhost HTTP while Production requires HTTPS; one-time creation credentials; mandatory S256 PKCE with the verifier at token exchange; HTTP Basic client authentication for server apps. Its callback blocker now preserves the Sandbox exception. Additional production eligibility and approval timing remain unknown.
- **Handoffs and disclosure:** authenticated setup belongs to the developer. Both responses disclose dated editorial corrections after retrieving the matching official documentation. These notes are maintained in source; they are not fresh model discoveries or evidence that the provider setup was completed.

A further Figma mistake was caught in this final capture: its generated missing-credential blocker suggested retrieving an existing client secret from the dashboard, despite the correctly stated one-time secret rule. The raw response retains that mistake. A subsequent deterministic, source-gated correction replaces the credential-recovery advice and adds regression coverage. This is a post-capture code change; these files do not establish fresh production behavior of that later patch. Follow the one-time storage rule and confirm any recovery procedure in the current provider console.

These checks accept the listed core facts, not every blocker, future endpoint, or provider-account condition. Turnaround remains unestablished and authenticated Figma/Calendly setup was not performed.

## Earlier captures and corrections

| Capture | Metadata | Response | Original observation |
| --- | --- | --- | --- |
| Calendly before callback correction | [Metadata](accepted-calendly-meta.json) | [Response](accepted-calendly-response.json) | HTTP 200; 67.2 seconds; version `06f2edee-0e5b-42fc-8e47-869307a35c91` |
| Figma before callback correction | [Metadata](accepted-figma-meta.json) | [Response](accepted-figma-response.json) | HTTP 200; 73.2 seconds; version `a2f4fef1-ed0c-4021-a4ed-bc49045aa597` |
| Earlier Calendly draft | [Metadata](calendly-request-meta.json) | [Response](calendly-response.json) | HTTP 200; 77.8 seconds; version `8223d62f-ee40-427e-a983-c035350692fd` |
| Earlier Figma draft | [Metadata](figma-request-meta.json) | [Response](figma-response.json) | HTTP 200; 78.6 seconds; version `8223d62f-ee40-427e-a983-c035350692fd` |
| Later Figma draft | [Metadata](final-figma-request-meta.json) | [Response](final-figma-response.json) | HTTP 200; 62.0 seconds; version `ba0ad0bc-39df-4523-b418-2045bb7552dd` |

All historical files remain unchanged. They exposed incorrect PKCE verifier placement, irrelevant webhook advice, unclear audience wording, unnecessary scopes, agent-owned authenticated setup, and overbroad callback blockers. The [recorded-response presentation checks](presentation-checks.json) document local assembly checks, not additional production requests. Filenames containing `accepted` identify earlier sample-check runs; they do not certify all of their content.

To reproduce a request, submit the `request` object from its metadata file to the current API. Results may differ and consume the model allowance. Scope agreement, valid JSON, and resolving source IDs do not prove factual entailment. See the [validation log](../validation.md) for exact limits and the separate [GitHub connection evidence](../evidence/github-connection.md) for the authenticated test.
