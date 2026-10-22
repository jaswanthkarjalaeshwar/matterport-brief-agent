/**
 * Observability. The AI SDK emits OpenTelemetry spans for every model call and
 * tool call; Langfuse receives them as traces with tokens, cost and latency.
 * No Langfuse keys means no exporter, and the app still runs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return;

  const [{ registerOTel }, { LangfuseSpanProcessor }, { registerTelemetry }, { OpenTelemetry }] = await Promise.all([
    import("@vercel/otel"),
    import("@langfuse/otel"),
    import("ai"),
    import("@ai-sdk/otel"),
  ]);

  registerOTel({ serviceName: "matterport-brief-agent", spanProcessors: [new LangfuseSpanProcessor()] });
  registerTelemetry(new OpenTelemetry());
}
