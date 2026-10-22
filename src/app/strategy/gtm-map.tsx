"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Status = "live" | "next" | "proposed" | "whitespace";

type Stage = {
  id: string;
  name: string;
  tool: string;
  status: Status;
  what: string;
  measure: string;
  human: string;
};

const STATUS: Record<Status, { label: string; cls: string }> = {
  live: { label: "Live in this MVP", cls: "bg-scan text-bg" },
  next: { label: "Next build", cls: "border border-scan/50 text-scan" },
  proposed: { label: "Proposed", cls: "border border-line-strong text-text" },
  whitespace: { label: "White space", cls: "border border-dashed border-check/60 text-check" },
};

const STAGES: Stage[] = [
  {
    id: "prospect",
    name: "Prospect",
    tool: "AI BDR agent",
    status: "next",
    what: "Scores accounts from ZoomInfo against the ICP, adds a Matterport-specific signal (listings or sites with no 3D capture), and drafts a short templated sequence for the AE to approve.",
    measure: "Reply rate and meetings booked against a holdout group; pipeline sourced per AE hour.",
    human: "AE approves the first touch on named accounts. No auto-send to strategic logos.",
  },
  {
    id: "prepare",
    name: "Prepare",
    tool: "Pre-call brief",
    status: "live",
    what: "Researches the account, picks the vertical, and ties each pain hypothesis to a sourced customer result. This page's demo.",
    measure: "Briefs opened before the call, AE rating per brief, prep minutes saved, stage-1 to stage-2 conversion.",
    human: "Rep decides what to say. Flagged claims are verified before quoting.",
  },
  {
    id: "engage",
    name: "Engage",
    tool: "Call-to-hypothesis loop",
    status: "proposed",
    what: "Reads Gong calls after the meeting, records which hypotheses landed and which objections came up, and writes that back to memory so the next brief for the same vertical improves.",
    measure: "Hypothesis hit rate by vertical over time; objection coverage.",
    human: "Sales leadership reviews the hypothesis library monthly with Product Marketing.",
  },
  {
    id: "close",
    name: "Close",
    tool: "Proof-point & ROI drafter",
    status: "proposed",
    what: "Assembles the proof points and a vertical ROI model into a proposal draft, using only approved customer stories.",
    measure: "Proposal turnaround time; win rate on proposals that used it.",
    human: "Pricing, discounts and legal terms stay human. AI drafts, it doesn't commit.",
  },
  {
    id: "onboard",
    name: "Onboard",
    tool: "Capture-plan generator",
    status: "whitespace",
    what: "Turns the deal notes into a first-90-days plan: which spaces to capture first, who on the customer side to train, what success looks like.",
    measure: "Days to first capture; captures in the first 30 days.",
    human: "CSM owns the plan and the relationship.",
  },
  {
    id: "expand",
    name: "Expand & renew",
    tool: "Usage-signal agent",
    status: "whitespace",
    what: "Watches capture and seat usage. Rising usage flags an expansion conversation; falling usage flags renewal risk to the CSM weeks earlier.",
    measure: "Lead time on churn flags; expansion pipeline from flagged accounts; net revenue retention.",
    human: "CSM decides the outreach; nothing customer-facing is automated.",
  },
];

const FOUNDATION = [
  ["System of record", "Salesforce"],
  ["Conversation data", "Gong"],
  ["Firmographics", "ZoomInfo"],
  ["Where sellers work", "Slack + Salesforce side panel"],
  ["Tool layer", "MCP servers, one per system"],
  ["Quality", "Evals + Langfuse traces, reviewed monthly"],
  ["Governance", "CoStar IT security review, data handling, model choice"],
];

export function GtmMap() {
  const [active, setActive] = useState("prepare");
  const stage = STAGES.find((s) => s.id === active)!;

  return (
    <div>
      {/* Funnel rail */}
      <div className="relative">
        <div className="absolute top-[22px] right-0 left-0 hidden h-px bg-line md:block" aria-hidden />
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-6 md:gap-3">
          {STAGES.map((s, i) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setActive(s.id)}
                  onMouseEnter={() => setActive(s.id)}
                  className={`relative w-full rounded-lg border p-3 text-left transition ${on ? "border-scan/50 bg-surface-2" : "border-line bg-surface hover:border-line-strong"}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-faint">0{i + 1}</span>
                    <span
                      className={`size-2 rounded-full ${s.status === "live" ? "bg-scan" : s.status === "next" ? "border border-scan" : s.status === "proposed" ? "bg-line-strong" : "border border-dashed border-check"}`}
                    />
                  </span>
                  <span className="mt-3 block text-[14px] font-medium">{s.name}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">{s.tool}</span>
                  {on && <motion.span layoutId="stage-bar" className="absolute right-3 bottom-0 left-3 h-px bg-scan" />}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="ticks mt-6 grid gap-6 border border-line bg-surface p-6 md:grid-cols-[1.2fr_1fr] md:p-8"
        >
          <div>
            <span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] ${STATUS[stage.status].cls}`}>{STATUS[stage.status].label}</span>
            <h3 className="mt-4 font-serif text-3xl tracking-tight">{stage.tool}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{stage.what}</p>
          </div>
          <dl className="space-y-5">
            <div>
              <dt className="label">How we&apos;d measure it</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed">{stage.measure}</dd>
            </div>
            <div>
              <dt className="label !text-check">Where AI stops</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed">{stage.human}</dd>
            </div>
          </dl>
        </motion.div>
      </AnimatePresence>

      {/* Foundation */}
      <div className="mt-12">
        <p className="label">Shared foundation under every stage</p>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FOUNDATION.map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <p className="font-mono text-[10px] tracking-wider text-faint uppercase">{k}</p>
              <p className="mt-1.5 text-[14px]">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
