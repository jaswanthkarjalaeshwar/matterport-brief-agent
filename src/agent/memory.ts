import "server-only";
import { MemoryClient } from "mem0ai";
import { config } from "./config";

/**
 * Long-term memory per rep and account: what was briefed before, which angles
 * landed. Mem0 does extraction and dedupe; we only decide what to store.
 * Without a key every call is a no-op, so memory is never on the critical path.
 *
 * Mem0 files assistant-written memories under the agent, not the user, so we
 * scope by agent in the query and by rep and company in metadata, filtered here.
 */
const AGENT_ID = "matterport-brief-agent";

let client: MemoryClient | undefined;
const mem0 = () => (config.mem0Key ? (client ??= new MemoryClient({ apiKey: config.mem0Key })) : undefined);

const norm = (s: string) => s.trim().toLowerCase();

export async function recall(rep: string, company: string): Promise<string[]> {
  const m = mem0();
  if (!m) return [];
  const { results } = await m.search(`Past briefs, preferences and outcomes for ${company}`, {
    filters: { AND: [{ agent_id: AGENT_ID }] },
    topK: 20,
  });
  return results
    .filter((r) => norm(String(r.metadata?.company ?? "")) === norm(company) && (r.metadata?.rep ?? rep) === rep)
    .map((r) => r.memory)
    .filter((x): x is string => Boolean(x))
    .slice(0, 5);
}

export async function remember(rep: string, company: string, summary: string) {
  const m = mem0();
  if (!m) return;
  await m.add([{ role: "assistant", content: `Brief for ${company}: ${summary}` }], {
    agentId: AGENT_ID,
    metadata: { company, rep },
  });
}
