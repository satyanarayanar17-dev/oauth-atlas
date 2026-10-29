import type { Guide, ResearchTrace, GuideStep } from "../types";
import { matchProvider } from "./providers";
import {
  documentationLinks,
  fetchPage,
  publicUrl,
  ResearchError,
  type ResearchPage,
} from "./sources";

export interface ScanResult {
  guide: Guide;
  trace: ResearchTrace[];
  pages: ResearchPage[];
}

function excerpt(page: ResearchPage): string {
  const lines = page.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 65);
  const relevant =
    lines.find((line) =>
      /(?:create|register|review|approval|scope|redirect|authorize|oauth)/i.test(
        line,
      ),
    ) ||
    lines[0] ||
    page.text;
  return (
    relevant.split(/\s+/).slice(0, 24).join(" ") +
    (relevant.split(/\s+/).length > 24 ? "…" : "")
  );
}

export function scanGuide(
  name: string,
  domain: string,
  pages: ResearchPage[],
  date: string,
): Guide {
  const oauthPages = pages.filter((page) =>
    /\boauth\b|oauth2|oauth 2|authorization code/i.test(page.text),
  );
  const steps: GuideStep[] = pages.slice(0, 3).map((page, index) => ({
    id: `read-${index + 1}`,
    title:
      index === 0
        ? "Start with the provider’s documentation"
        : `Read: ${page.title}`,
    detail: `Retrieved excerpt: “${excerpt(page)}” Open the source for the full requirements; this extract has not been interpreted by a model.`,
    owner: "agent",
    evidence: "documented",
    sourceIds: [`s${index + 1}`],
    actionUrl: page.url,
  }));
  steps.push({
    id: "confirm-scope",
    title: "Confirm the OAuth app type and minimum scopes",
    detail:
      "For your intended agent action, find the required scopes and check whether your app is internal, unlisted, or publicly distributed. This source scan cannot determine which review applies to your use case.",
    owner: "developer",
    evidence: "unverified",
    sourceIds: [],
  });
  steps.push({
    id: "test-connection",
    title: "Register and test one connection",
    detail:
      "After confirming the provider supports your use case, register your app in its developer portal, configure the exact callback URL from your integration platform, and test a connection with your own account. Follow the linked provider instructions for secrets, PKCE, and token exchange.",
    owner: "developer",
    evidence: "unverified",
    sourceIds: [],
  });
  steps.push({
    id: "confirm-launch",
    title: "Resolve approval requirements before promising a launch date",
    detail:
      "Check scope review, marketplace rules, account eligibility, and customer administrator approval. Ask provider support about anything undocumented. Do not treat a working test connection as production approval.",
    owner: "developer",
    evidence: "unverified",
    sourceIds: [],
  });
  return {
    id: `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45)}-${crypto.randomUUID().slice(0, 8)}`,
    name,
    domain,
    category: "Live investigation",
    difficulty: "Needs investigation",
    summary: oauthPages.length
      ? `Found OAuth-related text in ${oauthPages.length} live documentation page${oauthPages.length === 1 ? "" : "s"}. This is an initial source scan with next steps; provider-specific approval and timing still need investigation.`
      : "The fetched pages did not establish an OAuth setup path. This brief records what was accessible and what to investigate next.",
    setupTime: "Not yet established",
    waitTime: "Not yet established",
    timeNote:
      "No provider setup, authorization flow, or approval was attempted. Missing evidence is shown as unknown.",
    review: "Unverified — confirm with the provider",
    scopeNote:
      "Scope names and the approval implications have not been established for your use case.",
    recommendedScopes: [],
    prerequisites: [
      "Define the action your agent needs to perform.",
      "Have a provider account and permission to register an app.",
      "Get the exact callback URL from your integration platform.",
    ],
    steps,
    blockers: [
      {
        title: "Approval path is still unknown",
        detail:
          "A page fetch cannot establish whether external distribution or your intended scopes require approval.",
        resolution:
          "Open the linked documentation and confirm the app type, production permissions, and review requirements. Enable model research to synthesize these sources, then verify the result.",
        sourceIds: pages.map((_, i) => `s${i + 1}`),
      },
    ],
    agentCan: [
      "Fetch public documentation and discover related OAuth pages.",
      "Collect source links and a dated research brief.",
      "With a model connection, investigate and synthesize provider-specific setup steps.",
    ],
    humanMust: [
      "Verify the brief against the full provider documentation.",
      "Sign in, accept terms, register the app, and store any credentials securely.",
      "Test real connections and submit any required provider review.",
    ],
    sources: pages.map((page, index) => ({
      id: `s${index + 1}`,
      title: page.title,
      url: page.url,
      checkedAt: date,
    })),
    validation: {
      checked: pages.map((page) => `Fetched public source: ${page.title}`),
      notChecked: [
        "OAuth registration and client creation",
        "Live authorization and token exchange",
        "Production review eligibility and approval timelines",
        "Scope selection and data policy requirements",
      ],
    },
    updatedAt: date,
    generated: true,
    researchMode: "source-scan",
  };
}

