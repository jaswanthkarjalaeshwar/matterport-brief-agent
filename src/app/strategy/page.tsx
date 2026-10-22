import type { Metadata } from "next";
import { GtmMap } from "./gtm-map";

export const metadata: Metadata = { title: "AI GTM Map · Pre-call Brief Agent" };

export default function StrategyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 sm:px-6 md:py-20">
      <p className="label">Point of view · draft</p>
      <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.02em] sm:text-5xl">
        One AI layer across the revenue motion, <span className="font-serif font-normal italic text-muted">not six disconnected tools.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
        The brief agent is one stage. This is how I&apos;d sequence the rest, from prospecting through renewal: what each tool does,
        how adoption and pipeline impact get measured, and where a human stays in charge. Built from the public job description,
        so it&apos;s a starting hypothesis to pressure-test with the team.
      </p>
      <div className="mt-12">
        <GtmMap />
      </div>
    </main>
  );
}
