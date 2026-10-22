import "server-only";
import { MemoryClient } from "mem0ai";
import { config } from "./config";

/**
 * Long-term memory per rep and account: what was briefed before, which angles
 * landed. Mem0 does extraction and dedupe; we only decide what to store.
 * Without a key every call is a no-op, so memory is never on the critical path.
 */
let client: MemoryClient | undefined;
const mem0 = () => (config.mem0Key ? (client ??= new MemoryClient({ apiKey: config.mem0Key })) : undefined);

const scope = (rep: string) => ({ userId: rep, agentId: "matterport-brief-agent" });

export async function recall(rep: string, company: string): Promise<string[]> {
  const m = mem0();
  if (!m) return [];
  const { results } = await m.search(`Past briefs, preferences and outcomes for ${company}`, {
    filters: { AND: [{ user_id: rep }, { agent_id: "matterport-brief-agent" }] },
    topK: 5,
  });
  return results.map((r) => r.memory).filter((x): x is string => Boolean(x));
}

export async function remember(rep: string, company: string, summary: string) {
  const m = mem0();
  if (!m) return;
  await m.add([{ role: "assistant", content: `Brief for ${company}: ${summary}` }], {
    ...scope(rep),
    metadata: { company },
  });
}
