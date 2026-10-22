import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { config } from "./config";
import { fenceUntrusted, isBlockPage } from "./guardrails";
import { findProofPoints } from "./proof-points";
import { VERTICALS } from "./schema";

/** Per-run state the tools share: what was retrieved, what was spent. */
export type RunState = {
  proofIds: Set<string>;
  sources: Map<string, string>;
  monidSpentUsd: number;
  monidEndpoints: Map<string, number>;
  injectionFlags: number;
  /** Raw text per host, for the domain identity check. */
  pageText: Map<string, string>;
};

export const newRunState = (): RunState => ({
  proofIds: new Set(),
  sources: new Map(),
  monidSpentUsd: 0,
  monidEndpoints: new Map(),
  injectionFlags: 0,
  pageText: new Map(),
});

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[?::1\]?|0\.0\.0\.0)/i;

function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol) || PRIVATE_HOST.test(url.hostname)) throw new Error("Blocked URL");
  return url;
}

async function getJson(url: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs ?? 15_000) });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return res.json();
}

function exaSearch(state: RunState) {
  return tool({
    description: "Search the web for recent facts about a company: locations, portfolio, news, hiring, tech stack.",
    inputSchema: z.object({ query: z.string().max(200) }),
    execute: async ({ query }) => {
      const data = await getJson("https://api.exa.ai/search", {
        method: "POST",
        headers: { "x-api-key": config.exaKey!, "content-type": "application/json" },
        body: JSON.stringify({ query, numResults: 5, contents: { text: { maxCharacters: 1200 } } }),
      });
      return (data.results ?? []).map((r: { title?: string; url: string; text?: string }) => {
        state.sources.set(r.url, r.title ?? r.url);
        const fenced = fenceUntrusted(r.text ?? "", r.url, 1200);
        if (fenced.flagged) state.injectionFlags++;
        return { title: r.title, url: r.url, text: fenced.text };
      });
    },
  });
}

/**
 * Monid: one balance, ~1,700 tools discovered at runtime. Guardrails live here,
 * not in the prompt: the agent can only run endpoints it discovered this run,
 * and only while the run's budget allows it.
 */
function monidTools(state: RunState) {
  const headers = { authorization: `Bearer ${config.monidKey}`, "content-type": "application/json" };
  type Hit = { provider: string; endpoint: string; description: string; price?: { amount?: { value?: number } } };

  return {
    monid_discover: tool({
      description: "Find a data tool (web search, company enrichment, page scraping) in the Monid registry. Returns candidates with price per call.",
      inputSchema: z.object({ need: z.string().max(120).describe("e.g. 'web search', 'company firmographics by domain'") }),
      execute: async ({ need }) => {
        const data = await getJson("https://api.monid.ai/v1/discover", {
          method: "POST",
          headers,
          body: JSON.stringify({ query: need, limit: 5 }),
        });
        const hits: Hit[] = data.results ?? data.endpoints ?? data ?? [];
        return hits.slice(0, 5).map((h) => {
          const price = h.price?.amount?.value ?? 0;
          state.monidEndpoints.set(`${h.provider}${h.endpoint}`, price);
          return { provider: h.provider, endpoint: h.endpoint, description: h.description, priceUsd: price };
        });
      },
    }),
    monid_run: tool({
      description: "Run a Monid endpoint returned by monid_discover. Input must follow that endpoint's documented input.",
      inputSchema: z.object({
        provider: z.string(),
        endpoint: z.string(),
        input: z.record(z.string(), z.unknown()).default({}),
      }),
      execute: async ({ provider, endpoint, input }) => {
        const price = state.monidEndpoints.get(`${provider}${endpoint}`);
        if (price === undefined) return { blocked: "Endpoint was not discovered in this run." };
        if (state.monidSpentUsd + price > config.monidBudgetUsd)
          return { blocked: `Budget cap $${config.monidBudgetUsd} reached. Continue with what you have.` };

        let data = await getJson("https://api.monid.ai/v1/run", {
          method: "POST",
          headers,
          body: JSON.stringify({ provider, endpoint, input }),
          timeoutMs: 30_000,
        });
        state.monidSpentUsd += price;
        for (let i = 0; i < 10 && data.runId && data.status !== "COMPLETED" && data.status !== "FAILED"; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          data = await getJson(`https://api.monid.ai/v1/runs/${data.runId}`, { headers });
        }
        const fenced = fenceUntrusted(JSON.stringify(data.output ?? data.result ?? data), `monid:${provider}${endpoint}`);
        if (fenced.flagged) state.injectionFlags++;
        return fenced.text;
      },
    }),
  };
}

function readPage(state: RunState) {
  return tool({
    description: "Read a public web page (company homepage, about page, locations page) as text.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
      const target = assertPublicUrl(url);
      const res = await fetch(`https://r.jina.ai/${target.href}`, {
        headers: { accept: "text/plain", "x-return-format": "text" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Could not read ${target.host} (${res.status})`);
      const raw = await res.text();
      if (isBlockPage(raw)) return { blocked: `${target.host} shows a bot check. Use web search results for this company instead.` };
      state.sources.set(target.href, target.host);
      state.pageText.set(target.host.replace(/^www\./, ""), raw.slice(0, 20_000));
      const fenced = fenceUntrusted(raw, target.href);
      if (fenced.flagged) state.injectionFlags++;
      return fenced.text;
    },
  });
}

function lookupProofPoints(state: RunState) {
  return tool({
    description:
      "Get Matterport customer results for a vertical. Call this before writing hypotheses; you may only cite ids it returns.",
    inputSchema: z.object({
      vertical: z.enum(VERTICALS),
      pains: z.string().max(200).describe("Pains you suspect, as keywords"),
    }),
    execute: async ({ vertical, pains }) =>
      findProofPoints(vertical, pains).map((p) => {
        state.proofIds.add(p.id);
        return { id: p.id, customer: p.customer, headline: p.headline, painTags: p.painTags };
      }),
  });
}

export function buildTools(state: RunState) {
  return {
    read_page: readPage(state),
    lookup_proof_points: lookupProofPoints(state),
    ...(config.exaKey ? { web_search: exaSearch(state) } : config.monidKey ? monidTools(state) : {}),
  };
}

/** Short human label for the run timeline. */
export function describeToolCall(name: string, input: unknown): string {
  const i = (input ?? {}) as Record<string, string>;
  switch (name) {
    case "web_search":
      return `Searching “${i.query}”`;
    case "read_page":
      return `Reading ${i.url ? new URL(i.url).host : "page"}`;
    case "lookup_proof_points":
      return `Matching proof points · ${i.vertical}`;
    case "monid_discover":
      return `Finding a tool for “${i.need}”`;
    case "monid_run":
      return `Running ${i.provider}${i.endpoint}`;
    default:
      return name;
  }
}
