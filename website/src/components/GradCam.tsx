"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { gradcam } from "@/data/site";
import { Card, Reveal, Section } from "./ui";

export function GradCam() {
  const [sel, setSel] = useState(gradcam[0].key);
  const [split, setSplit] = useState(50);
  const cur = gradcam.find((g) => g.key === sel)!;

  return (
    <Section
      id="explain"
      eyebrow="Explainability"
      title="Where does the network look?"
      lede="Grad-CAM is used as a transparency aid only. No overlap metric was computed against radiologist outlines, so these are illustrations — not validated lesion localisation."
    >
      <Reveal>
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="border-b border-line p-4 lg:border-r lg:border-b-0">
              {gradcam.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setSel(g.key)}
                  className={`relative mb-1 w-full rounded-2xl px-4 py-3.5 text-left transition ${sel === g.key ? "" : "hover:bg-paper-2/70"}`}
                >
                  {sel === g.key && <motion.span layoutId="gc-sel" className="absolute inset-0 rounded-2xl bg-rose-soft/70" />}
                  <span className="relative block text-sm font-semibold text-ink">{g.label}</span>
                  <span className="relative mt-0.5 block text-xs leading-relaxed text-muted">{g.note}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.3fr_1fr]">
              <div>
                <div className="relative aspect-[464/470] select-none overflow-hidden rounded-2xl bg-paper-2">
                  <AnimatePresence mode="popLayout">
                    <motion.div key={sel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                      <Image src={`/figures/gc_${sel}_original.jpg`} alt={`${cur.label} — original mammogram`} fill className="object-cover" sizes="500px" />
                      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
                        <Image src={`/figures/gc_${sel}_overlay.jpg`} alt={`${cur.label} — Grad-CAM overlay`} fill className="object-cover" sizes="500px" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-y-0" style={{ left: `${split}%` }}>
                    <div className="h-full w-0.5 -translate-x-1/2 bg-white/90 shadow" />
                    <div className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs text-ink shadow-[var(--shadow-lift)]">⇆</div>
                  </div>
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-2">Original</span>
                  <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-2">Grad-CAM</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={split}
                    onChange={(e) => setSplit(+e.target.value)}
                    aria-label="Compare original and Grad-CAM"
                    className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-faint">Drag to compare</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative aspect-[464/470] overflow-hidden rounded-2xl bg-paper-2">
                  <Image src={`/figures/gc_${sel}_heatmap.jpg`} alt={`${cur.label} — heatmap`} fill className="object-cover" sizes="300px" />
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-2">Heatmap</span>
                </div>
                <div className="rounded-2xl border border-line p-4 text-xs leading-relaxed text-muted">
                  Grad-CAM may respond to texture, borders or preprocessing artefacts as well as pathology. Outlines are dataset annotations.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
