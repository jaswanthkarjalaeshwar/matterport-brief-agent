import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { config } from "./config";

/**
 * One router, many providers. OpenRouter tries `models` in order when the
 * primary is down or rate limited, so a provider outage never kills a demo.
 */
export function briefModel() {
  if (!config.openrouterKey) throw new Error("OPENROUTER_API_KEY is not set");
  const openrouter = createOpenRouter({ apiKey: config.openrouterKey });
  const [primary, ...fallbacks] = config.models;
  return openrouter.chat(primary, {
    models: fallbacks,
    usage: { include: true },
  });
}

export const primaryModelId = () => config.models[0];
