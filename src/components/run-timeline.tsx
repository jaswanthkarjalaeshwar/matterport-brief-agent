"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { GuardrailCheck, StageStatus, TracePart } from "@/agent/schema";
import { STAGES, type RunView } from "@/lib/run-view";

const fmtMs = (ms?: number) => (ms == null ? "" : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);

function Dot({ status }: { status?: StageStatus }) {
  const base = "relative grid size-3.5 place-items-center rounded-full border";
  if (status === "running")
    return (
      <span className={`${base} border-scan`}>
        <span className="absolute inset-0 animate-ping rounded-full bg-scan/40" />
        <span className="size-1.5 rounded-full bg-scan" />
      </span>
    );
  if (status === "done") return <span className={`${base} border-scan/50 bg-scan/15`}><span className="size-1.5 rounded-full bg-scan" /></span>;
  if (status === "flagged") return <span className={`${base} border-check/60 bg-check-dim`}><span className="size-1.5 rounded-full bg-check" /></span>;
  if (status === "skipped") return <span className={`${base} border-dashed border-faint`} />;
  return <span className={`${base} border-line-strong`} />;
}

/** Ticks while anything is running, so running steps show live elapsed time from their `startedAt`. */
function useElapsed(view: RunView) {
  const [now, setNow] = useState(0);
  const active = Object.values(view.stages).some((s) => s?.status === "running") || view.tools.some((t) => t.status === "running");
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  return (item?: { status?: string; ms?: number; startedAt?: number }) =>
    item?.status === "running" && item.startedAt && now ? fmtMs(Math.max(0, now - item.startedAt)) : fmtMs(item?.ms);
}

export function RunTimeline({ view }: { view: RunView }) {
  const elapsed = useElapsed(view);
  return (
    <ol className="relative">
      <span className="absolute top-2 bottom-2 left-[6.5px] w-px bg-line" aria-hidden />
      {STAGES.map((s) => {
        const st = view.stages[s.id];
        return (
          <li key={s.id} className="relative pb-4 pl-7 last:pb-0">
            <span className="absolute top-0.5 left-0"><Dot status={st?.status} /></span>
            <div className="flex items-baseline justify-between gap-3">
              <span className={`text-[13px] ${st ? "text-text" : "text-faint"}`}>{s.label}</span>
              <span className={`font-mono text-[11px] tabular-nums ${st?.status === "running" ? "text-scan" : "text-faint"}`}>{elapsed(st)}</span>
            </div>
            {st?.detail && <p className="mt-0.5 text-[12px] leading-snug text-muted">{st.detail}</p>}
            {s.id === "research" && view.tools.length > 0 && (
              <ul className="mt-2 space-y-1">
                <AnimatePresence initial={false}>
                  {view.tools.map((t) => (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-2 py-1.5 font-mono text-[11px] ${t.status === "running" ? "sweep" : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${t.status === "done" ? "bg-scan" : t.status === "running" ? "bg-scan/50" : t.status === "blocked" ? "bg-check" : "bg-danger"}`}
                        />
                        <span className="truncate text-muted">{t.summary}</span>
                      </span>
                      <span className="shrink-0 text-faint tabular-nums">{t.status === "blocked" ? "blocked" : elapsed(t)}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function GuardrailList({ checks }: { checks: GuardrailCheck[] }) {
  if (!checks.length) return <p className="text-[12px] text-faint">Runs after the draft. Deterministic, no extra model call.</p>;
  return (
    <ul className="space-y-2">
      {checks.map((c, i) => (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex gap-2.5 text-[12px] leading-snug"
        >
          <span
            className={`mt-px grid size-4 shrink-0 place-items-center rounded-[4px] font-mono text-[10px] ${
              c.status === "pass" ? "bg-scan-dim text-scan" : c.status === "fixed" ? "bg-scan-dim text-scan" : "bg-check-dim text-check"
            }`}
          >
            {c.status === "flag" ? "!" : "✓"}
          </span>
          <span>
            <span className="text-text">{c.label}</span>
            {c.note && <span className={`block ${c.status === "flag" ? "text-check" : "text-muted"}`}>{c.note}</span>}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

export function TraceStats({ trace, sample }: { trace?: TracePart; sample?: boolean }) {
  if (sample) return <p className="text-[12px] text-muted">Sample brief. Live runs report tokens, cost and latency here, and export a full trace to Langfuse.</p>;
  if (!trace) return <p className="text-[12px] text-faint">Appears when the run finishes.</p>;
  const cells = [
    ["Model", trace.model.split("/")[1] ?? trace.model],
    ["Latency", fmtMs(trace.ms)],
    ["Tokens", `${(trace.inputTokens / 1000).toFixed(1)}k in · ${(trace.outputTokens / 1000).toFixed(1)}k out`],
    ["Cost", trace.costUsd != null ? `$${trace.costUsd.toFixed(4)}` : "n/a"],
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
        {cells.map(([k, v]) => (
          <div key={k} className="bg-surface px-2.5 py-2">
            <dt className="label !text-[10px]">{k}</dt>
            <dd className="mt-0.5 truncate font-mono text-[12px] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {trace.traceUrl && (
        <a href={trace.traceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-scan hover:underline">
          Open traces in Langfuse ↗
        </a>
      )}
    </div>
  );
}
