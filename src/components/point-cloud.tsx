"use client";

import { useEffect, useRef } from "react";

/**
 * A room as a sparse point cloud inside a "capture viewport". Drag to orbit
 * (with inertia). Idle: a scan plane sweeps on loop. While the agent runs,
 * `progress` (0..1) drives how much of the room has been captured, so the
 * viewport doubles as a progress indicator. Plain canvas, no 3D library.
 */
type P = [number, number, number];

function buildRoom(): P[] {
  const pts: P[] = [];
  const j = () => (Math.random() - 0.5) * 0.018;
  const W = 2.2, D = 1.6, H = 1.1;
  for (let x = -W; x <= W; x += 0.085) for (let z = -D; z <= D; z += 0.085) pts.push([x + j(), -H, z + j()]);
  for (let x = -W; x <= W; x += 0.11)
    for (let y = -H; y <= H; y += 0.11) if (!(x > 0.3 && x < 1.4 && y > -0.1 && y < 0.7)) pts.push([x + j(), y + j(), -D]);
  for (let z = -D; z <= D; z += 0.11)
    for (let y = -H; y <= H; y += 0.11) if (!(z > 0.2 && z < 0.9 && y < 0.5)) pts.push([-W, y + j(), z + j()]);
  // Window frame and door frame edges, denser so the openings read clearly.
  for (let t = 0; t <= 1; t += 0.02) {
    pts.push([0.3 + t * 1.1, -0.1, -D], [0.3 + t * 1.1, 0.7, -D], [0.3, -0.1 + t * 0.8, -D], [1.4, -0.1 + t * 0.8, -D]);
    pts.push([-W, -H + t * 1.6, 0.2], [-W, -H + t * 1.6, 0.9], [-W, 0.5, 0.2 + t * 0.7]);
  }
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, s = 0.06) => {
    for (let x = -sx; x <= sx; x += s) for (let z = -sz; z <= sz; z += s) pts.push([cx + x, cy + sy, cz + z]);
    for (let x = -sx; x <= sx; x += s) for (let y = -sy; y <= sy; y += s) pts.push([cx + x, cy + y, cz + sz], [cx + x, cy + y, cz - sz]);
    for (let z = -sz; z <= sz; z += s) for (let y = -sy; y <= sy; y += s) pts.push([cx + sx, cy + y, cz + z]);
  };
  box(0.7, -0.78, 0.35, 0.6, 0.04, 0.38); // table top
  for (const [dx, dz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) box(0.7 + dx, -0.96, 0.35 + dz, 0.025, 0.14, 0.025, 0.04);
  box(-1.35, -0.85, -1.05, 0.62, 0.25, 0.32); // sofa base
  box(-1.35, -0.42, -1.3, 0.62, 0.2, 0.07); // sofa back
  box(1.7, -0.3, -1.45, 0.3, 0.8, 0.12); // shelf
  return pts;
}

export type CloudStats = { points: number; captured: number };

export function PointCloud({
  progress,
  onStats,
  className = "",
}: {
  progress?: number;
  onStats?: (s: CloudStats) => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const statsRef = useRef(onStats);
  useEffect(() => {
    progressRef.current = progress;
    statsRef.current = onStats;
  });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const pts = buildRoom();
    // Capture order: sweep across x, like a scanner moving through the room.
    const order = pts.map((p) => (p[0] + 2.3) / 4.6);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = true, t = 0, w = 0, h = 0, dpr = 1;
    let yaw = 0.6, pitch = 0.38, vYaw = 0, vPitch = 0;
    let dragging = false, lastX = 0, lastY = 0, shown = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = -Math.sin(pitch);
      const scale = Math.min(w / 6.4, h / 4.6);
      const p = progressRef.current;
      const live = p !== undefined;
      const scan = live ? p! : (t * 0.22) % 1.25;
      let captured = 0;

      for (let i = 0; i < pts.length; i++) {
        const [x, y, z] = pts[i];
        const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
        const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        const persp = 7 / (7 + z2);
        const px = w / 2 + x1 * scale * persp, py = h / 2 - y1 * scale * persp - h * 0.02;
        const depth = Math.max(0.12, Math.min(1, (1.8 - z2) / 3.2));
        const d = scan - order[i];
        if (live && d < 0) {
          ctx.fillStyle = `rgba(236,235,230,${depth * 0.07})`;
          ctx.fillRect(px, py, persp, persp);
          continue;
        }
        captured++;
        const edge = d >= 0 && d < 0.035;
        ctx.fillStyle = edge ? `rgba(124,242,200,${0.55 + depth * 0.45})` : `rgba(236,235,230,${depth * (live ? 0.5 : 0.4)})`;
        const r = (edge ? 1.6 : 1.05) * persp;
        ctx.fillRect(px, py, r, r);
      }
      const c = live ? captured : pts.length;
      if (c !== shown) {
        shown = c;
        statsRef.current?.({ points: pts.length, captured: c });
      }
    };

    const loop = () => {
      t += 1 / 60;
      if (!dragging) {
        // Inertia from the last drag, then drift back to a slow sway that always looks into the open side of the room.
        yaw += vYaw;
        pitch += vPitch;
        vYaw *= 0.94;
        vPitch *= 0.9;
        const idleYaw = 0.55 + Math.sin(t * 0.18) * 0.4;
        yaw += (idleYaw - yaw) * 0.006;
        pitch += (0.38 - pitch) * 0.01;
      }
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      vYaw = (e.clientX - lastX) * 0.006;
      vPitch = (e.clientY - lastY) * 0.004;
      yaw += vYaw;
      pitch = Math.max(0.05, Math.min(1.1, pitch + vPitch));
      lastX = e.clientX;
      lastY = e.clientY;
      if (reduced) draw();
    };
    const up = () => (dragging = false);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    window.addEventListener("resize", resize);
    statsRef.current?.({ points: pts.length, captured: pts.length });
    draw();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-label="3D point cloud of a room. Drag to orbit." className={`h-full w-full cursor-grab touch-none active:cursor-grabbing ${className}`} />;
}
