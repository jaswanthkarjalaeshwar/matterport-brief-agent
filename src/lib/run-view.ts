import type { Brief, BriefUIMessage, GuardrailCheck, StageId, StagePart, ToolCallPart, TracePart } from "@/agent/schema";

/** Everything the workspace renders, derived from stream parts (live) or a recorded sample. */
export type RunView = {
  stages: Partial<Record<StageId, StagePart>>;
  tools: ToolCallPart[];
  brief?: Partial<Brief>;
  checks: GuardrailCheck[];
  trace?: TracePart;
  memory?: string[];
};

export const STAGES: { id: StageId; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "memory", label: "Recall memory" },
  { id: "research", label: "Research account" },
  { id: "match", label: "Match proof points" },
  { id: "draft", label: "Draft brief" },
  { id: "guardrails", label: "Guardrails" },
];

export const emptyRun = (): RunView => ({ stages: {}, tools: [], checks: [] });

export function fromParts(parts: BriefUIMessage["parts"]): RunView {
  const view = emptyRun();
  for (const p of parts) {
    switch (p.type) {
      case "data-stage":
        view.stages[p.data.id] = p.data;
        break;
      case "data-tool":
        view.tools.push(p.data);
        break;
      case "data-brief":
        view.brief = p.data;
        break;
      case "data-guardrail":
        view.checks.push(p.data);
        break;
      case "data-trace":
        view.trace = p.data;
        break;
      case "data-memory":
        view.memory = p.data.recalled;
        break;
    }
  }
  return view;
}
