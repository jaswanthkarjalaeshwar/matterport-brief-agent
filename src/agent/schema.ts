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

export const BriefInput = z.object({
  company: z.string().trim().min(2).max(80),
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
 */
export const Brief = z.object({
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
    .min(2)
    .max(3),
  discoveryQuestions: z.array(z.string()).min(3).max(5),
  likelyObjections: z
    .array(z.object({ objection: z.string(), response: z.string() }))
    .min(1)
    .max(3),
  openingLine: z.string().describe("A first sentence for the call, specific to this account, no flattery"),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).max(8),
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
