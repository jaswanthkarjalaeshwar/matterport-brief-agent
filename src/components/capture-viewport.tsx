"use client";

import { useState } from "react";
import { PointCloud, type CloudStats } from "./point-cloud";

/** The hero instrument: a framed scan with a HUD that reads like capture software. */
export function CaptureViewport({ progress, status }: { progress?: number; status: string }) {
  const [stats, setStats] = useState<CloudStats>({ points: 0, captured: 0 });
  const pct = stats.points ? Math.round((stats.captured / stats.points) * 100) : 0;
  const live = progress !== undefined;

  return (
    <div className="ticks relative h-full min-h-[300px] overflow-hidden border border-line bg-[radial-gradient(ellipse_at_50%_60%,rgba(124,242,200,0.05),transparent_65%)]">
      <div className="absolute inset-0">
        <PointCloud progress={progress} onStats={setStats} />
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-mono text-[10px] tracking-wider text-faint uppercase">
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${live ? "animate-pulse bg-scan" : "bg-scan/60"}`} />
          {live ? "Capturing" : "Viewport"} · room_01
        </span>
        <span className="tabular-nums">{stats.captured.toLocaleString()} / {stats.points.toLocaleString()} pts</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-end justify-between font-mono text-[10px] tracking-wider text-faint uppercase">
          <span className="max-w-[60%] truncate normal-case tracking-normal text-muted">{status}</span>
          <span className="tabular-nums">{live ? `${pct}%` : "drag to orbit"}</span>
        </div>
        <div className="mt-2 h-px w-full bg-line">
          <div className="h-px bg-scan transition-[width] duration-500" style={{ width: `${live ? pct : 0}%` }} />
        </div>
      </div>
    </div>
  );
}
