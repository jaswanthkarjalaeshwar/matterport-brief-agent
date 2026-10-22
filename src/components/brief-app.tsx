"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SAMPLES } from "@/data/samples";
import { STAGES } from "@/lib/run-view";
import { useBriefRun } from "@/lib/use-brief-run";
import { BriefDoc } from "./brief-doc";
import { CaptureViewport } from "./capture-viewport";
import { GuardrailList, RunTimeline, TraceStats } from "./run-timeline";

type Caps = { live: boolean; search: string; memory: boolean; tracing: boolean };

const PLACEHOLDERS = ["Compass", "Turner Construction", "Cushman & Wakefield", "a property manager in Austin"];

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{children}</kbd>;
}

export function BriefApp({ caps }: { caps: Caps }) {
  const { mode, view, busy, error, runLive, runSample, reset } = useBriefRun();
  const [company, setCompany] = useState("");
  const [domain, setDomain] = useState("");
  const [ph, setPh] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const started = mode.kind !== "idle";
  const title = mode.kind === "sample" ? mode.sample.company : mode.kind === "live" ? mode.company : "";

  useEffect(() => {
    const id = setInterval(() => setPh((n) => (n + 1) % PLACEHOLDERS.length), 2600);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        input.current?.focus();
      }
      if (e.key === "Escape") input.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => (clearInterval(id), window.removeEventListener("keydown", onKey));
  }, []);

  useEffect(() => {
    if (started) setTimeout(() => workspace.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
  }, [started, title]);

  // Agent progress drives the scan in the viewport: each finished stage captures a slice of the room.
  const progress = useMemo(() => {
    if (!started) return undefined;
    const done = STAGES.filter((s) => ["done", "skipped", "flagged"].includes(view.stages[s.id]?.status ?? "")).length;
    const running = STAGES.some((s) => view.stages[s.id]?.status === "running") ? 0.5 : 0;
    return Math.min(1.05, (done + running) / STAGES.length + (done === STAGES.length ? 0.05 : 0));
  }, [started, view.stages]);

  const status = useMemo(() => {
    if (!started) return "Idle. Name an account to start a capture.";
    const run = STAGES.find((s) => view.stages[s.id]?.status === "running");
    const tool = view.tools.findLast((t) => t.status === "running");
    if (tool) return tool.summary;
    if (run) return `${run.label}…`;
    return busy ? "Starting…" : `Brief ready · ${title}`;
  }, [started, view, busy, title]);

  const sampleFor = (c: string) => SAMPLES.find((s) => s.company.toLowerCase() === c.trim().toLowerCase());
  const canRun = company.trim().length >= 2 && !busy && (caps.live || !!sampleFor(company));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRun) return;
    const sample = sampleFor(company);
    if (!caps.live && sample) return runSample(sample);
    runLive(company.trim(), domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
  };

  return (
    <>
      <section className="relative border-b border-line">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-12 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pb-16">
          {/* Left: the job to be done */}
          <div className="flex flex-col">
            <p className="label">AI sales assistant · working MVP</p>
            <h1 className="mt-5 text-[40px] leading-[1.02] font-medium tracking-[-0.035em] sm:text-[56px]">
              Know the account <span className="font-serif font-normal italic text-scan">before</span> the call.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Type a company. The agent reads up on it, places it in a Matterport vertical, and backs every pain it suspects with a real
              customer result you can click and check.
            </p>

            <form onSubmit={submit} className="mt-8">
              <label htmlFor="company" className="label flex items-center justify-between">
                <span>Account</span>
                <span className="hidden items-center gap-1.5 normal-case tracking-normal sm:flex">
                  <Kbd>/</Kbd> focus <Kbd>↵</Kbd> run
                </span>
              </label>
              <div className="mt-2 flex items-stretch border border-line-strong bg-surface transition-colors focus-within:border-scan/60">
                <input
                  id="company"
                  ref={input}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={PLACEHOLDERS[ph]}
                  autoComplete="off"
                  maxLength={80}
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[15px] outline-none placeholder:text-faint"
                />
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="domain.com"
                  aria-label="Company domain (optional)"
                  className="hidden w-32 border-l border-line bg-transparent px-3 font-mono text-[12px] outline-none placeholder:text-faint sm:block"
                />
                <button
                  type="submit"
                  disabled={!canRun}
                  className="group flex shrink-0 items-center gap-2 bg-scan px-4 text-[14px] font-medium text-bg transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint"
                >
                  {busy ? "Running" : "Brief me"}
                  <span className="transition-transform group-enabled:group-hover:translate-x-0.5">→</span>
                </button>
              </div>
              {!caps.live && (
                <p className="mt-2 text-[12px] text-muted">
                  Live research is paused on this deployment. Pick an account below to replay a full run.
                </p>
              )}
            </form>

            <div className="mt-8">
              <p className="label">Sample accounts</p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {SAMPLES.map((s) => {
                  const active = mode.kind === "sample" && mode.sample.slug === s.slug;
                  return (
                    <li key={s.slug}>
                      <button
                        onClick={() => (setCompany(s.company), runSample(s))}
                        disabled={busy}
                        className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 py-2.5 text-left transition disabled:opacity-50 sm:grid-cols-[1.2fr_1fr_auto]"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`size-1.5 rounded-full transition ${active ? "bg-scan" : "bg-line-strong group-hover:bg-muted"}`} />
                          <span className="text-[14px] transition-transform group-hover:translate-x-0.5">{s.company}</span>
                        </span>
                        <span className="hidden font-mono text-[11px] text-faint sm:block">{s.tag}</span>
                        <span className="font-mono text-[11px] text-faint transition group-hover:text-scan">replay →</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-wider text-faint uppercase">
              {[
                ["model", caps.live],
                [`search · ${caps.search}`, caps.search !== "none"],
                ["memory", caps.memory],
                ["tracing", caps.tracing],
              ].map(([k, on]) => (
                <span key={String(k)} className="flex items-center gap-1.5">
                  <span className={`size-1 rounded-full ${on ? "bg-scan" : "bg-faint"}`} />
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Right: the instrument */}
          <div className="h-[340px] sm:h-[420px] lg:h-auto lg:min-h-[520px]">
            <CaptureViewport progress={progress} status={status} />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {started && (
          <motion.section
            ref={workspace}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-10 sm:px-6"
          >
            <div className="mb-8 flex items-center justify-between gap-3 border-b border-line pb-4">
              <p className="label">
                {mode.kind === "sample" ? "Replay" : "Live run"} · <span className="text-text">{title}</span>
              </p>
              <button onClick={reset} className="font-mono text-[11px] text-muted hover:text-text">
                clear ✕
              </button>
            </div>

            {error && (
              <div className="mb-6 border border-check/40 bg-check-dim px-4 py-3 text-[13px] text-check">
                {error.message || "The run failed."} Sample accounts still work.
              </div>
            )}

            <div className="grid gap-10 lg:grid-cols-[272px_1fr] lg:gap-14">
              <aside className="min-w-0 space-y-9 lg:sticky lg:top-20 lg:self-start">
                <div>
                  <p className="label mb-4">Agent run</p>
                  <RunTimeline view={view} />
                </div>
                {!!view.memory?.length && (
                  <div>
                    <p className="label mb-3">Recalled from memory</p>
                    <ul className="space-y-1.5 text-[12px] text-muted">
                      {view.memory.map((m, i) => (
                        <li key={i}>· {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="label mb-3">Guardrails</p>
                  <GuardrailList checks={view.checks} />
                </div>
                <div>
                  <p className="label mb-3">Trace</p>
                  <TraceStats trace={view.trace} sample={mode.kind === "sample"} />
                </div>
              </aside>
              <div className="min-w-0">
                <BriefDoc brief={view.brief} company={title} streaming={busy && !!view.brief} done={!busy && !!view.checks.length} />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
