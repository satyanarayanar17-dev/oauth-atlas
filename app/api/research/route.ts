import { env } from "cloudflare:workers";
import { scanSources } from "@/lib/research/scan";
import { investigateWithWorker } from "@/lib/research/worker-agent";
import type { WorkersModel } from "@/lib/research/inference";
import { publicUrl, ResearchError } from "@/lib/research/sources";

export const dynamic = "force-dynamic";

const headers = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
};
const recentRequests = new Map<string, number[]>();

function config() {
  const vars = env as unknown as Record<string, unknown>;
  return vars.AI && typeof (vars.AI as WorkersModel).run === "function"
    ? (vars.AI as WorkersModel)
    : undefined;
}

export async function GET() {
  return Response.json(
    { mode: config() ? "agent" : "source-scan" },
    { headers },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Research must be started from this website." },
      { status: 403, headers },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json(
      { error: "Send a JSON research request." },
      { status: 415, headers },
    );
  if (Number(request.headers.get("content-length")) > 4096)
    return Response.json(
      { error: "The request is too long." },
      { status: 413, headers },
    );

  // A small per-isolate guard is enough for the take-home. Use a durable limiter before public launch.
  const client = request.headers.get("cf-connecting-ip") || "local";
  const now = Date.now();
  if (recentRequests.size > 500) recentRequests.clear();
  const attempts = (recentRequests.get(client) || []).filter(
    (time) => now - time < 60_000,
  );
  if (attempts.length >= 5)
    return Response.json(
      { error: "Please wait a minute before starting another investigation." },
      { status: 429, headers: { ...headers, "retry-after": "60" } },
    );

  try {
    const text = await request.text();
    if (text.length > 4096)
      throw new ResearchError("The request is too long.", 413);
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new ResearchError("The research request was not valid JSON.", 400);
    }
    if (
      !input ||
      typeof input !== "object" ||
      !("query" in input) ||
      typeof input.query !== "string"
    )
      throw new ResearchError("Enter an app name or official website.", 400);
    const query = input.query.trim();
    if (!query || query.length > 240)
      throw new ResearchError(
        "Use an app name or website of 240 characters or fewer.",
        400,
      );
    const intent =
      "intent" in input && typeof input.intent === "string"
        ? input.intent.trim().slice(0, 1000)
        : "";
    if (/^[a-z]+:\/\//i.test(query)) publicUrl(query);
    recentRequests.set(client, [...attempts, now]);
    const runtime = config();
    const result = runtime
      ? await investigateWithWorker(query, intent, runtime)
      : await scanSources(query);
    return Response.json(
      { guide: result.guide, trace: result.trace },
      { headers },
    );
  } catch (error) {
    if (error instanceof ResearchError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    return Response.json(
      {
        error:
          "The investigation could not finish. Try a direct public OAuth documentation URL.",
      },
      { status: 502, headers },
    );
  }
}
