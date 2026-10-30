import { ResearchError } from "./sources.ts";

export interface WorkersModel {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

interface InferenceOptions {
  model?: string;
  maxTokens?: number;
}

const defaultModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const timeoutMs = 60_000;

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function modelError(error: unknown): ResearchError {
  const details = record(error);
  const nested = Array.isArray(details?.errors) ? details.errors : [];
  const codes = [
    details?.code,
    details?.status,
    details?.statusCode,
    ...nested.map((item) => record(item)?.code),
  ].map(String);
  const message = [
    error instanceof Error ? error.message : "",
    details?.message,
    typeof details?.error === "string" ? details.error : "",
    ...nested.map((item) => record(item)?.message),
  ]
    .join(" ")
    .toLowerCase();

  if (
    codes.includes("3036") ||
    /3036|daily.*(?:allocation|allowance|quota)|quota.*exceed/.test(message)
  ) {
    return new ResearchError(
      "Live generation has reached its daily model allowance. Try again after the allowance resets.",
      429,
    );
  }
  if (
    codes.some((code) => ["3040", "429"].includes(code)) ||
    /3040|out of capacity|rate.?limit/.test(message)
  ) {
    return new ResearchError(
      "The model is busy. Please try again shortly.",
      503,
    );
  }
  if (
    codes.some((code) => ["3007", "3008", "408"].includes(code)) ||
    /3007|3008|timed? ?out|timeout|aborted/.test(message)
  ) {
    return new ResearchError(
      "Live generation timed out. Try a narrower request or try again shortly.",
      504,
    );
  }
  if (
    codes.some((code) =>
      ["5035", "5018", "3041", "3042", "5007", "403", "404"].includes(code),
    ) ||
    /5035|5018|3041|3042|5007|no such model|model.*not (?:found|allowed)|paid plan/.test(
      message,
    )
  ) {
    return new ResearchError(
      "The configured model is unavailable for this account. Please contact the app owner.",
      503,
    );
  }
  if (/json mode|json schema|structured output/.test(message)) {
    return new ResearchError(
      "The model could not produce valid guide JSON. Try a narrower request.",
      502,
    );
  }
  return new ResearchError(
    "The model could not complete the guide. Please try again shortly.",
    503,
  );
}

function parseResponse(result: unknown): unknown {
  const body = record(result);
  if (!body)
    throw new ResearchError(
      "The model returned an invalid response. Please try again.",
      502,
    );
  if (
    body.success === false ||
    body.error ||
    (Array.isArray(body.errors) && body.errors.length)
  ) {
    throw modelError(body);
  }
  if (body.finish_reason === "length" || body.finish_reason === "max_tokens") {
    throw new ResearchError(
      "The model response was cut short. Try a narrower request.",
      502,
    );
  }
  const response = body.response;
  if (response !== null && typeof response === "object") return response;
  if (typeof response !== "string" || !response.trim()) {
    throw new ResearchError(
      "The model returned no guide JSON. Please try again.",
      502,
    );
  }
  try {
    return JSON.parse(response);
  } catch {
    throw new ResearchError(
      "The model returned malformed or incomplete guide JSON. Please try again.",
      502,
    );
  }
}

export async function runJson(
  ai: WorkersModel,
  system: string,
  input: unknown,
  schema: Record<string, unknown>,
  options: InferenceOptions = {},
): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const request = {
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: typeof input === "string" ? input : JSON.stringify(input),
        },
      ],
      max_tokens: options.maxTokens ?? 4200,
      temperature: 0.1,
      response_format: { type: "json_schema", json_schema: schema },
    };
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new ResearchError(
              "Live generation timed out. Try a narrower request or try again shortly.",
              504,
            ),
          ),
        timeoutMs,
      );
    });
    const result = await Promise.race([
      Promise.resolve().then(() =>
        ai.run(options.model || defaultModel, request),
      ),
      timeout,
    ]);
    return parseResponse(result);
  } catch (error) {
    if (error instanceof ResearchError) throw error;
    throw modelError(error);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
