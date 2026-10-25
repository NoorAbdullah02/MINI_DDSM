"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Home, Maximize, StickyNote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import results from "@/data/results.json";
import { affiliation, audit, authors, comparison, operatingPoints, paper } from "@/data/site";

// 16:9 stage scaled to fit any projector.
const SW = 1600, SH = 900;

type Slide = { title: string; notes: string; body: ReactNode };

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

function MiniRoc() {
  const W = 620, Hh = 560, p = 50;
  const x = (v: number) => p + v * (W - p - 20);
  const y = (v: number) => Hh - p - v * (Hh - p - 20);
  const g = results.rocGrid;
  const d = (k: keyof typeof results.roc) => results.roc[k].map((t, i) => `${i ? "L" : "M"}${x(g[i])},${y(t)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className="h-full w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke="var(--color-line)" />
          <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
          <text x={x(t)} y={Hh - p + 26} fontSize="16" textAnchor="middle" fill="var(--color-faint)">{t}</text>
          <text x={p - 10} y={y(t) + 5} fontSize="16" textAnchor="end" fill="var(--color-faint)">{t}</text>
        </g>
      ))}
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-faint)" strokeDasharray="6 6" />
      {([["convnext", "var(--color-indigo)", 2.5], ["effnet", "var(--color-gold)", 2.5], ["ensemble", "var(--color-rose)", 4]] as const).map(([k, c, w], i) => (
        <motion.path key={k} d={d(k)} fill="none" stroke={c} strokeWidth={w} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.2 + i * 0.25 }} />
      ))}
    </svg>
  );
}

const slides: Slide[] = [
  {
    title: "Title",
    notes: "Good morning. I'm Sheikh Noor Abdullah from BAUET. Our paper asks a simple question: how good is breast-cancer classification on Mini-DDSM when we evaluate it honestly, patient by patient?",
    body: (
      <div className="flex h-full flex-col justify-center">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-5 py-2 text-[18px] font-semibold text-gold">
          {paper.venueShort} · Paper #{paper.paperId} · {paper.location}
        </div>
        <h1 className="mt-10 max-w-[1350px] font-serif text-[84px] leading-[1.02] tracking-tight text-ink">
          Multi-Backbone Ensemble Learning for <span className="text-gradient italic">Robust</span> Breast Cancer Classification on Mini-DDSM
        </h1>
        <p className="mt-10 text-[24px] text-ink-2">{authors.map((a) => a.name).join("  ·  ")}</p>
        <p className="mt-2 text-[20px] text-muted">{affiliation.dept} · {affiliation.uni}</p>
      </div>
    ),
  },
  {
    title: "Motivation",
    notes: "Breast cancer is the most diagnosed cancer in women — 2.43 million new cases in GLOBOCAN 2024. Deep learning can help screening, but reported accuracy depends heavily on how the data are split.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Why it matters</Kicker>
        <H>2.43 million women were diagnosed with breast cancer in 2024.</H>
        <div className="mt-14 grid grid-cols-3 gap-8">
          <Stat v="2.30M" l="GLOBOCAN 2020" />
          <Stat v="2.30M" l="GLOBOCAN 2022" />
          <Stat v="2.43M" l="GLOBOCAN 2024" c="text-rose" />
        </div>
        <p className="mt-12 max-w-[1100px] text-[26px] leading-relaxed text-muted">
          Benign and malignant findings look alike and readers are overloaded. AI can help — <span className="text-ink">if its accuracy is real.</span>
        </p>
      </div>
    ),
  },
  {
    title: "The problem",
    notes: "Here's the catch. Mini-DDSM has several views per patient. If a patient's CC and MLO images fall on both sides of the split, the model is partly tested on someone it has already seen. Several prior papers report 0.87 to 0.99 accuracy without saying whether they grouped by patient.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>The problem</Kicker>
        <H>Same patient on both sides of the split → inflated scores.</H>
        <div className="mt-14 grid grid-cols-2 gap-10">
          {(["Image-level split", "Patient-grouped split"] as const).map((t, k) => (
            <div key={t} className={`rounded-[28px] border p-8 ${k ? "border-teal/30 bg-teal-soft/50" : "border-rose/30 bg-rose-soft/50"}`}>
              <div className={`text-[22px] font-semibold ${k ? "text-teal" : "text-rose-deep"}`}>{t}</div>
              <div className="mt-6 flex gap-10">
                {["Train", "Test"].map((s, j) => (
                  <div key={s}>
                    <div className="mb-3 text-[16px] uppercase tracking-widest text-muted">{s}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }, (_, i) => {
                        const patient = k ? (j ? 3 + Math.floor(i / 4) : Math.floor(i / 4) + 1) : [1, 2, 1, 3, 2, 4, 1, 3][(i + j * 3) % 8];
                        const cols = ["", "#c23a6b", "#4b5bd6", "#2f8f83", "#b8913f", "#8a4fbf"];
                        return <div key={i} className="grid h-12 w-12 place-items-center rounded-xl text-[14px] font-bold text-white" style={{ background: cols[patient] }}>P{patient}</div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-[20px] text-ink-2">{k ? "No patient appears in both sets." : "P1, P2, P3 leak into the test set."}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Data audit",
    notes: "So before building any fold, we audited every identifier. Three raw IDs appear in both Benign and Cancer folders — we key groups by class folder plus ID. Four eight-image blocks are kept intact. Fourteen exact duplicate pairs, none crossing groups. Result: 2,417 patient groups and zero leakage on all nine splits.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Contribution 1 · Data audit</Kicker>
        <H>Every identifier audited before a single fold is built.</H>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {audit.map((a) => (
            <div key={a.label} className="rounded-[24px] border border-line bg-card p-7">
              <div className={`font-serif text-[56px] leading-none ${a.value === "0" ? "text-teal" : "text-ink"}`}>{a.value}</div>
              <div className="mt-3 text-[22px] font-semibold text-ink-2">{a.label}</div>
              <div className="mt-1 text-[17px] text-muted">{a.note}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Pipeline",
    notes: "The pipeline is deliberately simple. Otsu crop to 512, four-view test-time augmentation, two ImageNet backbones, average to a patient score, then a fixed 50/50 ensemble — no weights tuned on test data.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Contribution 2 · Method</Kicker>
        <H>Simple pipeline. Fixed 50/50 ensemble. No test-set tuning.</H>
        <div className="relative mt-12 h-[480px] w-full overflow-hidden rounded-[28px] border border-line bg-card p-4">
          <Image src="/figures/pipeline.png" alt="Pipeline" fill className="object-contain p-4" sizes="1600px" />
        </div>
      </div>
    ),
  },
  {
    title: "Protocol",
    notes: "Evaluation is nested. Each outer training fold is split into inner train and inner validation by patient. Checkpoints, Youden thresholds and Platt scaling come only from inner validation, then are frozen. The outer test fold is untouched until the end. We repeat everything with three seeds.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Contribution 3 · Protocol</Kicker>
        <H>Nested, patient-grouped, repeated three times.</H>
        <div className="mt-14 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          <div className="rounded-[28px] border border-indigo/25 bg-indigo-soft/60 p-9">
            <div className="text-[18px] font-semibold uppercase tracking-widest text-indigo">Outer training</div>
            <div className="mt-6 flex gap-4 text-[20px]">
              <div className="flex-[88] rounded-2xl bg-card p-5"><b className="text-ink">Inner train 88%</b><br /><span className="text-muted">weights</span></div>
              <div className="flex-[30] rounded-2xl bg-card p-5"><b className="text-ink">Val 12%</b><br /><span className="text-muted">ckpt · threshold · Platt</span></div>
            </div>
          </div>
          <div className="text-[48px] text-faint">→</div>
          <div className="rounded-[28px] border border-rose/25 bg-rose-soft/60 p-9">
            <div className="text-[18px] font-semibold uppercase tracking-widest text-rose">Outer test</div>
            <div className="mt-6 rounded-2xl bg-card p-5 text-[20px]"><b className="text-ink">Untouched until the end</b><br /><span className="text-muted">same TTA · patient-level metrics</span></div>
          </div>
        </div>
        <div className="mt-12 flex gap-4 text-[22px]">
          {["StratifiedGroupKFold × 3", "Seeds 42 · 123 · 2026", "2,000 patient bootstraps"].map((t) => (
            <span key={t} className="rounded-full border border-line bg-card px-6 py-3 text-ink-2">{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Main result",
    notes: "Across three seeds, the ensemble reaches ROC-AUC 0.891 plus-minus 0.008 and PR-AUC 0.830. That beats EfficientNet-B4 at 0.882, ConvNeXtV2 at 0.857 and the fold-selected single best at 0.878.",
    body: (
      <div className="grid h-full grid-cols-[1fr_640px] items-center gap-16">
        <div>
          <Kicker>Results</Kicker>
          <H>Ensemble ROC-AUC 0.891 ± 0.008</H>
          <div className="mt-12 space-y-5 text-[26px]">
            {[["Equal-average ensemble", "0.891", "bg-rose"], ["EfficientNet-B4", "0.882", "bg-gold"], ["Fold-selected single best", "0.878", "bg-ink-2"], ["ConvNeXtV2-Tiny", "0.857", "bg-indigo"]].map(([k, v, c], i) => (
              <div key={k} className={`flex items-center justify-between rounded-2xl border px-7 py-4 ${i ? "border-line bg-card" : "border-rose/30 bg-rose-soft/60"}`}>
                <span className="flex items-center gap-4 text-ink-2"><span className={`h-4 w-4 rounded-full ${c}`} />{k}</span>
                <span className="font-mono font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[20px] text-muted">PR-AUC 0.830 ± 0.012 · 95% t-interval 0.872–0.910</p>
        </div>
        <div className="h-[600px] rounded-[28px] border border-line bg-card p-6"><MiniRoc /></div>
      </div>
    ),
  },
  {
    title: "Ablation",
    notes: "The ablation shows the fixed average wins on five of six metrics. EfficientNet alone stays more sensitive at 0.5 — so the ensemble improves discrimination but doesn't dominate every operating point.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Ablation</Kicker>
        <H>Best on 5 of 6 metrics — without learning any weights.</H>
        <table className="mt-12 w-full overflow-hidden rounded-[24px] text-[24px]">
          <thead>
            <tr className="border-b border-line-2 text-[18px] text-muted">
              <th className="py-4 text-left font-medium">Metric</th>
              {comparison.methods.map((m, i) => <th key={m} className={`py-4 text-right font-medium ${i === 3 ? "text-rose" : ""}`}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => {
              const best = Math.max(...r.values);
              return (
                <tr key={r.metric} className="border-b border-line">
                  <td className="py-4 text-ink-2">{r.metric}</td>
                  {r.values.map((v, i) => <td key={i} className={`py-4 text-right font-mono ${v === best ? "font-bold text-ink" : "text-muted"} ${i === 3 ? "bg-rose-soft/50 pr-4" : ""}`}>{v.toFixed(3)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: "Operating point",
    notes: "Ranking isn't the whole story. At 0.5 the model is specific — 92.6% — but misses many cancers. Using the Youden threshold chosen on training-side validation raises sensitivity from 0.62 to 0.79 and cuts missed cancers from about 343 to 191 per seed.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Operating point</Kicker>
        <H>Youden threshold: sensitivity 0.62 → 0.79</H>
        <div className="mt-14 grid grid-cols-2 gap-10">
          {(["default", "youden"] as const).map((k) => {
            const op = operatingPoints[k];
            return (
              <div key={k} className={`rounded-[28px] border p-9 ${k === "youden" ? "border-rose/30 bg-rose-soft/40" : "border-line bg-card"}`}>
                <div className="text-[24px] font-semibold text-ink">{op.label}</div>
                <div className="mt-7 grid grid-cols-3 gap-6 text-center">
                  {[["Sensitivity", op.sensitivity[0]], ["Specificity", op.specificity[0]], ["Accuracy", op.accuracy[0]]].map(([l, v]) => (
                    <div key={l as string}><div className="font-serif text-[52px] text-ink">{(v as number).toFixed(3)}</div><div className="text-[18px] text-muted">{l}</div></div>
                  ))}
                </div>
                <div className="mt-8 text-[20px] text-rose-deep">Missed cancers per seed: <b className="font-mono">{op.missed.join(" · ")}</b></div>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    title: "Calibration",
    notes: "Platt scaling, fit only on inner validation, lowers Brier from 0.136 to 0.124 and ECE from 0.075 to 0.023. Decision-curve analysis shows positive net benefit from 0.05 to 0.80 in every seed — still internal evidence only.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Beyond AUC</Kicker>
        <H>Calibrated probabilities and positive net benefit.</H>
        <div className="mt-14 grid grid-cols-3 gap-8">
          <Stat v="0.136 → 0.124" l="Brier score (Platt)" c="text-teal" />
          <Stat v="0.075 → 0.023" l="Expected calibration error" c="text-teal" />
          <Stat v="0.05–0.80" l="Threshold range with net benefit" />
        </div>
        <p className="mt-12 text-[24px] text-muted">Platt scaling fitted only on inner-validation predictions — outer labels stay reserved for evaluation.</p>
      </div>
    ),
  },
  {
    title: "Grad-CAM",
    notes: "Grad-CAM gives a qualitative look. For true positives, attention concentrates on the lesion; for false negatives it's near the lesion but too weak. We present this as a transparency aid, not validated localisation.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Explainability</Kicker>
        <H>Where the network looks — qualitatively.</H>
        <div className="mt-12 grid grid-cols-4 gap-6">
          {[["tp", "True positive"], ["tn", "True negative"], ["fp", "False positive"], ["fn", "False negative"]].map(([k, l]) => (
            <div key={k}>
              <div className="relative aspect-[464/470] overflow-hidden rounded-[22px] border border-line">
                <Image src={`/figures/gc_${k}_overlay.jpg`} alt={l} fill className="object-cover" sizes="360px" />
              </div>
              <div className="mt-3 text-center text-[20px] font-medium text-ink-2">{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Limitations",
    notes: "Limitations: one dataset, three folds, eight-image identifiers kept as conservative groups, and Grad-CAM is qualitative. Next we'll apply the same protocol to CBIS-DDSM and INbreast with radiologist review.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Honest limits · Future work</Kicker>
        <H>What this study does not claim.</H>
        <div className="mt-14 grid grid-cols-2 gap-8 text-[24px]">
          {[
            ["Single dataset", "Results are internal to Mini-DDSM."],
            ["Three folds", "More folds would describe split variability more finely."],
            ["Conservative groups", "Eight-image IDs kept intact; may merge distinct subjects."],
            ["Qualitative Grad-CAM", "No overlap metric against radiologist annotations."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-[24px] border border-line bg-card p-8">
              <div className="font-semibold text-ink">{t}</div>
              <div className="mt-2 text-muted">{d}</div>
            </div>
          ))}
        </div>
        <p className="mt-10 text-[24px] text-ink-2">Next → CBIS-DDSM and INbreast · richer metadata · radiologist review.</p>
      </div>
    ),
  },
  {
    title: "Thank you",
    notes: "To summarise: audit first, a simple ensemble wins, thresholds matter, and we're honest about the limits. Everything — code, splits and audit files — is public. Thank you; happy to take questions.",
    body: (
      <div className="flex h-full flex-col justify-center">
        <Kicker>Takeaways</Kicker>
        <div className="mt-8 grid grid-cols-4 gap-6">
          {[
            ["Protocol first", "0 leaked patient groups"],
            ["Simple ensemble", "ROC-AUC 0.891"],
            ["Thresholds matter", "Sensitivity 0.79"],
            ["Calibrated", "ECE 0.023"],
          ].map(([t, d], i) => (
            <div key={t} className="rounded-[24px] border border-line bg-card p-7">
              <div className="font-serif text-[40px] text-rose/40">{i + 1}</div>
              <div className="mt-2 text-[24px] font-semibold text-ink">{t}</div>
              <div className="mt-1 text-[20px] text-muted">{d}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-20 font-serif text-[110px] leading-none tracking-tight text-ink">Thank you.</h2>
        <p className="mt-6 text-[26px] text-muted">Questions welcome · code &amp; audit files: <span className="text-ink">github.com/NoorAbdullah02/MINI_DDSM</span></p>
      </div>
    ),
  },
];

export function Deck() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [notes, setNotes] = useState(false);
  const [scale, setScale] = useState(1);
  const wrap = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => {
    setI((cur) => {
      const next = Math.max(0, Math.min(slides.length - 1, n));
      setDir(next >= cur ? 1 : -1);
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const fit = () => {
      const el = wrap.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / SW, el.clientHeight / SH));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [notes]);

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
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(i + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(i - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key.toLowerCase() === "n") setNotes((v) => !v);
      else if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  return (
    <div className="flex h-dvh flex-col bg-paper-2">
      <div ref={wrap} className="relative flex-1 overflow-hidden" onClick={(e) => (e.clientX > window.innerWidth / 2 ? go(i + 1) : go(i - 1))}>
        <div
          className="grain absolute top-1/2 left-1/2 overflow-hidden rounded-[18px] bg-paper shadow-[var(--shadow-lift)]"
          style={{ width: SW, height: SH, transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={i}
              custom={dir}
              initial={{ opacity: 0, x: 40 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 * dir }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 px-[110px] py-[80px]"
            >
              {slides[i].body}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-[110px] bottom-8 flex items-center justify-between text-[15px] text-faint">
            <span>{paper.venueShort} · Mini-DDSM patient-grouped ensemble</span>
            <span className="font-mono">{String(i + 1).padStart(2, "0")} / {slides.length}</span>
          </div>
          <motion.div className="absolute bottom-0 left-0 h-1 bg-rose" animate={{ width: `${((i + 1) / slides.length) * 100}%` }} />
        </div>
      </div>

      {notes && (
        <div className="max-h-[30vh] overflow-y-auto border-t border-line bg-card px-6 py-4 text-[15px] leading-relaxed text-ink-2">
          <span className="mr-2 font-semibold text-rose">Speaker notes · {slides[i].title}</span>
          {slides[i].notes}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line bg-paper px-4 py-2 text-sm text-muted">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink"><Home size={15} /> Website</Link>
        <div className="flex items-center gap-1">
          <button onClick={() => go(i - 1)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Previous"><ChevronLeft size={18} /></button>
          <span className="w-16 text-center font-mono text-xs">{i + 1} / {slides.length}</span>
          <button onClick={() => go(i + 1)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Next"><ChevronRight size={18} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setNotes(!notes)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${notes ? "bg-rose-soft text-rose-deep" : "hover:bg-paper-2"}`}><StickyNote size={15} /> Notes (N)</button>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-paper-2"><Maximize size={15} /> Full screen (F)</button>
        </div>
      </div>
    </div>
  );
}
