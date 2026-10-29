export interface ProviderEntry {
  name: string;
  domain: string;
  aliases: string[];
  docs: string[];
  searchDomains?: string[];
}

// These are discovery starting points, not cached answers. Every run fetches them.
export const providers: ProviderEntry[] = [
  {
    name: "Notion",
    domain: "notion.so",
    searchDomains: ["notion.com", "notion.so"],
    aliases: ["notion"],
    docs: [
      "https://developers.notion.com/docs/authorization",
      "https://developers.notion.com/docs/create-a-notion-integration",
    ],
  },
  {
    name: "Linear",
    domain: "linear.app",
    aliases: ["linear"],
    docs: ["https://linear.app/developers/oauth-2-0-authentication"],
  },
  {
    name: "HubSpot",
    domain: "hubspot.com",
    aliases: ["hubspot", "hub spot"],
    docs: [
      "https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth.md",
    ],
  },
  {
    name: "Discord",
    domain: "discord.com",
    aliases: ["discord"],
    docs: ["https://docs.discord.com/developers/topics/oauth2"],
  },
  {
    name: "Spotify",
    domain: "spotify.com",
    aliases: ["spotify"],
    docs: [
      "https://developer.spotify.com/documentation/web-api/concepts/authorization",
      "https://developer.spotify.com/documentation/web-api/concepts/quota-modes",
    ],
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    aliases: ["dropbox"],
    docs: ["https://developers.dropbox.com/oauth-guide"],
  },
  {
    name: "Airtable",
    domain: "airtable.com",
    aliases: ["airtable"],
    docs: ["https://airtable.com/developers/web/guides/oauth-integrations"],
  },
  {
    name: "GitHub",
    domain: "github.com",
    aliases: ["github"],
    docs: [
      "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
      "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
    ],
  },
  {
    name: "Slack",
    domain: "slack.com",
    searchDomains: ["slack.com", "slack.dev"],
    aliases: ["slack"],
    docs: [
      "https://docs.slack.dev/authentication/installing-with-oauth/",
      "https://docs.slack.dev/slack-marketplace/",
    ],
  },
  {
    name: "Google Drive",
    domain: "google.com",
    aliases: ["google drive", "drive"],
    docs: [
      "https://developers.google.com/workspace/drive/api/guides/api-specific-auth",
      "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
    ],
  },
  {
    name: "Gmail",
    domain: "google.com",
    aliases: ["gmail"],
    docs: [
      "https://developers.google.com/workspace/gmail/api/auth/scopes",
      "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
    ],
  },
  {
    name: "Google OAuth",
    domain: "google.com",
    aliases: ["google"],
    docs: [
      "https://developers.google.com/identity/protocols/oauth2/web-server",
    ],
  },
  {
    name: "Asana",
    domain: "asana.com",
    aliases: ["asana"],
    docs: ["https://developers.asana.com/docs/oauth"],
  },
  {
    name: "Atlassian Jira",
    domain: "atlassian.com",
    aliases: ["jira", "atlassian", "atlassian jira"],
    docs: [
      "https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/",
    ],
  },
  {
    name: "Twitch",
    domain: "twitch.tv",
    aliases: ["twitch"],
    docs: [
      "https://dev.twitch.tv/docs/authentication/register-app/",
      "https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/",
    ],
  },
];

export function matchProvider(query: string): ProviderEntry | undefined {
  const term = query.toLowerCase().trim();
  const named = providers.find((provider) => provider.aliases.includes(term));
  if (named) return named;
  const domains = providers.filter(
    (provider) => term === provider.domain || term === `www.${provider.domain}`,
  );
  return domains.length === 1 ? domains[0] : undefined;
}
