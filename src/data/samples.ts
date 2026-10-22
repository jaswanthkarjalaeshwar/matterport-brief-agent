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

const baseChecks = (n: number, fit = "strong"): GuardrailCheck[] => [
  { id: "fit", label: "Account fit checked before pitching", status: "pass", note: `${fit} fit` },
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
      fit: { level: "strong", reason: "Its agents market homes, which is the original 3D tour use case." },
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
      fit: { level: "strong", reason: "A general contractor documenting active job sites is a core construction use case." },
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
      fit: { level: "strong", reason: "It manages many physical sites for clients, the multi-site documentation pattern." },
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
  {
    slug: "marriott",
    company: "Marriott International",
    domain: "marriott.com",
    tag: "Hospitality",
    tools: [
      { id: "m1", tool: "read_page", summary: "Reading marriott.com", ms: 1720 },
      { id: "m2", tool: "web_search", summary: "Searching “Marriott hotel renovations meeting space sales”", ms: 2340 },
      { id: "m3", tool: "lookup_proof_points", summary: "Matching proof points · hospitality", ms: 3 },
    ],
    brief: {
      fit: { level: "strong", reason: "Hotels sell rooms and event space that guests and planners choose sight unseen." },
      snapshot: {
        oneLiner: "A global hotel company operating and franchising properties across many brands, from select-service to luxury.",
        footprint: "Thousands of properties worldwide across many brands; owned, managed and franchised.",
        vertical: "hospitality",
        verticalReason: "Booking decisions for rooms and event space are made online before anyone visits, which is where tours change conversion.",
      },
      painHypotheses: [
        {
          title: "Event planners need to see the space first",
          why: "Group and meeting sales depend on planners judging ballrooms and breakout rooms, often from another city.",
          proofPointId: "vacasa-conversion",
          confidence: "high",
        },
        {
          title: "Renovation and brand-standard checks across properties",
          why: "Brand standards and renovation programs mean repeated property visits by design and quality teams.",
          proofPointId: "bmo-branch-rebrand",
          confidence: "medium",
        },
      ],
      discoveryQuestions: [
        "How do group sales teams show event space to planners who can't do a site visit?",
        "Which property-level decisions still need someone to fly in and walk the building?",
        "Who owns listing media for franchised properties: the brand or the owner?",
      ],
      likelyObjections: [
        {
          objection: "Each property is owned by a different company.",
          response: "That's why a brand-level standard helps: one capture spec and vendor, paid per property, with the brand setting the bar.",
        },
      ],
      openingLine: "When a planner is choosing between two of your hotels for an event, what do they look at before they decide?",
      sources: [{ title: "marriott.com", url: "https://www.marriott.com/" }],
    },
    checks: baseChecks(1),
  },
  {
    slug: "travelers",
    company: "Travelers",
    domain: "travelers.com",
    tag: "Property insurance",
    tools: [
      { id: "v1", tool: "read_page", summary: "Reading travelers.com", ms: 1580 },
      { id: "v2", tool: "web_search", summary: "Searching “Travelers property claims virtual inspection”", ms: 2190 },
      { id: "v3", tool: "lookup_proof_points", summary: "Matching proof points · insurance-restoration", ms: 3 },
    ],
    brief: {
      fit: { level: "strong", reason: "Property claims and underwriting both depend on knowing what a building looks like." },
      snapshot: {
        oneLiner: "A large U.S. property and casualty insurer covering homes, businesses and commercial property.",
        footprint: "National claims operation for personal and commercial property; adjuster model to confirm.",
        vertical: "insurance-restoration",
        verticalReason: "Every property claim needs measurements and documentation of the loss, today often done by sending someone on site.",
      },
      painHypotheses: [
        {
          title: "Slow estimates after a property loss",
          why: "Property claims wait on site measurement and sketching before an estimate can be written.",
          proofPointId: "ati-trueplan",
          confidence: "high",
        },
        {
          title: "Adjuster capacity during catastrophe events",
          why: "Storm seasons create claim surges far beyond what field adjusters can visit quickly.",
          proofPointId: "ati-trueplan",
          confidence: "medium",
        },
        {
          title: "Disputes about pre-loss condition",
          why: "Commercial claims often turn on what the property looked like before the loss.",
          proofPointId: "scanspace-dilapidation",
          confidence: "low",
        },
      ],
      discoveryQuestions: [
        "How long does it take from first notice of loss to a written estimate on a typical property claim?",
        "When a storm hits, how do you decide which claims get a field visit?",
        "Do your contractors and restoration partners already capture sites, and do you receive that data?",
      ],
      likelyObjections: [
        {
          objection: "We already use desk adjusting with photos.",
          response: "Photos show damage; a scan also gives measurements for the estimate, which is the part that usually needs a visit.",
        },
      ],
      openingLine: "On a property claim, what's the step that most often makes you send someone to the house?",
      sources: [{ title: "travelers.com", url: "https://www.travelers.com/" }],
    },
    checks: baseChecks(1),
  },
  {
    slug: "target",
    company: "Target",
    domain: "target.com",
    tag: "Multi-site retail",
    tools: [
      { id: "g1", tool: "read_page", summary: "Reading corporate.target.com", ms: 1690 },
      { id: "g2", tool: "web_search", summary: "Searching “Target store remodel program”", ms: 2050 },
      { id: "g3", tool: "lookup_proof_points", summary: "Matching proof points · retail", ms: 3 },
    ],
    brief: {
      fit: { level: "possible", reason: "Large store fleet with remodel programs, but the buyer is facilities, not marketing." },
      snapshot: {
        oneLiner: "A U.S. general merchandise retailer operating stores nationwide alongside its online business.",
        footprint: "Stores across the U.S. plus distribution centers; remodel volume to confirm.",
        vertical: "retail",
        verticalReason: "Store remodels, fixture planning and facilities audits across many locations are the multi-site documentation pattern.",
      },
      painHypotheses: [
        {
          title: "Remodel planning without accurate store layouts",
          why: "Remodel programs across many stores need current floor plans and fixture positions, which drift from drawings.",
          proofPointId: "bmo-branch-rebrand",
          confidence: "medium",
        },
        {
          title: "Facilities audits need a trip to every store",
          why: "Equipment and compliance checks at store level are usually done on site.",
          proofPointId: "bmo-branch-rebrand",
          confidence: "low",
        },
      ],
      discoveryQuestions: [
        "How current are the floor plans your remodel and store-design teams start from?",
        "Which store visits are just to look at a space, not to do work in it?",
        "Who owns store documentation today: real estate, facilities or store design?",
      ],
      likelyObjections: [
        {
          objection: "We have CAD for every store.",
          response: "Then the question is how far the stores have drifted from it. A capture shows the store as it is today, fixtures included.",
        },
      ],
      openingLine: "When store design starts a remodel, how much do they trust the existing floor plan?",
      sources: [{ title: "corporate.target.com", url: "https://corporate.target.com/" }],
    },
    checks: baseChecks(1, "possible"),
  },
  {
    slug: "stripe",
    company: "Stripe",
    domain: "stripe.com",
    tag: "Payments software · fit test",
    tools: [
      { id: "p1", tool: "read_page", summary: "Reading stripe.com", ms: 1450 },
      { id: "p2", tool: "web_search", summary: "Searching “Stripe offices facilities”", ms: 1980 },
    ],
    brief: {
      fit: {
        level: "poor",
        reason: "Stripe sells payments software; its product and customers don't depend on physical spaces.",
      },
      snapshot: {
        oneLiner: "A payments and financial infrastructure company that businesses use to accept and manage online payments.",
        footprint: "Offices in several countries; no property portfolio tied to its product.",
        vertical: "other",
        verticalReason: "None of Matterport's verticals apply. The only physical footprint is its own offices.",
      },
      painHypotheses: [],
      discoveryQuestions: [
        "Is there a team that manages your offices or real estate who'd own a space-documentation need?",
        "Do any of your customers' platforms list physical spaces where a 3D tour integration could matter?",
        "Would a partnership conversation fit better than a direct sale?",
      ],
      likelyObjections: [
        {
          objection: "We don't need this.",
          response: "Agreed, as a direct customer this probably isn't a fit. Worth a short check on partnerships, then move on.",
        },
      ],
      openingLine: "I'll be upfront: I'm not sure we're a fit for Stripe directly, so I'd like to check one partnership angle and then let you go.",
      sources: [{ title: "stripe.com", url: "https://stripe.com/" }],
    },
    checks: [
      { id: "fit", label: "Account fit checked before pitching", status: "flag", note: "Poor fit. Hypotheses withheld so the rep doesn't force a pitch." },
      { id: "grounding", label: "Every pain hypothesis cites a real customer result", status: "pass", note: "No hypotheses to check" },
      { id: "no-invented-stats", label: "No statistics outside the sourced proof points", status: "pass" },
      { id: "tone", label: "Plain, specific language (no hype words)", status: "pass" },
      { id: "sources", label: "Research is linked so the rep can verify it", status: "pass", note: "1 source" },
    ],
  },
];

export const getSample = (slug: string) => SAMPLES.find((s) => s.slug === slug);
