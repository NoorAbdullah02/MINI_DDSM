"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, Reveal, Section, Segmented } from "./ui";

// 12 synthetic patients × 4 views — purely illustrative.
const PATIENTS = 12;
const VIEWS = 4;
const hues = ["#c23a6b", "#4b5bd6", "#2f8f83", "#b8913f", "#8a4fbf", "#d0703a"];

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

type Mode = "image" | "patient";

export function Problem() {
  const [mode, setMode] = useState<Mode>("image");

  const assign = useMemo(() => {
    const r = rng(7);
    // image-level: each image independently random; patient-level: whole patient goes to one side
    const testPatients = new Set([1, 4, 7, 10]);
    return Array.from({ length: PATIENTS }, (_, p) =>
      Array.from({ length: VIEWS }, () => ({
        image: r() < 0.33 ? "test" : "train",
        patient: testPatients.has(p) ? "test" : "train",
      })),
    );
  }, []);

  const leaked = assign.filter((imgs) => {
    const s = new Set(imgs.map((i) => i[mode]));
    return s.size > 1;
  }).length;

  return (
    <Section
      id="problem"
      eyebrow="The problem"
      title={<>Same patient, both sides of the split, and the score looks better than it should.</>}
      lede="Mini-DDSM stores several views per patient. If the CC and MLO images of one patient fall into both training and test sets, the model is partly tested on a person it has already seen. Patient grouping is part of the experiment design, not a minor preprocessing detail."
    >
      <Reveal>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "image", label: "Image-level split" },
                { value: "patient", label: "Patient-grouped split" },
              ]}
            />
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                leaked ? "bg-rose-soft text-rose-deep" : "bg-teal-soft text-teal"
              }`}
            >
              {leaked ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
              {leaked ? `${leaked} of ${PATIENTS} patients leak into test` : "0 patients leak — test set is independent"}
            </motion.div>
          </div>

          <div className="grid gap-px bg-line md:grid-cols-2">
            {(["train", "test"] as const).map((side) => (
              <div key={side} className="bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {side === "train" ? "Training set" : "Test set"}
                  </span>
                  <span className="num text-xs text-faint">
                    {assign.flat().filter((i) => i[mode] === side).length} images
                  </span>
                </div>
                <div className="flex min-h-[148px] flex-wrap content-start gap-2">
                  {assign.map((imgs, p) =>
                    imgs.map((img, v) =>
                      img[mode] === side ? (
                        <motion.div
                          layout
                          layoutId={`p${p}v${v}`}
                          key={`p${p}v${v}`}
                          transition={{ type: "spring", stiffness: 260, damping: 28 }}
                          className="relative grid h-9 w-9 place-items-center rounded-lg text-[10px] font-semibold text-white"
                          style={{
                            background: hues[p % hues.length],
                            opacity: 0.35 + (p % 3) * 0.25,
                            outline:
                              new Set(imgs.map((i) => i[mode])).size > 1 ? "2px solid var(--color-rose)" : "none",
                            outlineOffset: 2,
                          }}
                          title={`Patient ${p + 1}, view ${v + 1}`}
                        >
                          P{p + 1}
                        </motion.div>
                      ) : null,
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-line bg-paper-2/60 px-6 py-3 text-xs text-muted">
            Illustration: each tile is one mammogram; same label = same patient. Rose outlines mark patients whose images appear on both sides.
          </p>
        </Card>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { t: "Prior work isn’t directly comparable", d: "Several published Mini-DDSM accuracies (0.87–0.99) don’t report whether every image of a patient stayed in one partition." },
          { t: "IDs collide across classes", d: "A_1500, A_1511 and A_1632 appear in both the Benign and Cancer folders, so a naive key would merge different people." },
          { t: "One split isn’t enough", d: "A single lucky fold can flatter any model. We repeat the full 3-fold experiment with seeds 42, 123 and 2026." },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-line bg-card/70 p-6">
              <span className="font-mono text-xs text-rose">0{i + 1}</span>
              <h3 className="mt-2 text-base font-semibold text-ink">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
