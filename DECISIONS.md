# Decisions

Each entry: what was chosen, why, what else was considered, and the trade-off accepted. Newest last.

## 1. A workflow with one agentic step, not a free-roaming agent
- **Chose:** fixed pipeline (intake → memory → research → match → draft → guardrails → remember). Only research is a tool loop the model controls, capped at 8 steps.
- **Why:** sales teams need the same brief shape every time, predictable cost per brief, and something testable. Research is the only genuinely open-ended part.
- **Considered:** one ToolLoopAgent doing everything; a multi-agent setup with a researcher and a writer.
- **Trade-off:** less flexible for unusual accounts. Acceptable for an MVP; easy to loosen later.

## 2. Harness: Vercel AI SDK v7, not Mastra
- **Chose:** AI SDK core (`generateText` with tools, `streamText` with structured output) plus ~150 lines of our own pipeline.
- **Why:** one agent doesn't need a framework's workflow engine. Mastra sits on the AI SDK anyway; going direct means less to explain, fewer version surprises, and lifecycle callbacks give us the tool-level events the UI needs.
- **Considered:** Mastra (originally planned), LangGraph, Claude Agent SDK.
- **Trade-off:** we own retries and orchestration. Revisit if this grows to several agents with handoffs.

## 3. Models through OpenRouter, Haiku primary
- **Chose:** OpenRouter with `claude-haiku-5.5` primary and Gemini Flash and GPT Luna as ordered fallbacks.
- **Why:** one key, automatic failover if a provider is down during a demo, per-call cost in the response. Haiku is fast and cheap enough for a brief (cost is a fraction of a cent).
- **Considered:** direct Anthropic SDK; Vercel AI Gateway.
- **Trade-off:** a small routing markup and one more vendor in the data path.

## 4. Grounding by construction
- **Chose:** the model may only cite a proof-point *id*. Metrics on screen are rendered from `proof-points.ts`, which holds sourced Matterport case-study numbers.
- **Why:** the most damaging failure for a sales tool is a rep quoting a made-up statistic to a prospect. Making it structurally impossible beats asking the model nicely.
- **Considered:** RAG over case-study text with citation checking.
- **Trade-off:** the knowledge base is hand-curated. Fine at six entries; move to Supabase + pgvector past ~50.

## 5. Guardrails in code, cheapest first
- **Chose:** (1) fence and scrub web content as untrusted data; (2) tool limits enforced in tool code, including Monid's discover-before-run rule and a per-run dollar budget, plus a private-host block; (3) deterministic output checks for grounding, stray numbers, hype words and missing sources.
- **Why:** deterministic checks are free, instant and testable. Flags go to the rep in amber instead of silently passing.
- **Considered:** Guardrails AI, NeMo Guardrails, an LLM-as-judge pass.
- **Trade-off:** regex tone checks are crude. An LLM judge is the next step once there is an eval set to calibrate it.

## 6. Tools: Exa direct, Monid as the registry
- **Chose:** Exa for search when keyed; otherwise Monid's HTTP API (`discover` → `run`). A free page reader for company sites.
- **Why:** Monid gives runtime discovery across ~1,700 paid tools on one balance. We call its HTTP API because its MCP server uses interactive OAuth, which a server-side agent can't complete.
- **Considered:** Monid MCP, Composio, direct Apollo/PDL APIs.
- **Trade-off:** Monid is young; the budget cap limits exposure.

## 7. Memory: Mem0, never on the critical path
- **Chose:** Mem0 managed memory scoped per rep and agent. Recall before research, write after the response.
- **Why:** extraction and dedupe for free; failures are caught and ignored so a memory outage never blocks a brief.
- **Considered:** Zep (graph), Letta, Postgres table.
- **Trade-off:** another vendor holding account notes. In production this would go through CoStar IT review or move in-house.

## 8. No database in the MVP
- **Chose:** no Supabase yet.
- **Why:** nothing needs durable relational state: proof points are a typed file, memory lives in Mem0, traces live in Langfuse.
- **Trade-off:** no brief history UI. Add Postgres when briefs need to be saved and rated by reps.

## 9. Observability: OpenTelemetry → Langfuse, plus in-app trace
- **Chose:** AI SDK OTel spans exported to Langfuse; the same run's tokens, cost and latency shown in the UI.
- **Why:** the job is measured on usage, quality and pipeline impact. Traces are the raw material for evals and the monthly report.
- **Considered:** LangSmith, Arize Phoenix, Helicone; Sentry for app errors (complementary, not a replacement).
- **Trade-off:** free-tier limits on Langfuse cloud; self-host if volume grows.

## 10. Samples so the link always works
- **Chose:** three preloaded briefs replayed through the same rendering path as live runs.
- **Why:** a hiring manager may open the link when API credit is out or a provider is down. The demo should never show an error first.
- **Trade-off:** sample content is hand-written to the schema. Replace with recorded live runs once keys are set.

## 11. UI: "survey instrument" art direction
- **Chose:** graphite surfaces, hairline grids, mono telemetry, one mint accent for live signal and amber for "check this". The hero is a capture viewport whose scan progress is driven by the agent's actual stage progress.
- **Why:** the interface should read as a tool a rep uses, and nod to digital twins without borrowing Matterport's brand.
- **Trade-off:** a canvas animation on the landing page; it pauses offscreen and respects reduced motion.
