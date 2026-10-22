"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Brief } from "@/agent/schema";
import { getProofPoint } from "@/agent/proof-points";

const VERTICAL_LABEL: Record<string, string> = {
  "residential-real-estate": "Residential real estate",
  "commercial-real-estate": "Commercial real estate",
  hospitality: "Hospitality",
  "construction-aec": "Construction & AEC",
  "facilities-multisite": "Facilities · multi-site",
  "insurance-restoration": "Insurance & restoration",
  retail: "Retail",
  other: "Other",
};

const ease = [0.2, 0.8, 0.2, 1] as const;
const reveal = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease } };
const CONF = { high: 3, medium: 2, low: 1 } as const;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
    } catch {}
  };
  return { copied, copy };
}

/** Types the opening line once, so the rep's eye lands on it. */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setInterval(() => setN((k) => (reduced || k >= text.length ? (clearInterval(id), text.length) : k + 2)), 16);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="opacity-0">{text.slice(n)}</span>
    </span>
  );
}

function Section({ n, title, action, children }: { n: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section {...reveal} className="border-t border-line pt-5">
      <h3 className="mb-4 flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-faint">{n}</span>
          <span className="label !text-muted">{title}</span>
        </span>
        {action}
      </h3>
      {children}
    </motion.section>
  );
}

