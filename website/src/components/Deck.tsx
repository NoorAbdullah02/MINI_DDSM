"use client";

import { AnimatePresence, animate as animateValue, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  LayoutGrid,
  Loader2,
  Maximize,
  MousePointerClick,
  Pause,
  Play,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Smartphone,
  StickyNote,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { create as createQR } from "qrcode";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { deckNotes } from "@/data/deckNotes";
import results from "@/data/results.json";
import { affiliation, audit, authors, comparison, operatingPoints, paper } from "@/data/site";
import { downloadPptx } from "@/lib/exportPptx";

// 16:9 stage scaled to fit any projector.
const SW = 1600, SH = 900;
const EASE = [0.22, 1, 0.36, 1] as const;

type Slide = { title: string; accent: string; notes: string; body: ReactNode };

// ---------------------------------------------------------------- shared bits

const Kicker = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-3 text-[18px] font-semibold uppercase tracking-[0.24em] text-rose">
    <span className="h-px w-10 bg-rose/60" /> {children}
  </div>
);
const H = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-5 max-w-[1300px] font-serif text-[64px] leading-[1.06] tracking-tight text-ink">{children}</h2>
);
const Stat = ({ v, l, c = "text-ink" }: { v: string; l: string; c?: string }) => (
  <div className="rounded-[28px] border border-line bg-card px-8 py-7 shadow-[var(--shadow-soft)]">
    <div className={`font-serif text-[64px] leading-none ${c}`}>{v}</div>
    <div className="mt-3 text-[20px] text-muted">{l}</div>
  </div>
);

// Staggered entrance choreography. Because each slide fully remounts on
// AnimatePresence (keyed by index), these variants replay every time a
// slide becomes current — no extra plumbing needed per slide.
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } };
const popIn = { hidden: { opacity: 0, y: 20, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } } };
const Stagger = motion.div;
const Item = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div variants={popIn} className={className}>
    {children}
  </motion.div>
);

function CountUp({ to, decimals = 0, suffix = "", prefix = "", className = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string; className?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => prefix + v.toFixed(decimals) + suffix);
  useEffect(() => {
    const c = animateValue(mv, to, { duration: 1.3, delay: 0.3, ease: EASE });
    return () => c.stop();
  }, [to, mv]);
  return <motion.span className={`num ${className}`}>{text}</motion.span>;
}

