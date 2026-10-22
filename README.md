# Pre-call Brief Agent

An MVP AI sales assistant. Type an account; the agent researches it, places it in a Matterport vertical, and writes a pre-call brief where every pain hypothesis is backed by a real, linked Matterport customer result.

Built by Jaswanth Karjala Eshwar as a working sample for Matterport's AI Tools Manager role. Not affiliated with Matterport.

## What's in it

- **Brief agent** (`/`): live research run or a replay of one of seven sample accounts (including a deliberate poor fit), with the agent's steps, tool calls, guardrail results and cost shown next to the brief.
- **AI GTM map** (`/strategy`): a point of view on AI across the revenue motion, from prospecting to renewal, with how each piece gets measured and where a human stays in charge.
- **How it's built** (`/how`): architecture, stack choices and guardrails.

## Run it

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY for live runs
npm run dev
```

With no keys, the app runs on sample briefs. Each extra key turns on one capability, shown as a status dot under the input:

| Key | Turns on |
| --- | --- |
| `OPENROUTER_API_KEY` | Live runs, with model fallback |
| `EXA_API_KEY` or `MONID_API_KEY` | Web search during research |
| `MEM0_API_KEY` | Memory across briefs, per rep |
| `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` | Traces for every model and tool call |

## Layout

```
src/agent/        the agent: no React, server only
  pipeline.ts     intake → memory → research (tool loop) → draft → guardrails → remember
  tools.ts        read_page, web_search, monid_discover/run, lookup_proof_points
  guardrails.ts   input fencing and output checks
  proof-points.ts sourced customer results, the only place numbers come from
  schema.ts       brief schema and stream part types shared with the UI
src/app/api/brief streams the run as typed UI message parts
src/components/   viewport, timeline, brief document
src/data/samples  preloaded briefs for the public link
```

Design decisions and the alternatives considered are in [DECISIONS.md](DECISIONS.md).
