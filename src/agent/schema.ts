import { z } from "zod";
import type { UIMessage } from "ai";

/** Matterport's go-to-market verticals. The agent must place every account in exactly one. */
export const VERTICALS = [
  "residential-real-estate",
  "commercial-real-estate",
  "hospitality",
  "construction-aec",
  "facilities-multisite",
  "insurance-restoration",
  "retail",
  "other",
] as const;
export type Vertical = (typeof VERTICALS)[number];

/** Rejects things that are clearly not a company name: markup, URLs with paths, instructions. */
const NOT_A_COMPANY = /[<>{}\[\]`]|https?:\/\/\S+\/\S|\b(ignore|disregard|system prompt|you are|instructions)\b/i;

export const BriefInput = z.object({
  company: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .refine((v) => !NOT_A_COMPANY.test(v), "That doesn't look like a company name."),
  domain: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Use a bare domain like acme.com")
    .optional(),
  /** Sales rep identity, used only to scope memory. */
  rep: z.string().trim().max(60).default("demo-ae"),
});
export type BriefInput = z.infer<typeof BriefInput>;

/**
 * The brief the model writes. Note what is NOT here: metrics.
 * Hypotheses point at a proof point by id; the UI renders the real, sourced
 * numbers from our knowledge base, so the model cannot invent a statistic.
 *
 * Counts are guidance in .describe(), not hard .max(): one extra question must
 * not throw away a whole brief. guardrails.ts trims to LIMITS instead.
 */
export const LIMITS = { painHypotheses: 3, discoveryQuestions: 5, likelyObjections: 3, sources: 8 } as const;

export const FIT_LEVELS = ["strong", "possible", "poor"] as const;

export const Brief = z.object({
  fit: z.object({
    level: z.enum(FIT_LEVELS).describe("strong: owns, sells, builds or insures physical space. possible: some physical footprint. poor: no meaningful physical-space use case"),
    reason: z.string().describe("One sentence, citing research"),
  }),
  snapshot: z.object({
    oneLiner: z.string().describe("What the company does, one sentence, plain words"),
    footprint: z.string().describe("Locations, portfolio size or scale signals found in research; say 'unknown' if not found"),
    vertical: z.enum(VERTICALS),
    verticalReason: z.string().describe("Why this vertical, citing a research fact"),
  }),
  painHypotheses: z
    .array(
      z.object({
        title: z.string().describe("The pain, in the buyer's words, max 8 words"),
        why: z.string().describe("Evidence from research that suggests this pain"),
        proofPointId: z.string().describe("Id of the Matterport proof point that addresses it; must come from lookup_proof_points"),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("2-3 when fit is strong or possible; empty when fit is poor"),
  discoveryQuestions: z.array(z.string()).describe("3-5 questions"),
  likelyObjections: z
    .array(z.object({ objection: z.string(), response: z.string() }))
    .describe("1-3 objections"),
  openingLine: z.string().describe("A first sentence for the call, specific to this account, no flattery"),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).describe("Up to 8"),
});
export type Brief = z.infer<typeof Brief>;

export type StageId = "intake" | "memory" | "research" | "match" | "draft" | "guardrails";
export type StageStatus = "pending" | "running" | "done" | "flagged" | "skipped";

export type StagePart = {
  id: StageId;
  status: StageStatus;
  detail?: string;
  ms?: number;
  startedAt?: number;
};

export type ToolCallPart = {
  id: string;
  tool: string;
  summary: string;
  status: "running" | "done" | "error" | "blocked";
  ms?: number;
  startedAt?: number;
};

export type GuardrailCheck = {
  id: string;
  label: string;
  status: "pass" | "flag" | "fixed";
  note?: string;
};

export type TracePart = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
  ms: number;
  steps: number;
  traceUrl?: string;
};

export type BriefUIMessage = UIMessage<
  never,
  {
    stage: StagePart;
    tool: ToolCallPart;
    brief: Partial<Brief>;
    guardrail: GuardrailCheck;
    trace: TracePart;
    memory: { recalled: string[] };
  }
>;