function MiniRoc() {
  const W = 620, Hh = 560, p = 50;
  const x = (v: number) => p + v * (W - p - 20);
  const y = (v: number) => Hh - p - v * (Hh - p - 20);
  const g = results.rocGrid;
  const d = (k: keyof typeof results.roc) => results.roc[k].map((t, i) => `${i ? "L" : "M"}${x(g[i])},${y(t)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className="h-full w-full">
      <defs>
        <linearGradient id="rocFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-rose)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-rose)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke="var(--color-line)" />
          <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
          <text x={x(t)} y={Hh - p + 26} fontSize="16" textAnchor="middle" fill="var(--color-faint)">{t}</text>
          <text x={p - 10} y={y(t) + 5} fontSize="16" textAnchor="end" fill="var(--color-faint)">{t}</text>
        </g>
      ))}
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-faint)" strokeDasharray="6 6" />
      <motion.path
        d={`${d("ensemble")}L${x(1)},${y(0)}L${x(0)},${y(0)}Z`}
        fill="url(#rocFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      />
      {([["convnext", "var(--color-indigo)", 2.5], ["effnet", "var(--color-gold)", 2.5], ["ensemble", "var(--color-rose)", 4]] as const).map(([k, c, w], i) => (
        <motion.path key={k} d={d(k)} fill="none" stroke={c} strokeWidth={w} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.2 + i * 0.25, ease: EASE }} />
      ))}
    </svg>
  );
}

// A small growing-bar chart for the motivation slide (GLOBOCAN incidence).
function IncidenceBars() {
  const data = [
    { y: "2020", v: 2.3 },
    { y: "2022", v: 2.3 },
    { y: "2024", v: 2.43, hot: true },
  ];
  const max = 2.6;
  return (
    <div className="flex h-[300px] items-end gap-10">
      {data.map((d, i) => (
        <motion.div key={d.y} variants={popIn} className="flex flex-1 flex-col items-center">
          <div className={`font-serif text-[30px] ${d.hot ? "text-rose" : "text-ink-2"}`}>
            <CountUp to={d.v} decimals={2} suffix="M" />
          </div>
          <div className="relative mt-3 flex h-[200px] w-full items-end overflow-hidden rounded-t-2xl bg-paper-2">
            <motion.div
              className={`w-full rounded-t-2xl ${d.hot ? "bg-rose" : "bg-ink-2/70"}`}
              initial={{ height: 0 }}
              animate={{ height: `${(d.v / max) * 100}%` }}
              transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: EASE }}
            />
          </div>
          <div className="mt-3 text-[18px] text-muted">GLOBOCAN {d.y}</div>
        </motion.div>
      ))}
    </div>
  );
}

// A tiny, dependency-free QR code rendered as crisp SVG rects.
function QR({ value, size = 160, fg = "var(--color-ink)" }: { value: string; size?: number; fg?: string }) {
  const matrix = useMemo(() => createQR(value, { errorCorrectionLevel: "M" }).modules, [value]);
  const n = matrix.size;
  const cell = size / n;
  const cells: ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (matrix.get(r, c)) cells.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} fill={fg} />);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="white" rx={8} />
      {cells}
    </svg>
  );
}

// ---------------------------------------------------------------- slides

const slides: Slide[] = [
  {
    title: "Title",
    accent: "var(--color-rose)",
    notes: deckNotes[0],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="relative flex h-full flex-col justify-center">
        <div className="pointer-events-none absolute -right-10 -top-16 select-none font-serif text-[340px] leading-none text-ink/[0.035]">01</div>
        <Item>
          <Image src="/figures/csde-logo.png" alt="IEEE CSDE 2026" width={64} height={64} className="mb-5" />
        </Item>
        <Item>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-5 py-2 text-[18px] font-semibold text-gold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" /> {paper.venueShort} · Paper #{paper.paperId} · {paper.location}
          </div>
        </Item>
        <Item>
          <h1 className="mt-10 max-w-[1350px] font-serif text-[84px] leading-[1.02] tracking-tight text-ink">
            Multi-Backbone Ensemble Learning for <span className="text-gradient italic">Robust</span> Breast Cancer Classification on Mini-DDSM
          </h1>
        </Item>
        <Item>
          <p className="mt-10 text-[24px] text-ink-2">{authors.map((a) => a.name).join("  ·  ")}</p>
          <p className="mt-2 text-[20px] text-muted">{affiliation.dept} · {affiliation.uni}</p>
        </Item>
        <Item className="mt-10 flex gap-4">
          {[
            ["ROC-AUC", "0.891"],
            ["Patient groups", "2,417"],
            ["Leaked groups", "0"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-card/80 px-5 py-3">
              <div className="font-mono text-[22px] font-semibold text-ink">{v}</div>
              <div className="text-[13px] text-muted">{k}</div>
            </div>
          ))}
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Agenda",
    accent: "var(--color-indigo)",
    notes: deckNotes[14],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Agenda</Kicker></Item>
        <Item><H>What this talk covers.</H></Item>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {[
            ["The problem", "Why same-patient splits inflate accuracy"],
            ["Data audit & method", "Patient grouping, pipeline, protocol"],
            ["Results", "Ensemble vs. backbones, operating points"],
            ["Calibration & Grad-CAM", "Beyond AUC, qualitative explainability"],
            ["Limitations", "What this study does not claim"],
            ["References & Q&A", "Sources, then your questions"],
          ].map(([t, d], i) => (
            <Item key={t}>
              <div className="h-full rounded-2xl border border-line bg-card p-6">
                <div className="font-mono text-sm font-semibold text-indigo">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-lg font-semibold text-ink">{t}</div>
                <div className="mt-1 text-sm text-muted">{d}</div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Motivation",
    accent: "var(--color-gold)",
    notes: deckNotes[1],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="grid h-full grid-cols-[1.1fr_1fr] items-center gap-16">
        <div>
          <Item><Kicker>Why it matters</Kicker></Item>
          <Item><H>2.43 million women were diagnosed with breast cancer in 2024.</H></Item>
          <Item>
            <p className="mt-10 max-w-[620px] text-[26px] leading-relaxed text-muted">
              Benign and malignant findings look alike and readers are overloaded. AI can help — <span className="text-ink">if its accuracy is real.</span>
            </p>
          </Item>
        </div>
        <Item className="rounded-[28px] border border-line bg-card p-10 shadow-[var(--shadow-soft)]">
          <IncidenceBars />
        </Item>
      </Stagger>
    ),
  },
  {
    title: "The problem",
    accent: "var(--color-rose)",
    notes: deckNotes[2],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>The problem</Kicker></Item>
        <Item><H>Same patient on both sides of the split → inflated scores.</H></Item>
        <div className="mt-14 grid grid-cols-2 gap-10">
          {(["Image-level split", "Patient-grouped split"] as const).map((t, k) => (
            <Item key={t}>
              <div className={`h-full rounded-[28px] border p-8 ${k ? "border-teal/30 bg-teal-soft/50" : "border-rose/30 bg-rose-soft/50"}`}>
                <div className={`flex items-center gap-2 text-[22px] font-semibold ${k ? "text-teal" : "text-rose-deep"}`}>
                  {t}
                  {k ? <span className="text-[16px]">✓</span> : <span className="animate-pulse text-[16px]">⚠</span>}
                </div>
                <div className="mt-6 flex gap-10">
                  {["Train", "Test"].map((s, j) => (
                    <div key={s}>
                      <div className="mb-3 text-[16px] uppercase tracking-widest text-muted">{s}</div>
                      <Stagger variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }, (_, idx) => {
                          const patient = k ? (j ? 3 + Math.floor(idx / 4) : Math.floor(idx / 4) + 1) : [1, 2, 1, 3, 2, 4, 1, 3][(idx + j * 3) % 8];
                          const leaked = !k && patient <= 3;
                          const cols = ["", "#c23a6b", "#4b5bd6", "#2f8f83", "#b8913f", "#8a4fbf"];
                          return (
                            <motion.div
                              key={idx}
                              variants={popIn}
                              className="relative grid h-12 w-12 place-items-center rounded-xl text-[14px] font-bold text-white"
                              style={{ background: cols[patient], boxShadow: leaked ? "0 0 0 3px var(--color-rose)" : "none" }}
                            >
                              P{patient}
                              {leaked && <motion.span className="absolute -inset-1 rounded-xl border-2 border-rose" animate={{ opacity: [0.9, 0.2, 0.9] }} transition={{ duration: 1.6, repeat: Infinity }} />}
                            </motion.div>
                          );
                        })}
                      </Stagger>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-[20px] text-ink-2">{k ? "No patient appears in both sets." : "P1, P2, P3 leak into the test set."}</div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Data audit",
    accent: "var(--color-indigo)",
    notes: deckNotes[3],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Contribution 1 · Data audit</Kicker></Item>
        <Item><H>Every identifier audited before a single fold is built.</H></Item>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {audit.map((a) => (
            <Item key={a.label}>
              <div className="h-full rounded-[24px] border border-line bg-card p-7">
                <div className={`font-serif text-[56px] leading-none ${a.value === "0" ? "text-teal" : "text-ink"}`}>
                  {/^\d[\d,]*$/.test(a.value) ? <CountUp to={parseInt(a.value.replace(/,/g, ""))} /> : a.value}
                </div>
                <div className="mt-3 text-[22px] font-semibold text-ink-2">{a.label}</div>
                <div className="mt-1 text-[17px] text-muted">{a.note}</div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Pipeline",
    accent: "var(--color-indigo)",
    notes: deckNotes[4],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Contribution 2 · Method</Kicker></Item>
        <Item><H>Simple pipeline. Fixed 50/50 ensemble. No test-set tuning.</H></Item>
        <Item>
          <div className="relative mt-12 h-[480px] w-full overflow-hidden rounded-[28px] border border-line bg-card p-4">
            <Image src="/figures/pipeline.png" alt="Pipeline" fill className="object-contain p-4" sizes="1600px" />
            <motion.div
              className="absolute inset-y-4 w-[3px] bg-gradient-to-b from-transparent via-rose to-transparent"
              initial={{ left: "2%", opacity: 0 }}
              animate={{ left: ["2%", "98%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.6, delay: 0.5, ease: "easeInOut" }}
            />
          </div>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Protocol",
    accent: "var(--color-indigo)",
    notes: deckNotes[5],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Contribution 3 · Protocol</Kicker></Item>
        <Item><H>Nested, patient-grouped, repeated three times.</H></Item>
        <div className="mt-14 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          <Item>
            <div className="rounded-[28px] border border-indigo/25 bg-indigo-soft/60 p-9">
              <div className="text-[18px] font-semibold uppercase tracking-widest text-indigo">Outer training</div>
              <div className="mt-6 flex gap-4 text-[20px]">
                <div className="flex-[88] rounded-2xl bg-card p-5"><b className="text-ink">Inner train 88%</b><br /><span className="text-muted">weights</span></div>
                <div className="flex-[30] rounded-2xl bg-card p-5"><b className="text-ink">Val 12%</b><br /><span className="text-muted">ckpt · threshold · Platt</span></div>
              </div>
            </div>
          </Item>
          <Item>
            <motion.div className="text-[48px] text-rose" animate={{ x: [0, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>→</motion.div>
          </Item>
          <Item>
            <div className="rounded-[28px] border border-rose/25 bg-rose-soft/60 p-9">
              <div className="text-[18px] font-semibold uppercase tracking-widest text-rose">Outer test</div>
              <div className="mt-6 rounded-2xl bg-card p-5 text-[20px]"><b className="text-ink">Untouched until the end</b><br /><span className="text-muted">same TTA · patient-level metrics</span></div>
            </div>
          </Item>
        </div>
        <Item className="mt-12 flex gap-4 text-[22px]">
          {["StratifiedGroupKFold × 3", "Seeds 42 · 123 · 2026", "2,000 patient bootstraps"].map((t) => (
            <span key={t} className="rounded-full border border-line bg-card px-6 py-3 text-ink-2">{t}</span>
          ))}
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Main result",
    accent: "var(--color-rose)",
    notes: deckNotes[6],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="grid h-full grid-cols-[1fr_640px] items-center gap-16">
        <div>
          <Item><Kicker>Results</Kicker></Item>
          <Item>
            <h2 className="mt-5 max-w-[1300px] font-serif text-[64px] leading-[1.06] tracking-tight text-ink">
              Ensemble ROC-AUC <CountUp to={0.891} decimals={3} className="text-gradient" /> ± 0.008
            </h2>
          </Item>
          <div className="mt-12 space-y-5 text-[26px]">
            {[["Equal-average ensemble", "0.891", "bg-rose"], ["EfficientNet-B4", "0.882", "bg-gold"], ["Fold-selected single best", "0.878", "bg-ink-2"], ["ConvNeXtV2-Tiny", "0.857", "bg-indigo"]].map(([k, v, c], i) => (
              <Item key={k}>
                <div className={`flex items-center justify-between rounded-2xl border px-7 py-4 ${i ? "border-line bg-card" : "border-rose/30 bg-rose-soft/60"}`}>
                  <span className="flex items-center gap-4 text-ink-2"><span className={`h-4 w-4 rounded-full ${c}`} />{k}</span>
                  <span className="font-mono font-semibold text-ink">{v}</span>
                </div>
              </Item>
            ))}
          </div>
          <Item><p className="mt-8 text-[20px] text-muted">PR-AUC 0.830 ± 0.012 · 95% t-interval 0.872–0.910</p></Item>
        </div>
        <Item className="h-[600px] rounded-[28px] border border-line bg-card p-6"><MiniRoc /></Item>
      </Stagger>
    ),
  },
  {
    title: "Ablation",
    accent: "var(--color-rose)",
    notes: deckNotes[7],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Ablation</Kicker></Item>
        <Item><H>Best on 5 of 6 metrics — without learning any weights.</H></Item>
        <Item>
          <table className="mt-12 w-full overflow-hidden rounded-[24px] text-[24px]">
            <thead>
              <tr className="border-b border-line-2 text-[18px] text-muted">
                <th className="py-4 text-left font-medium">Metric</th>
                {comparison.methods.map((m, i) => <th key={m} className={`py-4 text-right font-medium ${i === 3 ? "text-rose" : ""}`}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((r, ri) => {
                const best = Math.max(...r.values);
                return (
                  <motion.tr
                    key={r.metric}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + ri * 0.08, duration: 0.5, ease: EASE }}
                    className="border-b border-line"
                  >
                    <td className="py-4 text-ink-2">{r.metric}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className={`py-4 text-right font-mono ${v === best ? "font-bold text-ink" : "text-muted"} ${i === 3 ? "bg-rose-soft/50 pr-4" : ""}`}>
                        {v === best && i === 3 ? (
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.15, 1] }}
                            transition={{ delay: 1.1 + ri * 0.08, duration: 0.4 }}
                            className="inline-block"
                          >
                            {v.toFixed(4)}
                          </motion.span>
                        ) : (
                          v.toFixed(4)
                        )}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Operating point",
    accent: "var(--color-rose)",
    notes: deckNotes[8],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Operating point</Kicker></Item>
        <Item>
          <h2 className="mt-5 max-w-[1300px] font-serif text-[64px] leading-[1.06] tracking-tight text-ink">
            Youden threshold: sensitivity <CountUp to={0.619} decimals={2} /> → <CountUp to={0.788} decimals={2} className="text-rose" />
          </h2>
        </Item>
        <div className="mt-14 grid grid-cols-2 gap-10">
          {(["default", "youden"] as const).map((k) => {
            const op = operatingPoints[k];
            return (
              <Item key={k}>
                <div className={`h-full rounded-[28px] border p-9 ${k === "youden" ? "border-rose/30 bg-rose-soft/40" : "border-line bg-card"}`}>
                  <div className="text-[24px] font-semibold text-ink">{op.label}</div>
                  <div className="mt-7 grid grid-cols-3 gap-6 text-center">
                    {[["Sensitivity", op.sensitivity[0]], ["Specificity", op.specificity[0]], ["Accuracy", op.accuracy[0]]].map(([l, v]) => (
                      <div key={l as string}>
                        <div className="font-serif text-[52px] text-ink"><CountUp to={v as number} decimals={3} /></div>
                        <div className="text-[18px] text-muted">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-[20px] text-rose-deep">Missed cancers per seed: <b className="font-mono">{op.missed.join(" · ")}</b></div>
                </div>
              </Item>
            );
          })}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Calibration",
    accent: "var(--color-teal)",
    notes: deckNotes[9],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Beyond AUC</Kicker></Item>
        <Item><H>Calibrated probabilities and positive net benefit.</H></Item>
        <div className="mt-14 grid grid-cols-3 gap-8">
          <Item><Stat v="0.136 → 0.124" l="Brier score (Platt)" c="text-teal" /></Item>
          <Item><Stat v="0.075 → 0.023" l="Expected calibration error" c="text-teal" /></Item>
          <Item><Stat v="0.05–0.80" l="Threshold range with net benefit" /></Item>
        </div>
        <Item><p className="mt-12 text-[24px] text-muted">Platt scaling fitted only on inner-validation predictions — outer labels stay reserved for evaluation.</p></Item>
      </Stagger>
    ),
  },
  {
    title: "Grad-CAM",
    accent: "var(--color-gold)",
    notes: deckNotes[10],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Explainability</Kicker></Item>
        <Item><H>Where the network looks — qualitatively.</H></Item>
        <div className="mt-12 grid grid-cols-4 gap-6">
          {[["tp", "True positive"], ["tn", "True negative"], ["fp", "False positive"], ["fn", "False negative"]].map(([k, l]) => (
            <Item key={k}>
              <div className="relative aspect-[464/470] overflow-hidden rounded-[22px] border border-line">
                <Image src={`/figures/gc_${k}_overlay.jpg`} alt={l} fill className="object-cover" sizes="360px" />
              </div>
              <div className="mt-3 text-center text-[20px] font-medium text-ink-2">{l}</div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Limitations",
    accent: "var(--color-ink-2)",
    notes: deckNotes[11],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Honest limits · Future work</Kicker></Item>
        <Item><H>What this study does not claim.</H></Item>
        <div className="mt-14 grid grid-cols-2 gap-8 text-[24px]">
          {[
            ["Single dataset", "Results are internal to Mini-DDSM."],
            ["Three folds", "More folds would describe split variability more finely."],
            ["Conservative groups", "Eight-image IDs kept intact; may merge distinct subjects."],
            ["Qualitative Grad-CAM", "No overlap metric against radiologist annotations."],
          ].map(([t, d]) => (
            <Item key={t}>
              <div className="h-full rounded-[24px] border border-line bg-card p-8">
                <div className="font-semibold text-ink">{t}</div>
                <div className="mt-2 text-muted">{d}</div>
              </div>
            </Item>
          ))}
        </div>
        <Item><p className="mt-10 text-[24px] text-ink-2">Next → CBIS-DDSM and INbreast · richer metadata · radiologist review.</p></Item>
      </Stagger>
    ),
  },
  {
    title: "References",
    accent: "var(--color-ink-2)",
    notes: deckNotes[15],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="flex h-full flex-col justify-center">
        <Item><Kicker>Sources</Kicker></Item>
        <Item><H>References.</H></Item>
        <Item>
          <div className="mt-10 rounded-2xl border border-line bg-card p-8">
            <ol className="grid grid-cols-2 gap-x-10 gap-y-4 text-[15px] leading-relaxed text-ink-2">
              {[
                "H. Sung et al., “Global cancer statistics 2024,” CA Cancer J. Clin., 2026.",
                "C. D. Lekamlage et al., “Mini-DDSM: Mammography age estimation,” Proc. DMIP, 2020.",
                "M. Tan and Q. V. Le, “EfficientNet: Rethinking model scaling for CNNs,” Proc. ICML, 2019.",
                "S. Woo et al., “ConvNeXt V2: Co-designing and scaling ConvNets with MAE,” Proc. CVPR, 2023.",
                "R. R. Selvaraju et al., “Grad-CAM: Visual explanations via gradient localization,” Proc. ICCV, 2017.",
                "M. Heenaye-Mamode Khan et al., “Multi-class classification of breast abnormalities,” PLOS ONE, 2021.",
                "A. Sahu, P. K. Das, and S. Meher, “High accuracy hybrid CNN classifiers for breast cancer,” Biomed. Signal Process. Control, 2023.",
                "Y. Khourdifi et al., “Early breast cancer detection based on deep learning,” BioMedInformatics, 2024.",
                "I. Loshchilov and F. Hutter, “Decoupled weight decay regularization,” Proc. ICLR, 2019.",
                "N. Otsu, “A threshold selection method from gray-level histograms,” IEEE Trans. SMC, 1979.",
              ].map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs text-faint">[{i + 1}]</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </div>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Thank you",
    accent: "var(--color-rose)",
    notes: deckNotes[12],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="grid h-full grid-cols-[1fr_auto] items-center gap-14">
        <div>
          <Item><Image src="/figures/csde-logo.png" alt="IEEE CSDE 2026" width={52} height={52} className="mb-4" /></Item>
          <Item><Kicker>Takeaways</Kicker></Item>
          <div className="mt-6 grid grid-cols-2 gap-5">
            {[
              ["Protocol first", "0 leaked patient groups"],
              ["Simple ensemble", "ROC-AUC 0.891"],
              ["Thresholds matter", "Sensitivity 0.79"],
              ["Calibrated", "ECE 0.023"],
            ].map(([t, d], i) => (
              <Item key={t}>
                <div className="rounded-[24px] border border-line bg-card p-6">
                  <div className="font-serif text-[36px] text-rose/40">{i + 1}</div>
                  <div className="mt-1 text-[22px] font-semibold text-ink">{t}</div>
                  <div className="mt-1 text-[18px] text-muted">{d}</div>
                </div>
              </Item>
            ))}
          </div>
          <Item><h2 className="mt-16 font-serif text-[96px] leading-none tracking-tight text-ink">Thank you.</h2></Item>
          <Item><p className="mt-5 text-[24px] text-muted">Questions welcome · code &amp; audit files: <span className="text-ink">github.com/NoorAbdullah02/MINI_DDSM</span></p></Item>
        </div>
        <Item>
          <div className="flex w-[300px] flex-col items-center rounded-[28px] border border-line bg-card p-8 text-center shadow-[var(--shadow-lift)]">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-rose">
              <Smartphone size={14} /> Try it live
            </div>
            <div className="mt-5 rounded-2xl border border-line p-3">
              <QR value="https://mini-ddsm-csde2026.vercel.app/#demo" size={180} />
            </div>
            <p className="mt-5 text-[16px] leading-snug text-muted">Scan to run the model on your own phone — right now, in your browser.</p>
            <p className="mt-2 font-mono text-[13px] text-ink-2">mini-ddsm-csde2026.vercel.app</p>
          </div>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Any questions?",
    accent: "var(--color-indigo)",
    notes: deckNotes[13],
    body: (
      <Stagger variants={stagger} initial="hidden" animate="show" className="relative flex h-full flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute -right-6 bottom-0 select-none font-serif text-[420px] italic leading-none text-indigo/[0.05]">?</div>
        <Item>
          <Kicker>Q &amp; A</Kicker>
        </Item>
        <Item>
          <h1 className="mt-6 font-serif text-[108px] leading-[1.02] tracking-tight text-ink">
            Any <span className="text-gradient italic">questions</span>?
          </h1>
        </Item>
        <Item>
          <p className="mt-8 max-w-[760px] text-[22px] leading-relaxed text-muted">
            Happy to dig into the patient-grouping protocol, the ensemble, the thresholds, or what we would do differently on a second dataset.
          </p>
        </Item>
        <Item className="mt-14 flex flex-wrap items-center justify-center gap-4">
          {[
            [authors.find((a) => a.lead)?.name ?? authors[0].name, authors.find((a) => a.lead)?.email ?? authors[0].email],
            ["Code & audit files", "github.com/NoorAbdullah02/MINI_DDSM"],
            ["Try it live", "mini-ddsm-csde2026.vercel.app"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-card px-6 py-4 text-left shadow-[var(--shadow-soft)]">
              <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-indigo">{k}</div>
              <div className="mt-1 font-mono text-[16px] text-ink-2">{v}</div>
            </div>
          ))}
        </Item>
      </Stagger>
    ),
  },
];

// ---------------------------------------------------------------- deck chrome

// Slow, low-opacity floating motes — a stable seeded layout so it never
// reflows, just drifts. Pure atmosphere, never competes with content.
function DustMotes({ color }: { color: string }) {
  // Pure hash per (mote, draw) index — no mutable closure state, so this
  // stays safe under the React Compiler's immutability checks.
  const motes = useMemo(() => {
    const rnd = (n: number) => {
      const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: rnd(i * 7 + 1) * 100,
      y: rnd(i * 7 + 2) * 100,
      r: 3 + rnd(i * 7 + 3) * 5,
      dur: 14 + rnd(i * 7 + 4) * 12,
      delay: -rnd(i * 7 + 5) * 20,
      dx: (rnd(i * 7 + 6) - 0.5) * 60,
      dy: (rnd(i * 7 + 7) - 0.5) * 60,
    }));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.35]">
      {motes.map((m) => (
        <motion.span
          key={m.id}
          className="absolute rounded-full"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.r * 2, height: m.r * 2, background: color }}
          animate={{ x: [0, m.dx, 0], y: [0, m.dy, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// A quick Material-style ripple at the click point — tactile feedback that
// never touches slide content or geometry.
function useRipples() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);
  const spawn = useCallback((x: number, y: number) => {
    const id = nextId.current++;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 650);
  }, []);
  return {
    spawn,
    node: (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="absolute rounded-full border-2"
              style={{ left: r.x, top: r.y, borderColor: "var(--color-rose)" }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
              animate={{ width: 220, height: 220, x: -110, y: -110, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          ))}
        </AnimatePresence>
      </div>
    ),
  };
}

function SlideCounter({ i, total }: { i: number; total: number }) {
  return (
    <span className="relative inline-flex h-[1.4em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="inline-block"
        >
          {String(i + 1).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <span>&nbsp;/ {total}</span>
    </span>
  );
}

function Glow({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={color}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1100px 620px at 12% -12%, ${color}1c, transparent 60%), radial-gradient(800px 480px at 105% 112%, ${color}14, transparent 60%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </AnimatePresence>
    </div>
  );
}

function TickBar({ i, total, onJump }: { i: number; total: number; onJump: (n: number) => void }) {
  return (
    <div className="absolute inset-x-[110px] top-6 flex gap-1.5">
      {Array.from({ length: total }, (_, k) => (
        <button
          key={k}
          onClick={(e) => {
            e.stopPropagation();
            onJump(k);
          }}
          className="group relative h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10"
          aria-label={`Go to slide ${k + 1}`}
        >
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-rose"
            initial={false}
            animate={{ width: k < i ? "100%" : k === i ? "100%" : "0%" }}
            transition={{ duration: k === i ? 0.4 : 0.2 }}
          />
          <span className="absolute inset-y-0 left-0 w-0 rounded-full bg-rose/50 transition-all duration-150 group-hover:w-full" />
        </button>
      ))}
    </div>
  );
}

function Overview({ i, onSelect, onClose }: { i: number; onSelect: (n: number) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col bg-paper/97 p-10 backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-serif text-2xl text-ink">All slides</h3>
        <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Close overview">
          <X size={20} />
        </button>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-4 overflow-y-auto pb-2">
        {slides.map((s, k) => (
          <motion.button
            key={s.title + k}
            onClick={() => onSelect(k)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: k * 0.025 }}
            className={`flex aspect-video flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
              k === i ? "border-rose bg-rose-soft/50" : "border-line bg-card"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />
            <div>
              <div className="font-mono text-[11px] text-faint">{String(k + 1).padStart(2, "0")}</div>
              <div className="mt-0.5 text-sm font-semibold text-ink">{s.title}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// A soft, spring-trailing red dot for pointing at things live on a projector —
// fixed to the viewport, tracks the raw pointer position smoothed by a spring
// so it glides rather than snaps.
function LaserDot({ active }: { active: boolean }) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 700, damping: 40 });
  const sy = useSpring(y, { stiffness: 700, damping: 40 });

  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, x, y]);

  if (!active) return null;
  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[90] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose shadow-[0_0_18px_6px_rgba(194,58,107,0.65)]"
      style={{ x: sx, y: sy }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    />
  );
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// A right-hand presenter aside: elapsed timer, what's up next, and the full
// speaker notes in a larger, easier-to-read type size — everything a speaker
// needs without turning their head to a second monitor.
function PresenterPanel({ i, onClose }: { i: number; onClose: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const next = slides[i + 1];

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex w-[360px] shrink-0 flex-col border-l border-line bg-card"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="text-sm font-semibold text-ink">Presenter view</span>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Close presenter view">
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-line px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="num font-mono text-3xl text-ink">{formatClock(seconds)}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setRunning((r) => !r)} className="rounded-full border border-line p-2 text-ink-2 hover:bg-paper-2" aria-label={running ? "Pause timer" : "Resume timer"}>
              {running ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => {
                setSeconds(0);
                setRunning(true);
              }}
              className="rounded-full border border-line p-2 text-ink-2 hover:bg-paper-2"
              aria-label="Reset timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-faint">Elapsed time · started when this panel opened</p>
      </div>

      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Up next</p>
        {next ? (
          <div className="mt-2 flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: next.accent }} />
            <span className="text-sm font-medium text-ink-2">{next.title}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">This is the last slide.</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose">Speaker notes · {slides[i].title}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{slides[i].notes}</p>
      </div>
    </motion.aside>
  );
}

export function Deck() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [notes, setNotes] = useState(false);
  const [overview, setOverview] = useState(false);
  const [presenter, setPresenter] = useState(false);
  const [laser, setLaser] = useState(false);
  const [scale, setScale] = useState(1);
  const [exportState, setExportState] = useState<{ phase: "idle" | "working" | "done" | "error"; label: string }>({ phase: "idle", label: "" });
  const wrap = useRef<HTMLDivElement>(null);
  const ripples = useRipples();

  const go = useCallback((n: number) => {
    setI((cur) => {
      const next = Math.max(0, Math.min(slides.length - 1, n));
      setDir(next >= cur ? 1 : -1);
      return next;
    });
  }, []);

  const jump = useCallback(
    (n: number) => {
      go(n);
      setOverview(false);
    },
    [go],
  );

  useLayoutEffect(() => {
    const fit = () => {
      const el = wrap.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / SW, el.clientHeight / SH));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [notes, presenter]);

  // Deep links (/present#7). The URL is only written after the initial hash has been read.
  const hashRead = useRef(false);
  useEffect(() => {
    if (hashRead.current) history.replaceState(null, "", `#${i + 1}`);
  }, [i]);
  useEffect(() => {
    const h = parseInt(window.location.hash.slice(1));
    // The hash only exists on the client, so it can only be read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h > 0) setI(Math.min(slides.length - 1, h - 1));
    hashRead.current = true;
    return () => {
      hashRead.current = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOverview(false);
        return;
      }
      if (overview) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(i + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(i - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key.toLowerCase() === "n") setNotes((v) => !v);
      else if (e.key.toLowerCase() === "o") setOverview(true);
      else if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
      else if (e.key.toLowerCase() === "p") setPresenter((v) => !v);
      else if (e.key.toLowerCase() === "l") setLaser((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, overview]);

  const handleDownload = useCallback(async () => {
    if (exportState.phase === "working") return;
    setExportState({ phase: "working", label: "Starting…" });
    try {
      await downloadPptx((label) => setExportState({ phase: "working", label }));
      setExportState({ phase: "done", label: "Downloaded" });
      setTimeout(() => setExportState({ phase: "idle", label: "" }), 2200);
    } catch {
      setExportState({ phase: "error", label: "Could not build the file — try again" });
      setTimeout(() => setExportState({ phase: "idle", label: "" }), 3000);
    }
  }, [exportState.phase]);

  return (
    <div
      className="flex h-dvh flex-col bg-paper-2"
      style={
        {
          // Re-skin to the official IEEE CSDE 2026 template's own palette and
          // fonts (Cambria/Calibri, via their free metric clones) — scoped to
          // this subtree only, so the rest of the site keeps its own brand.
          "--font-serif": "var(--font-caladea)",
          "--font-sans": "var(--font-carlito)",
          "--color-paper": "#ffffff",
          "--color-paper-2": "#eaf0f7",
          "--color-card": "#ffffff",
          "--color-line": "#dce6f0",
          "--color-line-2": "#c3d2e0",
          "--color-ink": "#1a2433",
          "--color-ink-2": "#0b2545",
          "--color-muted": "#5c6b7a",
          "--color-faint": "#8da9c4",
          "--color-rose": "#d1495b",
          "--color-rose-soft": "#fbe8ea",
          "--color-rose-deep": "#a83349",
          "--color-teal": "#1c7293",
          "--color-teal-soft": "#e3eef2",
          "--color-indigo": "#3e7cb1",
          "--color-indigo-soft": "#e8f0f7",
          "--color-gold": "#f2a900",
          "--color-gold-soft": "#fdf1d9",
        } as React.CSSProperties
      }
    >
      <LaserDot active={laser} />
      <div className="flex min-h-0 flex-1">
        <div
          ref={wrap}
          className="relative flex-1 overflow-hidden"
          style={laser ? { cursor: "none" } : undefined}
          onClick={(e) => {
            if (overview) return;
            const r = wrap.current!.getBoundingClientRect();
            ripples.spawn(e.clientX - r.left, e.clientY - r.top);
            if (e.clientX > window.innerWidth / 2) go(i + 1);
            else go(i - 1);
          }}
        >
          {ripples.node}
          <div
            className="grain absolute top-1/2 left-1/2 overflow-hidden rounded-[18px] bg-paper shadow-[var(--shadow-lift)]"
            style={{ width: SW, height: SH, transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <Glow color={slides[i].accent} />
            <DustMotes color={slides[i].accent} />

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: 70 * dir, scale: 0.97, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -70 * dir, scale: 0.97, filter: "blur(8px)" }}
                transition={{ duration: 0.55, ease: EASE }}
                className="absolute inset-0 px-[110px] py-[92px]"
              >
                {slides[i].body}
              </motion.div>
            </AnimatePresence>

            <TickBar i={i} total={slides.length} onJump={jump} />

            {slides[i].title !== "Title" && slides[i].title !== "Thank you" && (
              <div className="absolute right-[110px] top-10 flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-white">
                <Image src="/figures/csde-logo.png" alt="" width={16} height={16} />
                {paper.venueShort}
              </div>
            )}

            <div className="absolute inset-x-[110px] bottom-8 flex items-center justify-between text-[15px] text-faint">
              <span>{paper.venueShort} · Mini-DDSM patient-grouped ensemble</span>
              <span className="font-mono">{String(i + 1).padStart(2, "0")} / {slides.length} · {slides[i].title}</span>
            </div>

            <AnimatePresence>{overview && <Overview i={i} onSelect={jump} onClose={() => setOverview(false)} />}</AnimatePresence>
          </div>
        </div>

        <AnimatePresence>{presenter && <PresenterPanel i={i} onClose={() => setPresenter(false)} />}</AnimatePresence>
      </div>

      {notes && !presenter && (
        <div className="max-h-[30vh] overflow-y-auto border-t border-line bg-card px-6 py-4 text-[15px] leading-relaxed text-ink-2">
          <span className="mr-2 font-semibold text-rose">Speaker notes · {slides[i].title}</span>
          {slides[i].notes}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line bg-paper px-4 py-2 text-sm text-muted">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink"><Home size={15} /> Website</Link>
        <div className="flex items-center gap-1">
          <button onClick={() => go(i - 1)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Previous"><ChevronLeft size={18} /></button>
          <span className="w-16 text-center font-mono text-xs"><SlideCounter i={i} total={slides.length} /></span>
          <button onClick={() => go(i + 1)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Next"><ChevronRight size={18} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOverview(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-paper-2"><LayoutGrid size={15} /> Overview (O)</button>
          <button onClick={() => setNotes(!notes)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${notes ? "bg-rose-soft text-rose-deep" : "hover:bg-paper-2"}`}><StickyNote size={15} /> Notes (N)</button>
          <button onClick={() => setPresenter((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${presenter ? "bg-indigo-soft text-indigo" : "hover:bg-paper-2"}`}>
            {presenter ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />} Presenter (P)
          </button>
          <button onClick={() => setLaser((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${laser ? "bg-rose-soft text-rose-deep" : "hover:bg-paper-2"}`}>
            <MousePointerClick size={15} /> Laser (L)
          </button>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-paper-2"><Maximize size={15} /> Full screen (F)</button>
          <button
            onClick={handleDownload}
            disabled={exportState.phase === "working"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
              exportState.phase === "error" ? "bg-rose-soft text-rose-deep" : exportState.phase === "done" ? "bg-teal-soft text-teal" : "hover:bg-paper-2"
            }`}
          >
            {exportState.phase === "working" ? <Loader2 size={15} className="animate-spin" /> : exportState.phase === "done" ? <Check size={15} /> : <Download size={15} />}
            {exportState.phase === "idle" ? "Download .pptx" : exportState.label}
          </button>
        </div>
      </div>
    </div>
  );
}
