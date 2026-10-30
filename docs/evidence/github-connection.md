# GitHub connection check

Completed on 30 October 2026 (UTC), using a dedicated OAuth app and the account owner's explicit consent.

- The authenticated registration form allowed up to ten redirect URIs. One exact loopback callback was configured; wildcard matching and device flow were off.
- Expiring access tokens were enabled by default. The optional-features screen confirmed an eight-hour access-token lifetime and refresh support.
- The consent page displayed **Public data only**. The request and resulting token had no additional scopes; no repository access was requested.
- Authorization used a fresh state and S256 PKCE challenge. The code verifier was sent only to the token endpoint.
- Code exchange, the initial identity request, token refresh, and the refreshed identity request each returned HTTP 200. The consenting identity matched the expected account.
- Deleting the dedicated app's authorization returned HTTP 204. Its test grant and tokens were revoked. The local test server was stopped and the private credential configuration was removed.

The [machine-readable report](github-connection.json) contains timestamps, status codes and booleans. No access token, refresh token, authorization code, client ID, or client secret is included. The check can be reproduced with `scripts/github-connection-check.mjs`; use a separate test app and a private configuration file as described in the README.

This verifies one public-profile connection, not private repositories, email permissions, customer organizations, production readiness, or provider approval. The overall interaction interval includes human consent and is not a measured provider-review turnaround or an installation-effort benchmark.

Sources: [registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), [OAuth flow and token refresh](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [revoking the app authorization](https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-authorization).
