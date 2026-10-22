import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { capabilities } from "@/agent/config";
import { runBrief } from "@/agent/pipeline";
import { BriefInput, type BriefUIMessage } from "@/agent/schema";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) return Response.json({ error: "Too many briefs. Try again in a minute." }, { status: 429 });

  const parsed = BriefInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  if (!capabilities().live) return Response.json({ error: "Live mode is off: no model key configured." }, { status: 503 });

  const stream = createUIMessageStream<BriefUIMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      await runBrief(parsed.data, writer);
      writer.write({ type: "finish" });
    },
    onError: (error) => {
      console.error("[brief]", error);
      return error instanceof Error && /OPENROUTER|401|402/.test(error.message)
        ? "The model provider rejected the request. Check the API key and credit."
        : "The agent hit an error. Try again, or open a sample brief.";
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export function GET() {
  return Response.json(capabilities());
}
