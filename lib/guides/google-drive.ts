import type { Guide } from "../types";

export const googleDriveGuide: Guide = {
  id: "google-drive",
  name: "Google Drive",
  domain: "drive.google.com",
  category: "Files & documents",
  difficulty: "Conditional review",
  summary:
    "The scope is the launch decision: user-selected files have a lighter path; broad Drive access can require weeks of review and a security assessment.",
  setupTime: "45–90 min",
  waitTime: "Minutes to several weeks",
  timeNote:
    "Registration effort is our estimate with a ready website and callback. Brand checks are usually automated in minutes; manual review usually takes 2–3 business days. Restricted-scope verification can take several weeks; assessment timing varies.",
  review:
    "This guide assumes external users. Branding review and data-access review are separate. A narrow scope avoids restricted-scope review, but still requires correct app configuration and applicable branding checks.",
  scopeNote:
    "drive.file is non-sensitive and covers files opened, created, or explicitly shared with the app. It does not provide whole-Drive access. drive.readonly, drive, and drive.metadata.readonly are restricted.",
  recommendedScopes: ["https://www.googleapis.com/auth/drive.file"],
  prerequisites: [
    "A Google Cloud project with Drive API enabled",
    "A production website, support contact, and privacy policy",
    "A callback URL and a decision on selected-file versus broad access",
  ],
  steps: [
    {
      id: "scope",
      title: "Choose the access your feature really needs",
      detail:
        "For user-selected files, evaluate drive.file with Google Picker. If the agent needs to discover arbitrary Drive files, document why broader restricted access is necessary; the narrow scope is not a substitute for that feature.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["scopes"],
      actionUrl:
        "https://developers.google.com/workspace/drive/api/guides/api-specific-auth",
    },
    {
      id: "consent",
      title: "Configure the Google Auth platform",
      detail:
        "Set Branding, Audience, and Data Access in your Cloud project. Use External for users outside your organization. Add named test users while the app is in Testing.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["consent"],
      actionUrl: "https://console.cloud.google.com/auth/overview",
    },
    {
      id: "client",
      title: "Create a web client and callback",
      detail:
        "Create a Web application client in Clients and register the server callback. Follow the specific web-server flow for credentials and token handling; protect any client secret outside the source tree.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["web"],
      actionUrl: "https://console.cloud.google.com/auth/clients",
    },
    {
      id: "test",
      title: "Test consent, refresh, and reconnect",
      detail:
        "Check the callback, granted scopes, and server-side token exchange. External Testing refresh tokens expire after seven days for Drive scopes, so a successful short test does not establish production readiness.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["web", "tokens"],
    },
    {
      id: "brand",
      title: "Verify and publish production branding",
      detail:
        "Prepare public app and privacy pages and verify authorized domain ownership. Automated branding checks usually take minutes; manual review usually takes 2–3 business days. Publish verified branding before requesting data-access verification.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["brand"],
      actionUrl: "https://console.cloud.google.com/auth/branding",
    },
    {
      id: "restricted",
      title: "If needed, complete restricted-scope review",
      detail:
        "An agent can draft scope justifications and a data-flow inventory. You confirm the claims and submit demonstrations. Restricted data accessed through servers generally needs an annual independent security assessment, unless an exception applies.",
      owner: "provider",
      evidence: "documented",
      sourceIds: ["restricted"],
      actionUrl:
        "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
    },
  ],
  blockers: [
    {
      title: "Read-only access still triggers restricted review",
      detail:
        "drive.readonly is restricted. Reading data can carry substantial review obligations.",
      resolution:
        "Use drive.file only if user-selected files satisfy the actual feature; otherwise budget for restricted verification and assessment.",
      sourceIds: ["scopes", "restricted"],
    },
    {
      title: "Connections stop working after a week",
      detail:
        "Drive refresh tokens from an External app in Testing normally expire after seven days.",
      resolution:
        "Reconnect during testing. Complete the appropriate production configuration before relying on long-running connections.",
      sourceIds: ["tokens"],
    },
    {
      title: "redirect_uri_mismatch",
      detail:
        "The callback must exactly match the registered redirect, including scheme, case, and trailing slash.",
      resolution:
        "Compare the entire requested URI with the client configuration; register development and production callbacks separately.",
      sourceIds: ["web"],
    },
    {
      title: "Review is waiting on your evidence",
      detail:
        "Missing public pages, domain ownership, scope justification, or demonstration material can hold up review.",
      resolution:
        "Check Branding and Verification Center and respond through the project’s developer contact email. Keep the requested permissions aligned with working features.",
      sourceIds: ["brand", "restricted"],
    },
  ],
  agentCan: [
    "Map features to narrow scopes and flag restricted access",
    "Draft consent text, scope justifications, and a data-flow inventory",
    "Check public links and prepare callback and refresh tests",
  ],
  humanMust: [
    "Own the Cloud project and authorized domains",
    "Authenticate, choose client settings, and safeguard credentials",
    "Confirm privacy representations and handle reviews or assessment agreements",
  ],
  sources: [
    {
      id: "scopes",
      title: "Google · Drive API scopes",
      url: "https://developers.google.com/workspace/drive/api/guides/api-specific-auth",
      checkedAt: "2026-10-29",
    },
    {
      id: "consent",
      title: "Google · Configure OAuth consent",
      url: "https://developers.google.com/workspace/guides/configure-oauth-consent",
      checkedAt: "2026-10-29",
    },
    {
      id: "web",
      title: "Google · OAuth for web-server applications",
      url: "https://developers.google.com/identity/protocols/oauth2/web-server",
      checkedAt: "2026-10-29",
    },
    {
      id: "brand",
      title: "Google · Brand verification",
      url: "https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification",
      checkedAt: "2026-10-29",
    },
    {
      id: "restricted",
      title: "Google · Restricted-scope verification",
      url: "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
      checkedAt: "2026-10-29",
    },
    {
      id: "tokens",
      title: "Google · OAuth token behavior",
      url: "https://developers.google.com/identity/protocols/oauth2",
      checkedAt: "2026-10-29",
    },
  ],
  validation: {
    checked: [
      "Checked the six linked official sources and compared narrow versus restricted access.",
      "Opened the Cloud Clients entry point; it redirected to Google sign-in.",
    ],
    notChecked: [
      "No Cloud project/client created, consent completed, token exchange tested, or review submitted.",
      "Authenticated console details, customer admin policies, and managed OAuth availability remain unverified.",
    ],
    correction:
      "Read-only is not synonymous with low review burden: drive.readonly is restricted. We keep the selected-file and broad-access paths separate.",
  },
  updatedAt: "2026-10-29",
};
