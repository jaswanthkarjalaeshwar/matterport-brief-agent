import type { Vertical } from "./schema";

/**
 * Public Matterport customer results, copied from Matterport's own case studies.
 * This is the only place numbers enter a brief. Self-reported by Matterport; we
 * link the source so a rep can verify before quoting it.
 */
export type ProofPoint = {
  id: string;
  customer: string;
  verticals: Vertical[];
  headline: string;
  metrics: string[];
  painTags: string[];
  source: string;
};

export const PROOF_POINTS: ProofPoint[] = [
  {
    id: "rebd-days-on-market",
    customer: "Real Estate by Design (Keller Williams, TX)",
    verticals: ["residential-real-estate"],
    headline: "Listings sold faster and closer to asking price with 3D tours",
    metrics: ["Days on market 30 → 21", "Sale-to-list ratio ~93% → ~97% in six months"],
    painTags: ["listing wins", "days on market", "out-of-state buyers", "price"],
    source:
      "https://matterport.com/industries/case-studies/real-estate-design-sees-dramatic-results-adopting-matterport-3d-tours",
  },
  {
    id: "vacasa-conversion",
    customer: "Vacasa",
    verticals: ["hospitality"],
    headline: "3D tours across ~90% of 38,000+ vacation homes",
    metrics: ["Nearly 12% higher conversion on listings with tours", "Scaled from 4 properties to ~90% of portfolio"],
    painTags: ["booking conversion", "remote guests", "portfolio scale", "listing quality"],
    source: "https://matterport.com/industries/case-studies/vacasa-vacation-rental-3D-tours",
  },
  {
    id: "wesbuilt-rework",
    customer: "Wesbuilt Construction (NYC general contractor)",
    verticals: ["construction-aec"],
    headline: "Matterport scans paired with Procore cut errors, rework and delays",
    metrics: ["61% fewer document errors and omissions", "36% fewer rework hours", "22% shorter project duration", "17% fewer claims and litigation"],
    painTags: ["rework", "RFIs", "schedule slip", "claims", "remote walkthroughs", "Procore"],
    source:
      "https://matterport.com/industries/case-studies/wesbuilt-construction-streamlining-projects-with-matterport-and-procore",
  },
  {
    id: "bmo-branch-rebrand",
    customer: "BMO",
    verticals: ["facilities-multisite", "commercial-real-estate", "retail"],
    headline: "Digital twins of 500+ acquired branches replaced repeat site visits",
    metrics: ["$500K+ saved in 15 months on travel and site visits", "~6,000 survey hours recovered (~12 per branch)", "500+ locations captured in three months"],
    painTags: ["multi-site", "site visits", "missing floor plans", "acquisition integration", "rebrand", "asset audits"],
    source:
      "https://matterport.com/industries/case-studies/bmo-leverages-matterports-digital-twins-to-streamline-acquisition-work-and",
  },
  {
    id: "ati-trueplan",
    customer: "ATI Restoration",
    verticals: ["insurance-restoration"],
    headline: "3D scan + TruePlan for Xactimate sped up loss estimates",
    metrics: ["Loss estimates 4x faster", "5x sketch-time productivity", "33% more accurate sketches"],
    painTags: ["claims cycle time", "estimating", "Xactimate", "adjuster travel", "catastrophe surge"],
    source:
      "https://matterport.com/news/industry-first-matterport-trueplantm-xactimate-accelerates-property-loss-estimation-4x-help",
  },
  {
    id: "scanspace-dilapidation",
    customer: "Scan Space",
    verticals: ["construction-aec", "commercial-real-estate", "insurance-restoration"],
    headline: "Dilapidation reports from hours to minutes with digital twins",
    metrics: ["~30% less dilapidation reporting time"],
    painTags: ["condition reports", "documentation", "disputes", "inspections"],
    source:
      "https://matterport.com/industries/case-studies/scan-space-cut-dilapidation-reporting-time-from-hours-to-minutes-with-matterport-digital-twins",
  },
];

const byId = new Map(PROOF_POINTS.map((p) => [p.id, p]));
export const getProofPoint = (id: string) => byId.get(id);

/** Vertical match first, then tag overlap with the query. Small KB, so no vector DB needed yet. */
export function findProofPoints(vertical: Vertical, query = "", limit = 4): ProofPoint[] {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const score = (p: ProofPoint) =>
    (p.verticals.includes(vertical) ? 10 : 0) +
    words.filter((w) => p.painTags.some((t) => t.toLowerCase().includes(w))).length;
  return [...PROOF_POINTS].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
