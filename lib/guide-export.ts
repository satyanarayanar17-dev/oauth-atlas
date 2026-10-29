import type { Guide } from "./types";
import { guideSchema } from "./guide-schema.ts";

export function guideMarkdown(guide: Guide): string {
  return [
    `# ${guide.name} OAuth field guide`,
    guide.summary,
    `Checked: ${guide.updatedAt} · ${guide.researchMode ?? "curated research"}`,
    `## The launch path\n- Hands-on work: ${guide.setupTime}\n- Provider wait: ${guide.waitTime}\n- ${guide.timeNote}\n- ${guide.review}`,
    `## Scope decisions\n${guide.scopeNote}\n${guide.recommendedScopes.map((s) => `- ${s}`).join("\n")}`,
    `## Before you start\n${guide.prerequisites.map((s) => `- ${s}`).join("\n")}`,
    `## Setup\n${guide.steps
      .map(
        (s, i) =>
          `${i + 1}. **${s.title}** (${s.owner}; ${s.evidence})\n   ${s.detail}${s.actionUrl ? `\n   ${s.actionUrl}` : ""}\n   Sources: ${
            s.sourceIds
              .map(
                (id) => guide.sources.find((source) => source.id === id)?.url,
              )
              .filter(Boolean)
              .join(", ") || "Not verified"
          }`,
      )
      .join("\n\n")}`,
    `## When you're blocked\n${guide.blockers
      .map(
        (b) =>
          `### ${b.title}\n${b.detail}\n\nNext: ${b.resolution}\nSources: ${
            b.sourceIds
              .map(
                (id) => guide.sources.find((source) => source.id === id)?.url,
              )
              .filter(Boolean)
              .join(", ") || "Not verified"
          }`,
      )
      .join("\n\n")}`,
    `## Agent can help\n${guide.agentCan.map((s) => `- ${s}`).join("\n")}`,
    `## You take over\n${guide.humanMust.map((s) => `- ${s}`).join("\n")}`,
    `## Evidence\n${guide.sources.map((s) => `- [${s.title}](${s.url}) — checked ${s.checkedAt}`).join("\n")}`,
    `## What we checked\n${guide.validation.checked.map((s) => `- ${s}`).join("\n")}`,
    `## Not verified\n${guide.validation.notChecked.map((s) => `- ${s}`).join("\n")}`,
    guide.validation.correction
      ? `## What changed after checking\n${guide.validation.correction}`
      : "",
    "\nPrepared with OAuth Atlas. Estimates are planning guidance, not provider guarantees. Never include client secrets in a shared guide.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Generated guides travel in the URL fragment, which is not sent to the server.
export async function shareUrl(guide: Guide): Promise<string> {
  const url = new URL(window.location.origin);
  if (!guide.generated) {
    url.searchParams.set("guide", guide.id);
    return url.toString();
  }
  const input = new Blob([JSON.stringify(guide)]).stream();
  const compressed = await new Response(
    input.pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  const encoded = btoa(String.fromCharCode(...new Uint8Array(compressed)));
  url.hash = `guide=${encodeURIComponent(encoded)}`;
  return url.toString();
}

export async function readSharedGuide(): Promise<Guide | null> {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("guide");
  if (!value) return null;
  if (value.length > 60000)
    throw new Error(
      "This guide link is too large. Ask the sender to export it as Markdown.",
    );
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let content = "";
  for (;;) {
    const { value: chunk, done } = await reader.read();
    if (done) break;
    content += decoder.decode(chunk, { stream: true });
    if (content.length > 150000) {
      await reader.cancel();
      throw new Error("This shared guide exceeds the size limit.");
    }
  }
  const guide = JSON.parse(content);
  if (!isGuide(guide)) throw new Error("This shared guide could not be read.");
  return { ...guide, generated: true };
}

export function isGuide(value: unknown): value is Guide {
  return guideSchema.safeParse(value).success;
}

export function safeLink(value?: string): string | undefined {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
