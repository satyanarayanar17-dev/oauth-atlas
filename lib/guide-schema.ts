import { z } from "zod";

const sourceIds = z.array(z.string().max(100)).max(30);
const shortText = z.string().max(500);
const paragraphs = z.array(z.string().max(4000)).max(30);
const httpsUrl = z
  .string()
  .max(3000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Expected a public HTTPS link");

export const guideSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: shortText,
    domain: shortText,
    category: shortText,
    difficulty: z.enum([
      "Straightforward",
      "Conditional review",
      "Significant review",
      "Needs investigation",
    ]),
    summary: z.string().max(5000),
    setupTime: shortText,
    waitTime: shortText,
    timeNote: z.string().max(4000),
    review: z.string().max(4000),
    scopeNote: z.string().max(4000),
    recommendedScopes: paragraphs,
    prerequisites: paragraphs,
    steps: z
      .array(
        z.object({
          id: shortText,
          title: shortText,
          detail: z.string().max(6000),
          owner: z.enum(["developer", "agent", "provider"]),
          evidence: z.enum(["documented", "estimate", "unverified"]),
          sourceIds,
          actionUrl: httpsUrl.optional(),
        }),
      )
      .min(1)
      .max(20),
    blockers: z
      .array(
        z.object({
          title: shortText,
          detail: z.string().max(5000),
          resolution: z.string().max(5000),
          sourceIds,
        }),
      )
      .max(20),
    agentCan: paragraphs,
    humanMust: paragraphs,
    sources: z
      .array(
        z.object({
          id: shortText,
          title: shortText,
          url: httpsUrl,
          checkedAt: shortText,
        }),
      )
      .min(1)
      .max(30),
    validation: z.object({
      checked: paragraphs,
      notChecked: paragraphs,
      correction: z.string().max(6000).optional(),
    }),
    updatedAt: shortText,
    generated: z.boolean().optional(),
    researchMode: z.enum(["agent", "source-scan"]).optional(),
  })
  .superRefine((guide, context) => {
    const ids = new Set(guide.sources.map((source) => source.id));
    const steps = new Set(guide.steps.map((step) => step.id));
    if (
      ids.size !== guide.sources.length ||
      steps.size !== guide.steps.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source and step identifiers must be unique",
      });
    }
    for (const item of [...guide.steps, ...guide.blockers]) {
      if (item.sourceIds.some((id) => !ids.has(id)))
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A source reference could not be found",
        });
    }
  });