function Hypothesis({ h, i }: { h: NonNullable<Brief["painHypotheses"][number]>; i: number }) {
  const [open, setOpen] = useState(false);
  const p = h.proofPointId ? getProofPoint(h.proofPointId) : undefined;
  return (
    <motion.div
      {...reveal}
      layout
      className={`group rounded-lg border bg-surface transition-colors ${open ? "border-scan/40" : "border-line hover:border-line-strong"}`}
    >
      <button type="button" onClick={() => p && setOpen((o) => !o)} className="w-full p-4 text-left" aria-expanded={open}>
        <div className="flex items-start justify-between gap-3">
          <span className="flex gap-3">
            <span className="mt-0.5 font-mono text-[11px] text-faint">H{i + 1}</span>
            <span className="text-[15px] font-medium leading-snug">{h.title}</span>
          </span>
          {h.confidence && (
            <span className="flex shrink-0 items-end gap-0.5 pt-1" title={`${h.confidence} confidence`}>
              {[1, 2, 3].map((k) => (
                <span key={k} className={`w-1 rounded-sm ${k <= CONF[h.confidence!] ? "bg-scan" : "bg-line-strong"}`} style={{ height: 4 + k * 3 }} />
              ))}
            </span>
          )}
        </div>
        {h.why && <p className="mt-2 pl-7 text-[13px] leading-relaxed text-muted">{h.why}</p>}
        {p && (
          <span className="mt-3 flex items-center justify-between pl-7">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-scan">
              <span className="size-1 rounded-full bg-scan" />
              Proof · {p.customer.split(" (")[0]}
            </span>
            <span className={`font-mono text-[11px] text-faint transition-transform ${open ? "rotate-45" : ""}`}>+</span>
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && p && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-4 border-t border-line pt-3 pl-7">
              <p className="text-[13px] text-text">{p.headline}</p>
              <ul className="mt-2 space-y-1">
                {p.metrics.map((m, k) => (
                  <motion.li
                    key={m}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * k }}
                    className="font-mono text-[12px] text-scan"
                  >
                    {m}
                  </motion.li>
                ))}
              </ul>
              <a href={p.source} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[11px] text-muted underline decoration-line-strong underline-offset-2 hover:text-text">
                Matterport case study · self-reported ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CopyBtn({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <button onClick={onCopy} className="font-mono text-[11px] text-faint transition hover:text-scan">
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

function toNotes(company: string, b: Partial<Brief>) {
  const lines = [`# Pre-call brief: ${company}`, "", b.snapshot?.oneLiner ?? "", ""];
  if (b.openingLine) lines.push(`Open with: "${b.openingLine}"`, "");
  if (b.painHypotheses?.length) {
    lines.push("## Pain hypotheses");
    for (const h of b.painHypotheses) {
      const p = h?.proofPointId ? getProofPoint(h.proofPointId) : undefined;
      lines.push(`- ${h?.title} (${h?.confidence}). ${h?.why}${p ? ` Proof: ${p.customer}, ${p.metrics[0]} (${p.source})` : ""}`);
    }
    lines.push("");
  }
  if (b.discoveryQuestions?.length) lines.push("## Discovery questions", ...b.discoveryQuestions.map((q, i) => `${i + 1}. ${q}`), "");
  if (b.likelyObjections?.length) lines.push("## Objections", ...b.likelyObjections.map((o) => `- "${o?.objection}": ${o?.response}`), "");
  if (b.sources?.length) lines.push("## Sources", ...b.sources.map((s) => `- ${s?.url}`));
  return lines.join("\n");
}

export function BriefDoc({ brief, company, streaming, done }: { brief?: Partial<Brief>; company: string; streaming: boolean; done: boolean }) {
  const { copied, copy } = useCopy();

  if (!brief?.snapshot) {
    return (
      <div className="grid min-h-[420px] place-items-center border border-dashed border-line">
        <div className="w-64 text-center">
          <p className="label">The brief writes itself here</p>
          <div className="mt-5 space-y-2">
            {[100, 75, 88, 60].map((w, i) => (
              <div key={i} className="sweep mx-auto h-2 rounded-sm bg-surface-2" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const s = brief.snapshot;

  return (
    <article className="space-y-7">
      <motion.header {...reveal}>
        <div className="flex items-center justify-between gap-3">
          <p className="label">Pre-call brief</p>
          <AnimatePresence>
            {done && (
              <motion.button
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => copy("all", toNotes(company, brief))}
                className="rounded-md border border-line-strong px-2.5 py-1 font-mono text-[11px] text-text transition hover:border-scan/60 hover:text-scan"
              >
                {copied === "all" ? "copied ✓" : "copy as call notes"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <h2 className="mt-3 font-serif text-[44px] leading-[1] tracking-tight sm:text-[56px]">{company}</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{s.oneLiner}</p>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-[auto_1fr]">
          {s.vertical && (
            <div className="bg-surface px-3.5 py-2.5">
              <dt className="label !text-[10px]">Vertical</dt>
              <dd className="mt-1 text-[13px] whitespace-nowrap text-scan">{VERTICAL_LABEL[s.vertical] ?? s.vertical}</dd>
            </div>
          )}
          {s.footprint && (
            <div className="bg-surface px-3.5 py-2.5">
              <dt className="label !text-[10px]">Footprint</dt>
              <dd className="mt-1 text-[13px] text-muted">{s.footprint}</dd>
            </div>
          )}
        </dl>
        {s.verticalReason && <p className="mt-3 text-[13px] leading-relaxed text-muted">{s.verticalReason}</p>}
      </motion.header>

      {brief.openingLine && (
        <motion.blockquote {...reveal} className="ticks border border-line bg-surface px-5 py-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Open with</p>
            <CopyBtn copied={copied === "open"} onCopy={() => copy("open", brief.openingLine!)} />
          </div>
          <p className="font-serif text-[22px] italic leading-snug sm:text-[26px]">
            “<Typed key={brief.openingLine} text={brief.openingLine} />”
          </p>
        </motion.blockquote>
      )}

      {!!brief.painHypotheses?.length && (
        <Section n="01" title="Pain hypotheses" action={<span className="font-mono text-[11px] text-faint">tap a card for the proof</span>}>
          <div className="grid items-start gap-3 md:grid-cols-2">
            {brief.painHypotheses.map((h, i) => (h ? <Hypothesis key={i} h={h} i={i} /> : null))}
          </div>
        </Section>
      )}

      {!!brief.discoveryQuestions?.length && (
        <Section n="02" title="Discovery questions" action={<CopyBtn copied={copied === "q"} onCopy={() => copy("q", brief.discoveryQuestions!.join("\n"))} />}>
          <ol className="space-y-1">
            {brief.discoveryQuestions.map((q, i) => (
              <li key={i}>
                <button
                  onClick={() => copy(`q${i}`, q)}
                  className="group flex w-full gap-3 rounded-md px-2 py-1.5 text-left text-[14px] leading-relaxed transition hover:bg-surface"
                >
                  <span className="mt-0.5 font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{q}</span>
                  <span className="mt-0.5 font-mono text-[10px] text-scan opacity-0 transition group-hover:opacity-100">
                    {copied === `q${i}` ? "✓" : "copy"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!!brief.likelyObjections?.length && (
        <Section n="03" title="Likely objections">
          <div className="divide-y divide-line rounded-lg border border-line">
            {brief.likelyObjections.map((o, i) =>
              o ? (
                <div key={i} className="grid gap-1.5 p-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                  <p className="text-[14px]">“{o.objection}”</p>
                  <p className="text-[13px] leading-relaxed text-muted">{o.response}</p>
                </div>
              ) : null,
            )}
          </div>
        </Section>
      )}

      {!!brief.sources?.length && (
        <Section n="04" title="Sources">
          <ul className="flex flex-wrap gap-2">
            {brief.sources.map((src, i) =>
              src?.url ? (
                <li key={i}>
                  <a href={src.url} target="_blank" rel="noreferrer" className="block max-w-[260px] truncate rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-muted hover:border-line-strong hover:text-text">
                    {src.title || src.url} ↗
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </Section>
      )}

      {streaming && <p className="caret font-mono text-[12px] text-muted">writing</p>}
    </article>
  );
}
