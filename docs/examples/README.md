# Live generation snapshots

These are unchanged production API responses captured on 30 October 2026 from `POST /api/research` on the [hosted app](https://oauth-atlas-fieldguide.satya-tethala.workers.dev). Each metadata file contains the submitted request, HTTP status, observed duration, response size, and deployed version. No API keys or provider credentials were supplied.

| App                                   | Request and run metadata               | Raw response                       | Result                                                           |
| ------------------------------------- | -------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Calendly, submitted by name           | [Metadata](calendly-request-meta.json) | [Response](calendly-response.json) | HTTP 200; 77.8 seconds; five sources, seven steps, four blockers |
| Figma, submitted by documentation URL | [Metadata](figma-request-meta.json)    | [Response](figma-response.json)    | HTTP 200; 78.6 seconds; five sources, six steps, four blockers   |

Both runs used version `8223d62f-ee40-427e-a983-c035350692fd`, retrieved public sources, and returned `researchMode: agent`. They used the model drafting and evidence-review passes. These are captured drafts, not approved library guides or a substitute for the provider documentation. The raw files intentionally preserve mistakes found during inspection.

## Human review notes

- **Minimum scopes:** the Calendly snapshot recommends `scheduled_events:read` for reading scheduled events. The Figma snapshot recommends `file_content:read` for the requested file-JSON endpoint. The sample review accepted these core scope choices for the stated actions; this does not establish scopes for other endpoints.
- **Provider waiting:** both snapshots leave the review wait unknown. Neither records an actual provider response or completed approval.
- **Figma audience wording:** the review paragraph conflates provider review of a public app with authorization by an end user. Its shorthand about draft and private app audiences also needs checking against the full, current documentation. Do not use that sentence as an eligibility rule.
- **Calendly PKCE wording:** the captured step incorrectly says to include both the challenge and verifier in the authorization request. This was identified for a server-side correction after capture. The snapshot must not be followed verbatim for PKCE implementation.
- **Calendly relevance:** a webhook blocker remains even though the request explicitly excludes webhooks. This is unnecessary advice for this use case.

A second pass over the same sources did not eliminate these errors. Scope agreement, valid JSON, and correct source IDs establish useful boundaries, not factual correctness of the entire plan. Provider registration, consent, token exchange, refresh, and approvals were not executed. See [the validation log](../validation.md) for the checks, corrections, and remaining limitations.

Later source changes add standard PKCE wording, recognize explicitly negated webhook intent, and reject leaked metadata or malformed prose through validation and one repair attempt. These immutable snapshots predate those changes; they do not prove the later code was exercised in production. To reproduce a request, send the `request` object from its metadata file to the current API. New responses may differ and consume the account's model allowance.


## Later production sample

[Final Figma response](final-figma-response.json) and [metadata](final-figma-request-meta.json) capture a later HTTP 200 run in 62.0 seconds. Its minimum scope and main audience distinctions improved, with five actual sources and an unknown provider wait. Its model-assigned setup owners were still wrong for this research-only app. The final server-owned ownership projection corrects that presentation; the immutable response records the issue rather than rewriting history. See the final validation section for the exact boundary and test coverage.
