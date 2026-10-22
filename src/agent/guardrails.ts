import { getProofPoint } from "./proof-points";
import { LIMITS, type Brief, type GuardrailCheck } from "./schema";

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

/** Bot walls and error shells: not evidence about the company either way. */
const BLOCK_PAGE = /confirm you are (a )?human|verify you are (a )?human|are you a robot|access denied|just a moment\.\.\.|enable javascript and cookies|captcha|attention required/i;
export const isBlockPage = (text: string) => text.length < 200 || BLOCK_PAGE.test(text.slice(0, 2000));

/**
 * Does the page at the given domain actually belong to the company the rep typed?
 * Cheap token check on the homepage text: catches typos and mismatched domains
 * (e.g. "Compass" with "stripe.com") before a brief gets written about the wrong firm.
 */
export function domainMatchesCompany(company: string, pageText: string | undefined): boolean | undefined {
  if (!pageText || BLOCK_PAGE.test(pageText.slice(0, 2000))) return undefined;
  const STOP = new Set(["inc", "llc", "ltd", "corp", "company", "group", "the", "and", "co"]);
  const tokens = company.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));
  if (!tokens.length) return undefined;
  const text = pageText.toLowerCase();
  return tokens.some((t) => text.includes(t));
}

export function checkBrief(brief: Brief, allowedProofIds: Set<string>): { brief: Brief; checks: GuardrailCheck[] } {
  const checks: GuardrailCheck[] = [];

  // Shape: trim to limits rather than reject the run.
  brief = {
    ...brief,
    painHypotheses: brief.painHypotheses.slice(0, LIMITS.painHypotheses),
    discoveryQuestions: brief.discoveryQuestions.slice(0, LIMITS.discoveryQuestions),
    likelyObjections: brief.likelyObjections.slice(0, LIMITS.likelyObjections),
    sources: brief.sources.slice(0, LIMITS.sources),
  };

  // Fit gate: a poor-fit account gets an honest "not a fit", never forced pain points.
  if (brief.fit.level === "poor") {
    checks.push({ id: "fit", label: "Account fit checked before pitching", status: "flag", note: "Poor fit. Hypotheses withheld so the rep doesn't force a pitch." });
    brief = { ...brief, painHypotheses: [] };
  } else {
    checks.push({ id: "fit", label: "Account fit checked before pitching", status: "pass", note: `${brief.fit.level} fit` });
  }

  // Grounding: every hypothesis must cite a real proof point the agent actually retrieved.
  const grounded = brief.painHypotheses.filter((h) => allowedProofIds.has(h.proofPointId) && getProofPoint(h.proofPointId));
  const dropped = brief.painHypotheses.length - grounded.length;
  checks.push({
    id: "grounding",
    label: "Every pain hypothesis cites a real customer result",
    status: dropped ? "fixed" : "pass",
    note: dropped ? `Dropped ${dropped} hypothesis without a valid proof point` : brief.fit.level === "poor" ? "No hypotheses to check" : undefined,
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
