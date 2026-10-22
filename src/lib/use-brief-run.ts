"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefUIMessage, StageId } from "@/agent/schema";
import type { Sample } from "@/data/samples";
import { emptyRun, fromParts, type RunView } from "./run-view";

export type RunMode = { kind: "idle" } | { kind: "live"; company: string } | { kind: "sample"; sample: Sample };

/**
 * One hook, two sources. Live runs stream from /api/brief; samples replay the
 * same RunView shape on a timer, so the UI has exactly one rendering path.
 */
export function useBriefRun() {
  const [mode, setMode] = useState<RunMode>({ kind: "idle" });
  const [replay, setReplay] = useState<RunView>(emptyRun);
  const [replaying, setReplaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [transport] = useState(() => new DefaultChatTransport<BriefUIMessage>({ api: "/api/brief" }));
  const { messages, sendMessage, status, error, stop, setMessages } = useChat<BriefUIMessage>({ transport });

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const runLive = useCallback(
    (company: string, domain?: string) => {
      clearTimers();
      setReplaying(false);
      setMessages([]);
      setMode({ kind: "live", company });
      void sendMessage({ text: company }, { body: { company, domain: domain || undefined } });
    },
    [sendMessage, setMessages],
  );

  const runSample = useCallback(
    (sample: Sample) => {
      clearTimers();
      stop();
      setMode({ kind: "sample", sample });
      setReplaying(true);

      const view = emptyRun();
      const at = (ms: number, fn: (v: RunView) => void) =>
        timers.current.push(setTimeout(() => (fn(view), setReplay({ ...view, stages: { ...view.stages }, tools: [...view.tools] })), ms));
      const stage = (id: StageId, status: "running" | "done" | "skipped", detail?: string, ms?: number) =>
        (v: RunView) => void (v.stages[id] = { id, status, detail, ms, startedAt: status === "running" ? Date.now() : undefined });

      setReplay(emptyRun());
      at(0, stage("intake", "done", `${sample.company} (${sample.domain})`, 2));
      at(150, stage("memory", "skipped", "Sample run"));
      at(300, stage("research", "running", "Web search"));
      let t = 450;
      for (const tool of sample.tools) {
        at(t, (v) => v.tools.push({ ...tool, status: "running", startedAt: Date.now() }));
        t += Math.min(900, (tool.ms ?? 300) / 2.5);
        at(t, (v) => (v.tools = v.tools.map((x) => (x.id === tool.id ? { ...x, status: "done" } : x))));
        t += 120;
      }
      at(t, stage("research", "done", `${sample.tools.length} steps · ${sample.brief.sources.length} sources`, t - 300));
      at(t + 100, stage("match", "done", "Proof points matched", 4));
      at(t + 200, stage("draft", "running"));
      // Reveal the brief section by section, like the structured stream does.
      const b = sample.brief;
      const steps: Partial<typeof b>[] = [
        { snapshot: b.snapshot },
        { snapshot: b.snapshot, openingLine: b.openingLine },
        ...b.painHypotheses.map((_, i) => ({ snapshot: b.snapshot, openingLine: b.openingLine, painHypotheses: b.painHypotheses.slice(0, i + 1) })),
        { ...b, sources: [] },
        b,
      ];
      steps.forEach((s, i) => at(t + 300 + i * 260, (v) => (v.brief = s)));
      const done = t + 300 + steps.length * 260;
      at(done, stage("draft", "done", undefined, steps.length * 260));
      at(done + 100, (v) => {
        v.checks = sample.checks;
        v.stages.guardrails = { id: "guardrails", status: "done", ms: 3 };
      });
      at(done + 150, () => setReplaying(false));
    },
    [stop],
  );

  const reset = useCallback(() => {
    clearTimers();
    stop();
    setMessages([]);
    setReplaying(false);
    setMode({ kind: "idle" });
  }, [stop, setMessages]);

  const last = messages.findLast((m) => m.role === "assistant");
  const liveView = useMemo(() => (last ? fromParts(last.parts) : emptyRun()), [last]);

  const view = mode.kind === "sample" ? replay : liveView;
  const busy = mode.kind === "sample" ? replaying : status === "submitted" || status === "streaming";

  return { mode, view, busy, error: mode.kind === "live" ? error : undefined, runLive, runSample, reset };
}
