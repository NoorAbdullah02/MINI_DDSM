"use client";

import { motion } from "motion/react";
import { useState } from "react";
import results from "@/data/results.json";
import { comparison, operatingPoints, seedTable } from "@/data/site";
import { Card, Reveal, Section, Segmented } from "./ui";

const series = [
  { key: "ensemble", label: "Equal-average ensemble", auc: "0.891", color: "var(--color-rose)" },
  { key: "effnet", label: "EfficientNet-B4", auc: "0.882", color: "var(--color-gold)" },
  { key: "convnext", label: "ConvNeXtV2-Tiny", auc: "0.857", color: "var(--color-indigo)" },
] as const;

function RocChart() {
  const [hover, setHover] = useState<number | null>(null);
  const [on, setOn] = useState<Record<string, boolean>>({ ensemble: true, effnet: true, convnext: true });
  const W = 420, H = 380, pad = { l: 44, r: 14, t: 14, b: 40 };
  const x = (v: number) => pad.l + v * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - v * (H - pad.t - pad.b);
  const grid = results.rocGrid;
  const path = (k: keyof typeof results.roc) =>
    results.roc[k].map((t, i) => `${i ? "L" : "M"}${x(grid[i]).toFixed(1)},${y(t).toFixed(1)}`).join("");

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-ink">ROC curve</h3>
          <p className="text-xs text-muted">Mean over three seeds · patient-group level</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => setOn({ ...on, [s.key]: !on[s.key] })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${on[s.key] ? "border-line-2 bg-card text-ink" : "border-line text-faint"}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: on[s.key] ? s.color : "var(--color-line-2)" }} />
            {s.label} <span className="num font-mono font-semibold">{s.auc}</span>
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full touch-none"
        onMouseLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const fx = ((e.clientX - r.left) / r.width) * W;
          const v = (fx - pad.l) / (W - pad.l - pad.r);
          setHover(v >= 0 && v <= 1 ? Math.round(v * (grid.length - 1)) : null);
        }}
      >
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke="var(--color-line)" />
            <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
            <text x={x(t)} y={H - pad.b + 18} textAnchor="middle" fontSize="10" fill="var(--color-faint)">{t}</text>
            <text x={pad.l - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--color-faint)">{t}</text>
          </g>
        ))}
        <text x={(x(0) + x(1)) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--color-muted)">False-positive rate</text>
        <text transform={`translate(12 ${(y(0) + y(1)) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="var(--color-muted)">True-positive rate</text>
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-faint)" strokeDasharray="4 4" />
        <path d={`${path("ensemble")}L${x(1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--color-rose)" opacity={on.ensemble ? 0.06 : 0} />
        {[...series].reverse().map((s) =>
          on[s.key] ? (
            <motion.path
              key={s.key}
              d={path(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.key === "ensemble" ? 2.6 : 1.8}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(grid[hover])} x2={x(grid[hover])} y1={y(0)} y2={y(1)} stroke="var(--color-ink-2)" strokeOpacity={0.25} />
            {series.map((s) =>
              on[s.key] ? (
                <circle key={s.key} cx={x(grid[hover])} cy={y(results.roc[s.key][hover])} r={4} fill="white" stroke={s.color} strokeWidth={2} />
              ) : null,
            )}
            <g transform={`translate(${Math.min(x(grid[hover]) + 10, W - 150)} ${y(0.35)})`}>
              <rect width={140} height={78} rx={10} fill="white" stroke="var(--color-line)" />
              <text x={10} y={18} fontSize="10" fill="var(--color-muted)">FPR {grid[hover].toFixed(2)} → TPR</text>
              {series.map((s, i) => (
                <text key={s.key} x={10} y={36 + i * 15} fontSize="11" fill={s.color} fontWeight={600}>
                  {s.label.split(" ")[0]} {results.roc[s.key][hover].toFixed(3)}
                </text>
              ))}
            </g>
          </g>
        )}
      </svg>
    </Card>
  );
}

function ComparisonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-6">
        <h3 className="font-serif text-2xl text-ink">Ablation: does the ensemble help?</h3>
        <p className="text-xs text-muted">Table IV · mean of three seeds · identical outer-test TTA</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-y border-line bg-paper-2/60 text-xs text-muted">
              <th className="px-6 py-3 text-left font-medium">Metric</th>
              {comparison.methods.map((m, i) => (
                <th key={m} className={`px-3 py-3 text-right font-medium ${i === 3 ? "text-rose" : ""}`}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => {
              const best = Math.max(...r.values);
              return (
                <tr key={r.metric} className="border-b border-line/70 last:border-0">
                  <td className="px-6 py-3 font-medium text-ink-2">{r.metric}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`num px-3 py-3 text-right font-mono ${i === 3 ? "bg-rose-soft/40" : ""}`}>
                      <span className={v === best ? "font-semibold text-ink" : "text-muted"}>{v.toFixed(4)}</span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-6 py-4 text-xs leading-relaxed text-muted">
        The fixed 50/50 average is best on five of six metrics. EfficientNet-B4 alone stays more sensitive at 0.5 — the ensemble improves discrimination without dominating every operating point.
      </p>
    </Card>
  );
}

function OperatingPoint() {
  const [mode, setMode] = useState<"default" | "youden">("default");
  const op = operatingPoints[mode];
  const metrics = [
    ["Accuracy", op.accuracy],
    ["Sensitivity", op.sensitivity],
    ["Specificity", op.specificity],
    ["PPV", op.ppv],
    ["NPV", op.npv],
  ] as const;
  const labels = ["Not-Cancer", "Cancer"];

  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-serif text-2xl text-ink">Choose the operating point</h3>
          <p className="text-xs text-muted">Thresholds come only from inner-validation patients</p>
        </div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "default", label: "Threshold 0.5" },
            { value: "youden", label: "Train-side Youden" },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
        <div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-xs">
            <div />
            {labels.map((l) => (
              <div key={l} className="pb-1 text-center text-muted">Pred. {l}</div>
            ))}
            {op.cm.map((row, r) => (
              <div key={r} className="contents">
                <div className="flex items-center pr-2 text-right text-muted">True<br />{labels[r]}</div>
                {row.map((v, c) => {
                  const correct = r === c;
                  return (
                    <motion.div
                      key={`${mode}${r}${c}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24, delay: (r * 2 + c) * 0.04 }}
                      className="grid h-24 w-28 place-items-center rounded-2xl sm:w-32"
                      style={{
                        background: correct
                          ? `color-mix(in srgb, var(--color-teal) ${Math.round(v * 70)}%, white)`
                          : `color-mix(in srgb, var(--color-rose) ${Math.round(v * 120 + 8)}%, white)`,
                      }}
                    >
                      <span className={`num font-serif text-3xl ${correct && v > 0.6 ? "text-white" : "text-ink"}`}>{(v * 100).toFixed(1)}%</span>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 max-w-xs text-xs text-faint">Class-normalised rates averaged over three seeds.</p>
        </div>

        <div>
          <div className="space-y-4">
            {metrics.map(([k, [v, ci]]) => (
              <div key={k}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="text-ink-2">{k}</span>
                  <span>
                    <span className="num font-mono font-semibold text-ink">{v.toFixed(3)}</span>
                    <span className="ml-2 font-mono text-xs text-faint">({ci})</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-paper-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: k === "Sensitivity" ? "var(--color-rose)" : "var(--color-ink-2)" }}
                    animate={{ width: `${v * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-rose-soft/60 p-4 text-sm text-rose-deep">
            Cancer groups missed per seed:{" "}
            <span className="num font-mono font-semibold">{op.missed.join(" · ")}</span>
            <span className="text-rose-deep/70"> of 899</span>
            {mode === "youden" && <span className="block text-xs text-rose-deep/80">≈ 44% fewer missed cancers than at 0.5, at the cost of specificity.</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function SeedStrip() {
  const lo = 0.84, hi = 0.91;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const rows = [
    { k: "ensemble", label: "Ensemble", color: "var(--color-rose)" },
    { k: "effnet", label: "EfficientNet-B4", color: "var(--color-gold)" },
    { k: "convnext", label: "ConvNeXtV2-Tiny", color: "var(--color-indigo)" },
  ] as const;
  return (
    <Card className="p-6">
      <h3 className="font-serif text-2xl text-ink">Stable across seeds</h3>
      <p className="text-xs text-muted">Outer-test ROC-AUC for each repeated split (42 · 123 · 2026)</p>
      <div className="mt-7 space-y-6">
        {rows.map((r) => (
          <div key={r.k}>
            <div className="mb-2 text-xs text-muted">{r.label}</div>
            <div className="relative h-8 rounded-full bg-paper-2">
              {seedTable.map((s) => (
                <motion.div
                  key={s.seed}
                  initial={{ left: "0%", opacity: 0 }}
                  whileInView={{ left: pos(s[r.k]), opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ background: r.color }}
                  title={`Seed ${s.seed}: ${s[r.k]}`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-between font-mono text-[10px] text-faint">
          {[0.84, 0.86, 0.88, 0.9].map((t) => (
            <span key={t}>{t.toFixed(2)}</span>
          ))}
          <span>0.91</span>
        </div>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted">
        Descriptive 95% <i>t</i>-interval for the ensemble ROC-AUC: <span className="font-mono text-ink-2">0.8724 – 0.9101</span>.
      </p>
    </Card>
  );
}

export function Results() {
  return (
    <Section
      id="results"
      eyebrow="Results"
      title={<>An untuned 50/50 average beats either backbone and the fold-selected single best.</>}
      lede="All numbers are patient-group level, averaged over three repeated 3-fold experiments. Hover the curves, toggle the threshold."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <Reveal><RocChart /></Reveal>
        <div className="grid gap-6">
          <Reveal delay={0.08}><SeedStrip /></Reveal>
        </div>
      </div>
      <Reveal><div className="mt-6"><ComparisonTable /></div></Reveal>
      <Reveal><div className="mt-6"><OperatingPoint /></div></Reveal>
    </Section>
  );
}