export async function scanSources(query: string): Promise<ScanResult> {
  const trace: ResearchTrace[] = [];
  const provider = matchProvider(query);
  let startingUrls: string[];
  let name: string;
  let domain: string;
  if (provider) {
    startingUrls = provider.docs;
    name = provider.name;
    domain = provider.domain;
    trace.push({
      label: "Provider identified",
      detail: `Using known official documentation starting points for ${name}; all pages are fetched again for this run.`,
      status: "done",
    });
  } else {
    const looksLikeUrl =
      /^https?:\/\//i.test(query) ||
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#].*)?$/i.test(query);
    if (!looksLikeUrl)
      throw new ResearchError(
        "This app name is unfamiliar. Submit its official website or public OAuth documentation URL so the investigator can identify the right provider.",
      );
    const url = publicUrl(
      /^https?:\/\//i.test(query) ? query : `https://${query}`,
    );
    startingUrls = [url.href];
    domain = url.hostname.replace(/^www\./, "");
    name = domain;
    trace.push({
      label: "Website received",
      detail: `Investigating ${domain}. The submitted domain is a research lead, not a verified provider identity.`,
      status: "done",
    });
  }
  const pages: ResearchPage[] = [];
  const seen = new Set<string>();
  async function read(url: string) {
    if (seen.has(url)) return;
    seen.add(url);
    try {
      const page = await fetchPage(url);
      seen.add(page.url);
      if (!pages.some((previous) => previous.url === page.url))
        pages.push(page);
      trace.push({
        label: "Source retrieved",
        detail: page.url,
        status: "done",
      });
    } catch (error) {
      trace.push({
        label: "Source unavailable",
        detail: `${url} — ${error instanceof Error && error.name === "ResearchError" ? error.message : `The provider could not be reached (${error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 220) : "network error"}).`}`,
        status: "warning",
      });
    }
  }
  await Promise.all(startingUrls.slice(0, 2).map(read));
  // Two small crawl rounds reach linked developer docs without exploring an entire site.
  for (let round = 0; round < 2 && pages.length < 4; round++) {
    const candidates = pages
      .flatMap(documentationLinks)
      .filter((url) => !seen.has(url));
    const next = [...new Set(candidates)].slice(
      0,
      Math.min(2, 4 - pages.length),
    );
    if (!next.length) break;
    await Promise.all(next.map(read));
  }
  if (!pages.length)
    throw new ResearchError(
      `No readable public documentation was retrieved. ${trace
        .filter((item) => item.label === "Source unavailable")
        .map((item) => item.detail)
        .slice(0, 2)
        .join(" ")} Try a direct OAuth documentation URL.`,
    );
  trace.push({
    label: "Evidence boundary",
    detail:
      "Source scan completed. No model synthesis, provider registration, or approval test was performed.",
    status: "warning",
  });
  return {
    guide: scanGuide(
      name,
      domain,
      pages,
      new Date().toISOString().slice(0, 10),
    ),
    trace,
    pages,
  };
}
