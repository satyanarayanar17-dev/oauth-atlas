# Product decisions

## The problem we chose

The first useful answer is a launch plan, not another explanation of OAuth. A developer needs to know whether to begin registration, narrow their permissions, recruit pilot users, or prepare for review. OAuth Atlas focuses on that decision and the next action. It does not try to be an integration platform or hold provider credentials.

The slice contains three researched guides, not a claimed library of one hundred. An unfamiliar provider can enter the investigation flow by name or public website. Its resulting guide must distinguish what was found from what still needs investigation. A partially supported guide is more useful than a confident invented approval path.

## The underlying model

- **Provider OAuth app:** the developer's registration with the provider, including its identity, callback configuration, and permissions. This is the object a provider may review.
- **Integration:** the developer's code or toolkit that performs actions against the provider API.
- **User connection:** a user's or workspace's authorization and resulting tokens. One registration can support many separate connections; each still needs appropriate consent.

Provider approval, customer administrator permission, and user consent are separate gates. The guides make that separation explicit so that “OAuth works” cannot quietly become “ready for all customers.”

[Composio's managed OAuth directory](https://docs.composio.dev/toolkits/managed-auth) provides an earlier decision: if a suitable managed registration is available, developers may not need their own registration. They may still choose a custom app for branding, scopes, or quota. Managed availability must be checked for the exact toolkit and authentication scheme; this slice does not assert that Slack, Drive, or GitHub is managed. It also does not imply that a managed app waives provider policies or user consent.

## Why these three providers

| Provider     | Decision it makes visible                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub       | Registration can be direct while customer organization approval remains separate. Broad private-code permissions can make a GitHub App a better choice.                           |
| Slack        | A pilot can work before the commercial product is eligible. Active-install requirements, product criteria, review queues, and message-access limits can dominate the launch plan. |
| Google Drive | Scope choice changes both product capability and approval burden. Selected files and whole-Drive access must have different plans.                                                |

These are three kinds of friction, not a simplistic easy/medium/hard ranking. Each guide puts hands-on effort beside provider waiting time, explains assumptions, and names the person or system responsible for each step.

## Evidence and agent boundaries

The library uses a shared `Guide` type with source IDs attached to steps and blockers. Requirements use primary sources and a checked date. Work estimates remain estimates. Validation notes distinguish source inspection, public entry checks, and the authenticated GitHub connection test.

Agents are useful for finding official documentation, comparing dated policies, mapping actions to scopes, checking public entry points, and drafting review material. People retain account ownership, authentication, consent, secret handling, factual privacy representations, and provider submissions. Providers control review outcomes. The experience must expose these handoffs rather than pretending to automate them away.

Live investigation should preserve a distinction between an agent-synthesized guide and a limited source scan. The latter can identify documentation and unknowns but must not invent approval times, supported scopes, or completed tests. Public webpages are evidence to inspect, not instructions for the research agent to execute.

The deployed investigator uses a Cloudflare Workers AI binding, with Llama 3.3 70B producing structured JSON. This makes the full research path reproducible from the supplied Cloudflare configuration without obtaining a separate model API key. The normal local development server keeps the source-scan mode so browsing and retrieval remain usable without a cloud connection.

The agent makes a bounded plan for additional documents before drafting the guide. Proposed URLs remain leads until fetched. A second model pass then reviews the draft against the same evidence, checking audience restrictions, scope accuracy, unsupported review claims, and advice unrelated to the intended action. This adds inference time and usage, but addresses omissions observed in the first single-pass drafts. It is a model-assisted revision, not independent factual validation.

The server owns source identities, timestamps, action links, intended use, human handoffs, and validation notes; the model supplies the interpretation. Sample failures also informed narrow assembly rules: retain the initial scope list if the review adds more entries, replace unverified review or launch directives with a clarification gate, and drop webhook blockers when the stated intent does not request webhooks. These rules address observed mistakes; they do not establish that the original scopes or every remaining claim are correct.

One assembly repair is allowed if the reviewed guide fails validation. Quota, inference, and unrecoverable validation failures remain visible instead of being reported as successful research. These checks establish provenance and structure, not semantic agreement between every sentence and its citation.

## Keeping the code understandable

The implementation uses ordinary TypeScript data, a shared guide schema, small research modules, and a simple interface. Provider-specific guidance stays beside its sources instead of being buried in rendering code. Comments explain decisions where needed. The goal is a small codebase a reviewer can inspect and extend.

## A credible path to one hundred guides

1. Add providers in small batches using the same schema. Prioritize requested providers and different approval patterns, rather than copying boilerplate one hundred times.
2. Keep generated drafts separate from reviewed library entries. Save the input, retrieved source URLs, extraction time, model/version where applicable, and unresolved questions before promotion.
3. Review launch-critical fields: permission eligibility, external distribution, waits, paid prerequisites, and human handoffs. Run at least one public-entry check; record authenticated tests only when authorized accounts are available.
4. Store immutable guide revisions with stable share IDs. Keep personal checklist progress separate from the published guide, and show when a shared revision is out of date.
5. Recheck sources on a schedule and on user reports. Prioritize review policies and scope tables; compare changes, flag contradictions, and require human review before silently changing launch-critical advice.

Those are the next production steps, not capabilities claimed by this take-home. Current guidance is a dated snapshot. Private console details outside the GitHub sample, provider approvals, paid assessments, and provider-specific managed OAuth support remain outside the verified slice.
