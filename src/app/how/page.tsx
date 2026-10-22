import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it's built · Pre-call Brief Agent" };

const FLOW = [
  { k: "Intake", d: "Zod-validated input, rate limit per IP" },
  { k: "Memory", d: "Mem0 recall: past briefs for this rep and account" },
  { k: "Research", d: "Tool loop, max 8 steps: read pages, web search, proof-point lookup" },
  { k: "Draft", d: "Structured output streamed field by field" },
  { k: "Guardrails", d: "Grounding, invented-stat, tone and source checks" },
  { k: "Remember", d: "Store the angles used, after the response" },
];

const STACK: { layer: string; pick: string; why: string; alt: string }[] = [
  { layer: "Harness", pick: "Vercel AI SDK v7 + a small workflow", why: "One agentic step (research) inside fixed code. Cheaper, testable, same brief shape every run.", alt: "Mastra, LangGraph, Claude Agent SDK" },
  { layer: "Models", pick: "OpenRouter, Claude Haiku 5.5 primary", why: "One key, automatic fallback to Gemini and GPT if a provider fails mid-demo. Haiku is fast and cheap for this.", alt: "Direct provider SDKs, Vercel AI Gateway" },
  { layer: "Tools", pick: "Exa search, Monid registry, page reader", why: "Monid gives runtime discovery across ~1,700 paid tools on one balance, with a per-run budget enforced in code.", alt: "Composio, Smithery MCP servers, direct APIs" },
  { layer: "Memory", pick: "Mem0", why: "Managed extraction and dedupe; scoped per rep and agent. Off the critical path: a failure never blocks a brief.", alt: "Zep, Letta, Postgres + pgvector" },
  { layer: "Knowledge", pick: "Typed proof-point file", why: "Six sourced customer results. At this size a vector DB adds latency, cost and failure modes for nothing.", alt: "Supabase pgvector once the library grows" },
  { layer: "Observability", pick: "OpenTelemetry → Langfuse", why: "Every model and tool call as a trace with tokens, cost and latency. Same spans could go to any OTel backend.", alt: "LangSmith, Arize Phoenix, Helicone" },
];

const GUARDS = [
  ["Grounded by construction", "The model can only cite a proof-point id. The numbers on screen come from the source file, so it cannot invent a statistic."],
  ["Untrusted web content", "Pages and tool results are fenced as data and scrubbed of injection phrasing before the model sees them."],
  ["Tool limits in code", "Monid endpoints must be discovered in the same run and fit the run's budget. Private hosts are blocked."],
  ["Output checks", "Invented numbers, hype words and missing sources are flagged amber for the rep, not silently passed."],
];

export default function HowPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 sm:px-6 md:py-20">
      <p className="label">Architecture</p>
      <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.02em] sm:text-5xl">
        A workflow with one agentic step, <span className="font-serif font-normal italic text-muted">on purpose.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
        Research is open-ended, so the model drives it. Everything else is ordinary code, because a sales team needs the same brief shape every
        time, predictable cost, and something you can test.
      </p>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {FLOW.map((f, i) => (
          <li key={f.k} className={`p-4 ${f.k === "Research" ? "bg-surface-2" : "bg-surface"}`}>
            <span className="font-mono text-[10px] text-faint">0{i + 1}</span>
            <p className={`mt-2 text-[14px] font-medium ${f.k === "Research" ? "text-scan" : ""}`}>{f.k}</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">{f.d}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-16 text-2xl font-medium tracking-tight">Stack, and why</h2>
      <div className="mt-6 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-b border-line bg-surface">
            <tr className="label">
              <th className="px-4 py-3 font-normal">Layer</th>
              <th className="px-4 py-3 font-normal">Choice</th>
              <th className="px-4 py-3 font-normal">Why</th>
              <th className="px-4 py-3 font-normal">Considered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {STACK.map((s) => (
              <tr key={s.layer} className="align-top">
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{s.layer}</td>
                <td className="px-4 py-3 text-text">{s.pick}</td>
                <td className="px-4 py-3 leading-relaxed text-muted">{s.why}</td>
                <td className="px-4 py-3 text-faint">{s.alt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 text-2xl font-medium tracking-tight">Guardrails</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {GUARDS.map(([t, d]) => (
          <div key={t} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-[15px] font-medium">{t}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{d}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-medium tracking-tight">What I&apos;d do in the first 30 days</h2>
      <ol className="mt-6 space-y-3 text-[14px] leading-relaxed">
        {[
          "Ride along on ten AE calls and read the current AI Sales Assistant's output next to what reps actually said.",
          "Swap web research for Salesforce, Gong and ZoomInfo through MCP, so briefs use Matterport's own account history.",
          "Agree a quality bar with Sales leadership: an eval set of 30 accounts scored on accuracy, usefulness and tone.",
          "Ship the brief into Slack and the Salesforce account page, where reps already are, and measure opens before calls.",
        ].map((x, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-muted">{x}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
