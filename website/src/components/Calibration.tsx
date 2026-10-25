"use client";

import { motion } from "motion/react";
import { useState } from "react";
import results from "@/data/results.json";
import { calibrationStats } from "@/data/site";
import { Card, Reveal, Section, Segmented } from "./ui";

const W = 400, H = 320, pad = { l: 44, r: 14, t: 14, b: 40 };
const sx = (v: number, lo = 0, hi = 1) => pad.l + ((v - lo) / (hi - lo)) * (W - pad.l - pad.r);
const sy = (v: number, lo = 0, hi = 1) => H - pad.b - ((v - lo) / (hi - lo)) * (H - pad.t - pad.b);
const seedColors: Record<string, string> = { "42": "var(--color-indigo)", "123": "var(--color-gold)", "2026": "var(--color-teal)" };

function Axes({ xLabel, yLabel, yTicks, yLo = 0, yHi = 1, xLo = 0, xHi = 1 }: { xLabel: string; yLabel: string; yTicks: number[]; yLo?: number; yHi?: number; xLo?: number; xHi?: number }) {
  const xt = [0, 0.25, 0.5, 0.75, 1].map((f) => xLo + f * (xHi - xLo));
  return (
    <g>
      {xt.map((t) => (
        <g key={`x${t}`}>
          <line x1={sx(t, xLo, xHi)} x2={sx(t, xLo, xHi)} y1={sy(yLo, yLo, yHi)} y2={sy(yHi, yLo, yHi)} stroke="var(--color-line)" />
          <text x={sx(t, xLo, xHi)} y={H - pad.b + 18} fontSize="10" textAnchor="middle" fill="var(--color-faint)">{t.toFixed(2)}</text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={sx(xLo, xLo, xHi)} x2={sx(xHi, xLo, xHi)} y1={sy(t, yLo, yHi)} y2={sy(t, yLo, yHi)} stroke="var(--color-line)" />
          <text x={pad.l - 8} y={sy(t, yLo, yHi) + 3} fontSize="10" textAnchor="end" fill="var(--color-faint)">{t.toFixed(1)}</text>
        </g>
      ))}
      <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--color-muted)">{xLabel}</text>
      <text transform={`translate(12 ${(pad.t + H - pad.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="var(--color-muted)">{yLabel}</text>
    </g>
  );
}

function CalibrationChart() {
  const [ver, setVer] = useState<"platt" | "raw">("platt");
  const data = results.calibration[ver] as Record<string, number[][]>;
  return (
    <Card className="h-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-ink">Calibration</h3>
          <p className="text-xs text-muted">Ensemble · one curve per seed</p>
        </div>
        <Segmented value={ver} onChange={setVer} options={[{ value: "raw", label: "Raw" }, { value: "platt", label: "Platt" }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
        <Axes xLabel="Mean predicted probability" yLabel="Observed cancer fraction" yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]} />
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--color-faint)" strokeDasharray="4 4" />
        {Object.entries(data).map(([seed, pts]) => (
          <g key={seed + ver}>
            <motion.path
              d={pts.map(([a, b], i) => `${i ? "L" : "M"}${sx(a)},${sy(b)}`).join("")}
              fill="none"
              stroke={seedColors[seed]}
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            {pts.map(([a, b], i) => (
              <circle key={i} cx={sx(a)} cy={sy(b)} r={2.6} fill="white" stroke={seedColors[seed]} strokeWidth={1.5} />
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        {Object.keys(seedColors).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: seedColors[s] }} />Seed {s}</span>
        ))}
      </div>
    </Card>
  );
}

function DecisionCurve() {
  const pts = results.dca as number[][];
  const lo = -0.05, hi = 0.4;
  const xLo = 0.05, xHi = 0.8;
  const clip = (v: number) => Math.max(lo, Math.min(hi, v));
  const line = (idx: number) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0], xLo, xHi)},${sy(clip(p[idx]), lo, hi)}`).join("");
  return (
    <Card className="h-full p-6">
      <h3 className="font-serif text-2xl text-ink">Decision curve</h3>
      <p className="text-xs text-muted">Net benefit vs treat-all / treat-none · Platt-calibrated · seed mean</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
        <Axes xLabel="Threshold probability" yLabel="Net benefit" yTicks={[0, 0.1, 0.2, 0.3, 0.4]} yLo={lo} yHi={hi} xLo={xLo} xHi={xHi} />
        <line x1={sx(xLo, xLo, xHi)} x2={sx(xHi, xLo, xHi)} y1={sy(0, lo, hi)} y2={sy(0, lo, hi)} stroke="var(--color-ink-2)" strokeOpacity={0.4} />
        <path d={line(2)} fill="none" stroke="var(--color-faint)" strokeWidth={1.6} strokeDasharray="5 4" />
        <motion.path d={line(1)} fill="none" stroke="var(--color-rose)" strokeWidth={2.6} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-rose" />Ensemble</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-faint" />Treat all</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ink-2/40" />Treat none</span>
      </div>
    </Card>
  );
}

export function Calibration() {
  return (
    <Section
      id="calibration"
      eyebrow="Beyond AUC"
      title="Probabilities you can read, not just rank."
      lede="Platt scaling is fitted only on inner-validation predictions. It brings predicted risk close to observed frequency, and the ensemble shows positive net benefit over thresholds 0.05–0.80 in all three seeds."
      className="bg-paper-2/50"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[
          { k: "Brier score", v: calibrationStats.brier },
          { k: "Expected calibration error", v: calibrationStats.ece },
        ].map((m) => (
          <Reveal key={m.k}>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-6 py-5">
              <span className="text-sm text-ink-2">{m.k}</span>
              <span className="num font-mono text-sm">
                <span className="text-faint line-through">{m.v[0].toFixed(4)}</span>
                <span className="mx-2 text-faint">→</span>
                <span className="text-lg font-semibold text-teal">{m.v[1].toFixed(4)}</span>
              </span>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><CalibrationChart /></Reveal>
        <Reveal delay={0.08}><DecisionCurve /></Reveal>
      </div>
      <p className="mt-6 text-xs text-faint">Internal to Mini-DDSM — not evidence of clinical effectiveness until reproduced on an independent cohort.</p>
    </Section>
  );
}
