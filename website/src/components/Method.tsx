"use client";

import { Crop, FlipHorizontal2, Layers, Merge, ScanLine, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { backbones } from "@/data/site";
import { Card, Reveal, Section } from "./ui";

const steps = [
  { icon: ScanLine, t: "Otsu tissue mask", d: "Separate breast tissue from background, close small holes." },
  { icon: Crop, t: "Crop & resize", d: "Largest contour → 512 × 512, grey replicated to 3 channels." },
  { icon: FlipHorizontal2, t: "4-view TTA", d: "Original, H-flip, V-flip, 180° — averaged per backbone." },
  { icon: Layers, t: "Two backbones", d: "EfficientNet-B4 and ConvNeXtV2-Tiny, ImageNet-pretrained." },
  { icon: Users, t: "Patient averaging", d: "Image probabilities → one score per patient group." },
  { icon: Merge, t: "Fixed 50/50 ensemble", d: "Unweighted mean. No tuning on outer-test data." },
];

export function Method() {
  const [active, setActive] = useState(0);
  return (
    <Section
      id="method"
      eyebrow="Method"
      title="A deliberately simple pipeline, evaluated with care."
      lede="Every choice that could leak information — checkpoints, thresholds, calibration — is made on inner-validation patients only, then frozen before the outer test fold is touched."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {steps.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.05}>
            <button
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`relative h-full w-full rounded-2xl border p-5 text-left transition ${
                active === i ? "border-rose/40 bg-card shadow-[var(--shadow-lift)]" : "border-line bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${active === i ? "bg-rose-soft text-rose" : "bg-paper-2 text-ink-2"}`}>
                  <s.icon size={18} />
                </span>
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="mt-4 text-sm font-semibold text-ink">{s.t}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">{s.d}</div>
              {active === i && <motion.span layoutId="step-bar" className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-rose" />}
            </button>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card className="mt-8 p-3 sm:p-4">
          <div className="relative aspect-[1546/600] w-full overflow-hidden rounded-2xl bg-paper">
            <Image src="/figures/pipeline.png" alt="Inference workflow: preprocessing, four-view TTA, two backbones, patient averaging, ensemble" fill className="object-contain" sizes="(max-width: 1200px) 100vw, 1150px" />
          </div>
          <p className="px-2 pt-3 pb-1 text-xs text-muted">Fig. 3 from the paper — inference workflow used for every outer-test comparison.</p>
        </Card>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {backbones.map((b, i) => (
          <Reveal key={b.name} delay={i * 0.1}>
            <Card className="relative h-full overflow-hidden p-7">
              <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-10" style={{ background: b.color }} />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: b.color }}>{b.tag}</span>
              <h3 className="mt-2 font-serif text-3xl text-ink">{b.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{b.blurb}</p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 text-sm sm:grid-cols-4">
                {[
                  ["Learning rate", b.lr],
                  ["Max epochs", b.epochs],
                  ["Patience", b.patience],
                  ["Outer AUC", b.outerAuc],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-xs text-faint">{k}</dt>
                    <dd className="num mt-0.5 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card className="mt-10 p-7 md:p-9">
          <h3 className="font-serif text-2xl text-ink">Nested, patient-grouped evaluation</h3>
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-2xl border border-indigo/20 bg-indigo-soft/50 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo">Outer training (≈ ⅔)</div>
              <div className="mt-4 grid grid-cols-[88fr_12fr] gap-2 text-xs">
                <div className="rounded-xl bg-card p-3 text-ink-2">
                  <div className="font-semibold text-ink">Inner train · 88%</div>
                  Weights + random augmentation
                </div>
                <div className="rounded-xl bg-card p-3 text-ink-2">
                  <div className="font-semibold text-ink">Val</div>
                  12%
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">Checkpoint, Youden threshold and Platt scaling are chosen here — then frozen.</p>
            </div>
            <div className="hidden items-center text-2xl text-faint md:flex">→</div>
            <div className="rounded-2xl border border-rose/20 bg-rose-soft/50 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rose">Outer test (≈ ⅓)</div>
              <div className="mt-4 rounded-xl bg-card p-3 text-xs text-ink-2">
                <div className="font-semibold text-ink">Untouched until the end</div>
                Same 4-view TTA for every model. Metrics after patient-level aggregation.
              </div>
              <p className="mt-3 text-xs text-muted">StratifiedGroupKFold · 3 folds × seeds 42 / 123 / 2026 · 2,000 patient bootstraps.</p>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
