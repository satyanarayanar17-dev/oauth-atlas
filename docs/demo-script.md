# Three-minute evaluator demo

Allow extra time if a provider or the model responds slowly. Do not disguise a source scan as model research.

## Before presenting

Use the [hosted experience](https://oauth-atlas-fieldguide.satya-tethala.workers.dev) for the full Workers AI investigation. Check `GET /api/research` or open the investigation dialog to confirm `agent` mode. No separate model key or provider credentials are needed. Configuration alone does not prove a successful run; keep the latest [validation log](validation.md) available.

`npm run dev` reproduces the library and source-scan flow locally. It does not attach the production AI binding automatically. To publish your own complete investigator, sign in to Cloudflare and use `npm run deploy` as described in the README.

Keep the [validation log](validation.md) available. No provider account or credentials are required for the browsing demo.

## 0:00–0:30 — Establish the problem

Open **How it works**. Explain the three pieces: one provider registration, the integration's OAuth handler, and each user's separate connection. Point to the managed OAuth directory as an earlier option to check; do not claim managed support for a provider without checking its exact scheme.

## 0:30–1:20 — Compare real launch paths

Select **GitHub**. Show hands-on effort separately from the customer organization's approval gate. Note the private-code scope tradeoff.

Select **Slack**. Show the pilot/commercial distinction, ten active workspace installations, and the provider's review estimates. Open the Evidence tab and the dated policy source. The older five-workspace assumption was corrected during research.

Select **Google Drive**. Explain why selected-file access and broad read-only access are different features with different review obligations. Show the restricted-scope source and the untested setup limits.

## 1:20–2:20 — Investigate an app outside the library

Choose **Investigate a new app**. Let the evaluator supply a provider. `Calendly` is a name-based example that has completed production generation; Figma has also completed a website-based run. They are outside the three-guide library. Unfamiliar names use public metadata or a model-generated lead; use an official website or OAuth documentation URL if identity remains ambiguous.

For Calendly, use: “External customers connect their own accounts so my agent can read scheduled events. Explain public production setup.” Submit and inspect the research receipt. Allow time for document retrieval, drafting, and the second model review pass; handle a provider or model failure openly.

- In **agent mode**, inspect the generated path and open a supporting source. Explain that a second model pass revises the draft against the retrieved documents. Human review is still needed even after that revision and structural/source-reference validation.
- In **source-scan mode**, show the live retrieved excerpts and the explicit unknowns. Explain that this proves live retrieval and shareable evidence, not a complete agent investigation. The intended use is not synthesized in this mode.
- If a site blocks retrieval, use its direct public documentation URL. Show the limitation rather than replacing it with invented requirements.

## 2:20–3:00 — Make it usable outside the demo

Mark a checklist item, then reload to demonstrate local progress. Copy the share link and open it in a new tab; a generated guide is carried in the URL fragment. Export Markdown and inspect its source links, ownership, estimates, and not-verified section.

Finish on the evidence limits: provider registration stopped at sign-in, provider authorization and approvals were not completed, and generated guidance still needs review against its sources. The next production work is reviewed guide revisions, durable sharing, source refreshes, and broader coverage. This slice contains three curated guides, not one hundred.
