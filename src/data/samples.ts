import type { Brief, GuardrailCheck, ToolCallPart } from "@/agent/schema";

/**
 * Preloaded briefs so the demo link always works, even with no API credit.
 * Hand-written to the same schema the agent outputs; company facts are kept
 * to well-known public descriptions. Replace with recorded agent runs once live keys exist.
 */
export type Sample = {
  slug: string;
  company: string;
  domain: string;
  tag: string;
  tools: Omit<ToolCallPart, "status">[];
  brief: Brief;
  checks: GuardrailCheck[];
};

const baseChecks = (n: number): GuardrailCheck[] => [
  { id: "grounding", label: "Every pain hypothesis cites a real customer result", status: "pass" },
  { id: "no-invented-stats", label: "No statistics outside the sourced proof points", status: "pass" },
  { id: "tone", label: "Plain, specific language (no hype words)", status: "pass" },
  { id: "sources", label: "Research is linked so the rep can verify it", status: "pass", note: `${n} sources` },
];

export const SAMPLES: Sample[] = [
  {
    slug: "compass",
    company: "Compass",
    domain: "compass.com",
    tag: "Residential brokerage",
    tools: [
      { id: "s1", tool: "read_page", summary: "Reading compass.com", ms: 1840 },
      { id: "s2", tool: "web_search", summary: "Searching “Compass agents listing marketing tools”", ms: 2210 },
      { id: "s3", tool: "lookup_proof_points", summary: "Matching proof points · residential-real-estate", ms: 4 },
    ],
    brief: {
      snapshot: {
        oneLiner: "A large U.S. residential real estate brokerage that gives its agents an in-house technology platform for marketing and client management.",
        footprint: "Offices across major U.S. metros; agent count and listing volume should be confirmed in discovery.",
        vertical: "residential-real-estate",
        verticalReason: "Its business is agents winning and marketing home listings, which is where 3D tours earn their keep.",
      },
      painHypotheses: [
        {
          title: "Agents need a sharper edge in listing appointments",
          why: "Compass positions its platform as a recruiting and listing-win tool for agents, so anything that helps an agent win the listing conversation matters.",
          proofPointId: "rebd-days-on-market",
          confidence: "high",
        },
        {
          title: "Relocation buyers can't tour in person",
          why: "Large metro markets draw out-of-area buyers who shortlist online before they ever visit.",
          proofPointId: "rebd-days-on-market",
          confidence: "medium",
        },
      ],
      discoveryQuestions: [
        "How do your agents differentiate their marketing package in a listing presentation today?",
        "Which listing media does the platform produce centrally, and which do agents source on their own?",
        "Where do out-of-area buyers drop off between first online view and an offer?",
        "If 3D tours were a platform default, who would own capture: agents, photographers, or a central team?",
      ],
      likelyObjections: [
        {
          objection: "We already have photos and video on every listing.",
          response: "Agreed, and those sell the look. A tour answers the layout questions that otherwise need a showing, which is what moves remote buyers.",
        },
        {
          objection: "Agents won't adopt another tool.",
          response: "That's why capture can sit with your existing photographers. Agents just get the tour link in the listing they already publish.",
        },
      ],
      openingLine: "You've built a lot of the listing workflow into your own platform, so I'm curious where 3D fits in it today, if at all.",
      sources: [
        { title: "compass.com", url: "https://www.compass.com/" },
        { title: "Compass, About", url: "https://www.compass.com/about/" },
      ],
    },
    checks: baseChecks(2),
  },
  {
    slug: "turner",
    company: "Turner Construction",
    domain: "turnerconstruction.com",
    tag: "General contractor",
    tools: [
      { id: "t1", tool: "read_page", summary: "Reading turnerconstruction.com", ms: 1610 },
      { id: "t2", tool: "web_search", summary: "Searching “Turner Construction virtual design and construction”", ms: 2480 },
      { id: "t3", tool: "lookup_proof_points", summary: "Matching proof points · construction-aec", ms: 3 },
    ],
    brief: {
      snapshot: {
        oneLiner: "One of the largest general builders in the U.S., delivering commercial, healthcare, education and infrastructure projects.",
        footprint: "Offices nationwide and a large concurrent project portfolio; exact counts to confirm.",
        vertical: "construction-aec",
        verticalReason: "As a general contractor, its margins live and die on rework, RFIs and schedule, which site capture directly affects.",
      },
      painHypotheses: [
        {
          title: "Rework and RFIs from out-of-date site conditions",
          why: "Large GCs coordinate many trades on fast schedules, so gaps between drawings and the field turn into RFIs and rework.",
          proofPointId: "wesbuilt-rework",
          confidence: "high",
        },
        {
          title: "Disputes over existing conditions and progress",
          why: "Owner and subcontractor claims often come down to what the site looked like on a given date.",
          proofPointId: "scanspace-dilapidation",
          confidence: "medium",
        },
      ],
      discoveryQuestions: [
        "How do project teams document existing conditions and progress today, and who looks at it?",
        "Which projects saw the most RFIs tied to field conditions last year?",
        "How does site documentation connect to Procore or your project management system?",
        "When a claim comes up, how long does it take to show what the site looked like on a specific date?",
      ],
      likelyObjections: [
        {
          objection: "We already do laser scanning on complex jobs.",
          response: "That fits for high-accuracy work. This is about making routine, weekly capture cheap enough to do on every job, not replacing survey-grade scans.",
        },
      ],
      openingLine: "When a site condition doesn't match the drawings on one of your jobs, how does the team usually find out?",
      sources: [
        { title: "turnerconstruction.com", url: "https://www.turnerconstruction.com/" },
      ],
    },
    checks: baseChecks(1),
  },
  {
    slug: "cushman",
    company: "Cushman & Wakefield",
    domain: "cushmanwakefield.com",
    tag: "Commercial real estate & facilities",
    tools: [
      { id: "c1", tool: "read_page", summary: "Reading cushmanwakefield.com", ms: 1930 },
      { id: "c2", tool: "web_search", summary: "Searching “Cushman & Wakefield facility services property management”", ms: 2050 },
      { id: "c3", tool: "lookup_proof_points", summary: "Matching proof points · facilities-multisite", ms: 3 },
    ],
    brief: {
      snapshot: {
        oneLiner: "A global commercial real estate services firm covering leasing, capital markets, property management and facility services.",
        footprint: "Manages large multi-site portfolios for occupiers and owners worldwide; portfolio size to confirm per client.",
        vertical: "facilities-multisite",
        verticalReason: "Property and facility management across many sites means repeated site visits and patchy floor plans, the BMO pattern.",
      },
      painHypotheses: [
        {
          title: "Too many trips just to look at a site",
          why: "Facility and project teams managing many locations spend real time and travel on surveys, audits and vendor walk-throughs.",
          proofPointId: "bmo-branch-rebrand",
          confidence: "high",
        },
        {
          title: "Missing or outdated floor plans at handover",
          why: "When a new client portfolio is onboarded, documentation is often incomplete or inconsistent across sites.",
          proofPointId: "bmo-branch-rebrand",
          confidence: "medium",
        },
        {
          title: "Condition disputes at lease end",
          why: "Dilapidation and condition reporting is a recurring cost in leasing and property management.",
          proofPointId: "scanspace-dilapidation",
          confidence: "low",
        },
      ],
      discoveryQuestions: [
        "When you onboard a new multi-site client, how do you build the baseline of each site?",
        "Which recurring site visits could be done remotely if the space were captured once?",
        "How are condition reports produced at lease start and end today?",
      ],
      likelyObjections: [
        {
          objection: "Each client owns its own systems and data.",
          response: "Captures can be shared per client and per site, so the twin becomes part of the client's record rather than something you have to host.",
        },
      ],
      openingLine: "For a client with a few hundred sites, how much of your team's travel is just to see what a space looks like?",
      sources: [
        { title: "cushmanwakefield.com", url: "https://www.cushmanwakefield.com/" },
      ],
    },
    checks: baseChecks(1),
  },
];

export const getSample = (slug: string) => SAMPLES.find((s) => s.slug === slug);
