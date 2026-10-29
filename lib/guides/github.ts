import type { Guide } from "../types";

export const githubGuide: Guide = {
  id: "github",
  name: "GitHub",
  domain: "github.com",
  category: "Developer tools",
  difficulty: "Straightforward",
  summary:
    "Register an app and test with your account. Organization access can need a separate owner approval; private repository access deserves a GitHub App decision first.",
  setupTime: "30–60 min",
  waitTime: "No global review listed",
  timeNote:
    "Setup is our estimate for registration and an initial connection, assuming an existing callback handler. Organization approval has no verified turnaround.",
  review:
    "The documented registration flow has no provider-wide approval stage. Customer organizations can independently restrict OAuth apps and require an owner to approve access.",
  scopeNote:
    "Start with public information or read:user for profile access. The repo scope includes private repository writes; OAuth apps cannot request read-only source-code access. Prefer a GitHub App for selected repositories and finer permissions.",
  recommendedScopes: ["read:user", "user:email (only if needed)"],
  prerequisites: [
    "A GitHub account; organization-owned registration requires administrative access.",
    "An app name, public homepage, and working authorization callback URL.",
    "A server-side OAuth handler or integration platform that supplies the callback.",
    "A specific list of agent actions so you can justify every requested scope.",
  ],
  steps: [
    {
      id: "choose-app-type",
      title: "Choose OAuth App or GitHub App",
      detail:
        "For user identity, an OAuth app may fit. For repository automation, assess a GitHub App first: it offers finer permissions, repository selection, and app identity. This guide follows the OAuth App route.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["registration", "scopes"],
    },
    {
      id: "register",
      title: "Register your provider app",
      detail:
        "Open Settings → Developer settings → OAuth apps → New OAuth App. Enter the public name, homepage, and callback supplied by your OAuth handler; then register. Keep the callback exact with wildcard matching disabled unless required.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["registration", "flow"],
      actionUrl: "https://github.com/settings/applications/new",
    },
    {
      id: "wire-credentials",
      title: "Connect the OAuth handler",
      detail:
        "Put the client ID and generated client secret in your server or integration platform. Use state and S256 PKCE. Current app registration enables expiring tokens by default, so confirm refresh support before the first test.",
      owner: "agent",
      evidence: "documented",
      sourceIds: ["flow", "registration"],
    },
    {
      id: "test-connection",
      title: "Authorize a test user and check access",
      detail:
        "Sign in with a verified-email account, approve only required permissions, and call a harmless endpoint such as GET /user. Confirm the granted scopes and test your intended resource; a successful login does not establish organization access.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["user-access", "flow", "scopes"],
    },
    {
      id: "org-approval",
      title: "Resolve customer organization restrictions",
      detail:
        "If organization data is unavailable, ask its owner to review the request in organization Settings → Third-party Access → OAuth app policy. Users with SAML organizations may need an active SAML session before authorizing.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["organization", "user-access"],
      actionUrl:
        "https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization",
    },
  ],
  blockers: [
    {
      title: "Login works, organization data is missing",
      detail:
        "A user grant can still be restricted by the customer organization.",
      resolution:
        "Request owner approval. For SAML, establish an active organization SSO session and authorize again when necessary.",
      sourceIds: ["organization", "user-access"],
    },
    {
      title: "The agent only needs to read private code",
      detail: "OAuth repository scopes do not provide read-only source access.",
      resolution:
        "Use a GitHub App with repository selection and read permissions instead of accepting the broad repo scope by default.",
      sourceIds: ["scopes", "user-access"],
    },
    {
      title: "Authorization returns to the wrong address",
      detail: "A callback mismatch can prevent the connection from completing.",
      resolution:
        "Compare the configured callback and redirect_uri, including scheme, host, port, and path. Review wildcard settings explicitly.",
      sourceIds: ["flow"],
    },
  ],
  agentCan: [
    "Map planned actions to scopes and flag permissions broader than the task.",
    "Draft configuration and callback handling; validate redirects and refresh logic.",
    "With authorized test credentials, inspect granted scopes and run harmless API checks.",
  ],
  humanMust: [
    "Sign in, select the app owner, and register the provider app.",
    "Generate and store secrets securely, and consent as the test user.",
    "Coordinate organization approval with the customer’s administrator.",
  ],
  sources: [
    {
      id: "registration",
      title: "GitHub · Creating an OAuth app",
      url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
      checkedAt: "2026-10-29",
    },
    {
      id: "scopes",
      title: "GitHub · OAuth scopes",
      url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps",
      checkedAt: "2026-10-29",
    },
    {
      id: "flow",
      title: "GitHub · OAuth authorization and callbacks",
      url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
      checkedAt: "2026-10-29",
    },
    {
      id: "user-access",
      title: "GitHub · User and organization authorization",
      url: "https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps",
      checkedAt: "2026-10-29",
    },
    {
      id: "organization",
      title: "GitHub · Approving OAuth apps for an organization",
      url: "https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization",
      checkedAt: "2026-10-29",
    },
  ],
  validation: {
    checked: [
      "Read five current GitHub documentation pages covering registration, scopes, OAuth flow, and organization policy.",
      "Opened the registration URL without credentials: it redirected to GitHub sign-in with a return path to app registration.",
      "Confirmed current docs describe up to 10 callback URLs and expiring tokens enabled by default.",
    ],
    notChecked: [
      "Authenticated registration form, client-secret generation, user authorization, token exchange, and API access were not tested.",
      "No organization approval was requested and no turnaround was measured.",
    ],
    correction:
      "Older guides may assume one callback URL or non-expiring tokens. Current documentation describes multiple callbacks and an expiring-token default; the authenticated settings were not independently verified.",
  },
  updatedAt: "2026-10-29",
};
