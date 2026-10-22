"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const LINKS = [
  { href: "/", label: "Brief agent", short: "Agent" },
  { href: "/strategy", label: "AI GTM map", short: "GTM map" },
  { href: "/how", label: "How it's built", short: "How" },
];

export function SiteNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid size-5 place-items-center">
            <span className="absolute inset-0 rounded-[3px] border border-scan/60" />
            <span className="size-1.5 rounded-full bg-scan" />
          </span>
          <span className="hidden text-sm font-medium tracking-tight min-[400px]:inline">Pre-call Brief</span>
          <span className="label hidden sm:inline">MVP · v0.1</span>
        </Link>
        <ul className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative rounded-md px-2.5 py-1.5 text-[13px] transition-colors sm:px-3 ${active ? "text-text" : "text-muted hover:text-text"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-surface-2 ring-1 ring-line"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative whitespace-nowrap"><span className="sm:hidden">{l.short}</span><span className="hidden sm:inline">{l.label}</span></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
