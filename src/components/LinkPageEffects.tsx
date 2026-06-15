"use client";

import { useEffect, useRef } from "react";

/**
 * Background overlay effects for the link page. Renders behind page content and
 * never intercepts clicks (pointer-events: none).
 *
 * Cheap effects (grain/scanlines/vignette/aurora/pulse) are pure CSS. The
 * particle effects (rain/snow/static/starfield) share ONE canvas and ONE
 * requestAnimationFrame loop, with:
 *   - particle counts capped + scaled to viewport area
 *   - devicePixelRatio capped at 2
 *   - the loop paused while the tab is hidden
 *   - prefers-reduced-motion honored (renders a single static frame, no loop)
 */
export default function LinkPageEffects({
  effect,
  fg,
}: {
  effect: string;
  fg: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isCanvas =
    effect === "rain" ||
    effect === "snow" ||
    effect === "static" ||
    effect === "starfield";

  useEffect(() => {
    if (!isCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const rgb = hexToRgb(fg);
    let raf = 0;
    let lastStatic = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    type P = { x: number; y: number; vy: number; vx: number; r: number; a: number };
    let particles: P[] = [];

    function seedParticles() {
      const area = w * h;
      if (effect === "rain") {
        const n = Math.min(260, Math.round(area / 9000));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0.6 + Math.random() * 0.8,
          vy: 9 + Math.random() * 9,
          r: 8 + Math.random() * 12, // streak length
          a: 0.12 + Math.random() * 0.25,
        }));
      } else if (effect === "snow") {
        const n = Math.min(180, Math.round(area / 12000));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: -0.4 + Math.random() * 0.8,
          vy: 0.4 + Math.random() * 1.1,
          r: 1 + Math.random() * 2.2,
          a: 0.25 + Math.random() * 0.5,
        }));
      } else if (effect === "starfield") {
        const n = Math.min(220, Math.round(area / 8000));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          r: Math.random() * 1.4,
          a: 0.2 + Math.random() * 0.7,
        }));
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function drawStatic() {
      // render noise at reduced resolution, then scale up — keeps it cheap
      const sw = Math.max(1, Math.round(w / 3));
      const sh = Math.max(1, Math.round(h / 3));
      const img = ctx!.createImageData(sw, sh);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 22; // low alpha so it reads as an overlay
      }
      // paint via a temp canvas so we can scale with smoothing off
      const tmp = document.createElement("canvas");
      tmp.width = sw;
      tmp.height = sh;
      tmp.getContext("2d")!.putImageData(img, 0, 0);
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, w, h);
      ctx!.drawImage(tmp, 0, 0, w, h);
    }

    function frame(t: number) {
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (effect === "static") {
        if (t - lastStatic > 50) {
          // ~20fps is plenty for static
          drawStatic();
          lastStatic = t;
        }
      } else if (effect === "starfield") {
        ctx!.clearRect(0, 0, w, h);
        for (const p of particles) {
          // gentle twinkle
          const a = p.a * (0.6 + 0.4 * Math.sin(t / 600 + p.x));
          ctx!.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fill();
        }
      } else if (effect === "rain") {
        ctx!.clearRect(0, 0, w, h);
        ctx!.lineWidth = 1;
        for (const p of particles) {
          ctx!.strokeStyle = `rgba(${rgb},${p.a.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(p.x - p.vx, p.y - p.r);
          ctx!.stroke();
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h) {
            p.y = -p.r;
            p.x = Math.random() * w;
          }
        }
      } else if (effect === "snow") {
        ctx!.clearRect(0, 0, w, h);
        for (const p of particles) {
          ctx!.fillStyle = `rgba(${rgb},${p.a.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fill();
          p.x += p.vx + Math.sin((p.y + t / 400) / 40) * 0.3;
          p.y += p.vy;
          if (p.y > h) {
            p.y = -p.r;
            p.x = Math.random() * w;
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    if (reduced) {
      // single static frame, no animation loop
      if (effect === "static") drawStatic();
      else frameOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    function frameOnce() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx!.fillStyle = `rgba(${rgb},${p.a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0.6, p.r), 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [effect, fg, isCanvas]);

  if (isCanvas) {
    return (
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    );
  }

  // ---- CSS-only effects ----
  if (effect === "grain") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    );
  }

  if (effect === "scanlines") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0) 4px)",
        }}
      />
    );
  }

  if (effect === "vignette") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    );
  }

  if (effect === "aurora") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="lp-aurora-layer absolute -inset-1/4 opacity-40 blur-3xl"
          style={{
            background: `radial-gradient(40% 40% at 30% 30%, rgba(${hexToRgb(
              fg
            )},0.6), transparent 70%), radial-gradient(45% 45% at 70% 60%, rgba(${hexToRgb(
              fg
            )},0.35), transparent 70%)`,
          }}
        />
      </div>
    );
  }

  if (effect === "pulse") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="lp-pulse-layer absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${hexToRgb(
              fg
            )},0.5), transparent 70%)`,
          }}
        />
      </div>
    );
  }

  return null;
}

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
