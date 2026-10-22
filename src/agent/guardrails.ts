import { getProofPoint } from "./proof-points";
import type { Brief, GuardrailCheck } from "./schema";

/**
 * Three layers, cheapest first:
 *  1. Input: what reaches the agent (prompt injection in scraped pages, size caps).
 *  2. Tools: what the agent may do (allowlisted hosts, spend budget) — see tools.ts.
 *  3. Output: what reaches the rep (grounding, claims, tone). Deterministic, no extra LLM call.
 */

const INJECTION = [
  /ignore (all |any )?(previous|prior|above) (instructions|prompts)/i,
  /you are now/i,
  /system prompt/i,
  /disregard .{0,40}instructions/i,
  /<\/?(system|assistant|tool)>/i,
];

/** Web text is data, never instructions. Strip known injection phrasing and fence it. */
export function fenceUntrusted(text: string, source: string, maxChars = 6000) {
  let flagged = false;
  let clean = text.slice(0, maxChars);
  for (const re of INJECTION) {
    if (re.test(clean)) {
      flagged = true;
      clean = clean.replace(new RegExp(re.source, "gi"), "[removed]");
    }
  }
  return {
    flagged,
    text: `<untrusted source="${source}">\n${clean}\n</untrusted>`,
  };
}

const HYPE = /\b(revolutionar\w*|game[- ]?chang\w*|synerg\w*|cutting[- ]edge|best[- ]in[- ]class|world[- ]class|unlock\w*|supercharg\w*)\b/gi;
const NUMBER_CLAIM = /\b\d+(\.\d+)?\s?(%|x|percent|hours|days)\b/i;

export function checkBrief(brief: Brief, allowedProofIds: Set<string>): { brief: Brief; checks: GuardrailCheck[] } {
  const checks: GuardrailCheck[] = [];

  // Grounding: every hypothesis must cite a real proof point the agent actually retrieved.
  const grounded = brief.painHypotheses.filter((h) => allowedProofIds.has(h.proofPointId) && getProofPoint(h.proofPointId));
  const dropped = brief.painHypotheses.length - grounded.length;
  checks.push({
    id: "grounding",
    label: "Every pain hypothesis cites a real customer result",
    status: dropped ? "fixed" : "pass",
    note: dropped ? `Dropped ${dropped} hypothesis without a valid proof point` : undefined,
  });

  // Numbers: metrics come from the knowledge base only. The model's prose must not carry its own stats.
  const prose = [...grounded.map((h) => h.why), brief.openingLine, ...brief.likelyObjections.map((o) => o.response)];
  const statInProse = prose.some((t) => NUMBER_CLAIM.test(t));
  checks.push({
    id: "no-invented-stats",
    label: "No statistics outside the sourced proof points",
    status: statInProse ? "flag" : "pass",
    note: statInProse ? "A number appears in model-written text. Verify before quoting." : undefined,
  });

  // Tone: no hype words in anything a rep would say out loud.
  const hype = prose.join(" ").match(HYPE);
  checks.push({
    id: "tone",
    label: "Plain, specific language (no hype words)",
    status: hype ? "flag" : "pass",
    note: hype ? `Found: ${[...new Set(hype.map((w) => w.toLowerCase()))].join(", ")}` : undefined,
  });

  // Sources: only http(s), dedupe.
  const sources = [...new Map(brief.sources.filter((s) => /^https?:\/\//.test(s.url)).map((s) => [s.url, s])).values()];
  checks.push({
    id: "sources",
    label: "Research is linked so the rep can verify it",
    status: sources.length ? "pass" : "flag",
    note: sources.length ? `${sources.length} sources` : "No web sources. Brief is based on model knowledge only.",
  });

  return { brief: { ...brief, painHypotheses: grounded, sources }, checks };
}
