import type { Guide } from "../types";

export const slackGuide: Guide = {
  id: "slack",
  name: "Slack",
  domain: "slack.com",
  category: "Communication",
  difficulty: "Significant review",
  summary:
    "A workspace pilot is approachable. A commercial launch needs a tested product, active installations, and Marketplace review.",
  setupTime: "30–60 min",
  waitTime: "Up to 10 weeks + preliminary review",
  timeNote:
    "Setup is our estimate for registration with a working callback. Slack states up to 10 business days for preliminary feedback, then up to 10 weeks for a new app’s functional review. Fixes and pilot recruitment add time.",
  review:
    "Unlisted distribution supports early-customer pilots. Plan for Marketplace approval before commercial distribution; workspace administrators may separately restrict installation.",
  scopeNote:
    "Start with the bot permissions your current features need. For a bot that posts messages, investigate chat:write. Reading history introduces broader access and distribution limits.",
  recommendedScopes: ["chat:write"],
  prerequisites: [
    "A Slack development workspace and permission to install apps",
    "An HTTPS callback and server-side token storage",
    "A working product and real pilot customers before Marketplace submission",
  ],
  steps: [
    {
      id: "register",
      title: "Create your development app",
      detail:
        "Sign in to the app dashboard and create an app associated with a development workspace. Open OAuth & Permissions to configure the installation.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["distribution"],
      actionUrl: "https://api.slack.com/apps",
    },
    {
      id: "permissions",
      title: "Choose scopes and a callback",
      detail:
        "Request only current functionality. Bot permissions use scope; user permissions use user_scope. Configure an HTTPS redirect and use the same redirect_uri when authorizing and exchanging the code.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["oauth"],
      actionUrl: "https://docs.slack.dev/authentication/installing-with-oauth/",
    },
    {
      id: "pilot",
      title: "Test installation, then enable a pilot",
      detail:
        "Test your authorization callback and token handling. For other workspaces, complete Manage Distribution → Share Your App with Other Workspaces, then Activate Public Distribution. Each workspace needs its own authorization.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["distribution"],
    },
    {
      id: "readiness",
      title: "Check commercial eligibility early",
      detail:
        "Maintain at least 10 installations on active workspaces throughout review. Check the full submission criteria: an MCP server alone, without meaningful in-Slack functionality, is unsuitable for Marketplace.",
      owner: "developer",
      evidence: "documented",
      sourceIds: ["installs", "guidelines"],
      actionUrl:
        "https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/",
    },
    {
      id: "prepare",
      title: "Prepare the review package",
      detail:
        "An agent can map each permission to a visible feature and draft a reviewer checklist. You must confirm the production product, public pages, privacy information, and test access are accurate.",
      owner: "agent",
      evidence: "estimate",
      sourceIds: ["guidelines"],
    },
    {
      id: "review",
      title: "Submit and respond to review",
      detail:
        "Use Submit to the Slack Marketplace in app settings. Preliminary feedback can take up to 10 business days; functional review up to 10 weeks for new apps. Address feedback before approval; resubmission can restart parts of the queue.",
      owner: "provider",
      evidence: "documented",
      sourceIds: ["review"],
      actionUrl: "https://api.slack.com/apps",
    },
  ],
  blockers: [
    {
      title: "Your agent only exposes an MCP server",
      detail:
        "Marketplace guidelines require meaningful in-Slack functionality; OAuth alone does not establish eligibility.",
      resolution:
        "Validate the product against current submission criteria before committing to commercial launch.",
      sourceIds: ["guidelines"],
    },
    {
      title: "Not enough active pilot workspaces",
      detail:
        "The current requirement is 10 active workspace installations maintained throughout review.",
      resolution:
        "Recruit and retain real pilot customers before submitting. Check the additional usage criteria in the guidelines.",
      sourceIds: ["installs", "guidelines"],
    },
    {
      title: "Message history is heavily rate limited",
      detail:
        "For affected commercial non-Marketplace apps and new installs, conversations.history and conversations.replies allow one request per minute with up to 15 objects.",
      resolution:
        "Plan your pilot around these limits, revisit the data-access design, and evaluate Marketplace readiness.",
      sourceIds: ["rates"],
    },
    {
      title: "Installation or callback fails",
      detail:
        "A workspace admin may need to approve installation, or authorization and code exchange may use different callback values.",
      resolution:
        "Ask the workspace admin to review permissions; compare the configured HTTPS callback with redirect_uri in both requests.",
      sourceIds: ["distribution", "oauth"],
    },
  ],
  agentCan: [
    "Draft a minimal app manifest and scope-to-feature checklist",
    "Compare callback configuration and prepare installation tests",
    "Prepare review materials for your inspection",
  ],
  humanMust: [
    "Sign in and choose the owning workspace",
    "Authorize installation and safeguard credentials",
    "Recruit pilots, confirm disclosures, and submit for review",
  ],
  sources: [
    {
      id: "distribution",
      title: "Slack · App lifecycle and distribution",
      url: "https://docs.slack.dev/app-management/distribution/",
      checkedAt: "2026-10-29",
    },
    {
      id: "oauth",
      title: "Slack · Installing via OAuth",
      url: "https://docs.slack.dev/authentication/installing-with-oauth/",
      checkedAt: "2026-10-29",
    },
    {
      id: "installs",
      title: "Slack · Updated installation requirement (September 2026)",
      url: "https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement/",
      checkedAt: "2026-10-29",
    },
    {
      id: "guidelines",
      title: "Slack · Marketplace submission guidelines",
      url: "https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/",
      checkedAt: "2026-10-29",
    },
    {
      id: "review",
      title: "Slack · Marketplace review process",
      url: "https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/",
      checkedAt: "2026-10-29",
    },
    {
      id: "rates",
      title: "Slack · Rate limits for non-Marketplace apps",
      url: "https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/",
      checkedAt: "2026-10-29",
    },
  ],
  validation: {
    checked: [
      "Read the six linked official sources and compared dated installation policies.",
      "Opened the public app-creation entry point; it required Slack sign-in.",
    ],
    notChecked: [
      "No app created, installation completed, token exchanged, or Marketplace submission made.",
      "Workspace admin policies and managed OAuth availability were not verified.",
    ],
    correction:
      "Older 2025 guidance temporarily allowed five active workspaces. The September 2026 update requires ten throughout review.",
  },
  updatedAt: "2026-10-29",
};
