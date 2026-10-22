import "server-only";

/**
 * Every integration is optional except the model. Missing keys degrade a
 * capability instead of crashing the run, and the UI says what was skipped.
 */
const env = (k: string) => process.env[k]?.trim() || undefined;

export const config = {
  openrouterKey: env("OPENROUTER_API_KEY"),
  /** First model is primary; the rest are OpenRouter fallbacks, tried in order. */
  models: (env("BRIEF_MODELS") ?? "anthropic/claude-haiku-5.5,google/gemini-3.8-flash,openai/gpt-6-luna")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  exaKey: env("EXA_API_KEY"),
  monidKey: env("MONID_API_KEY"),
  /** Hard cap on Monid spend per brief, in USD. */
  monidBudgetUsd: Number(env("MONID_BUDGET_USD") ?? 0.05),
  mem0Key: env("MEM0_API_KEY"),
  langfuseHost: env("LANGFUSE_BASE_URL") ?? "https://cloud.langfuse.com",
  langfuseEnabled: Boolean(env("LANGFUSE_PUBLIC_KEY") && env("LANGFUSE_SECRET_KEY")),
  /** Optional extra MCP server for tools, e.g. a CRM. Bearer auth only. */
  mcpUrl: env("MCP_SERVER_URL"),
  mcpToken: env("MCP_SERVER_TOKEN"),
};

export const capabilities = () => ({
  live: Boolean(config.openrouterKey),
  search: config.exaKey ? "exa" : config.monidKey ? "monid" : "none",
  memory: Boolean(config.mem0Key),
  tracing: config.langfuseEnabled,
  mcp: Boolean(config.mcpUrl),
});
