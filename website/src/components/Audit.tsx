"use client";

import { motion } from "motion/react";
import { audit, classCounts } from "@/data/site";
import { Card, Reveal, Section } from "./ui";

const max = Math.max(...classCounts.map((c) => c.images));

export function Audit() {
  return (
    <Section
      id="audit"
      eyebrow="Data audit"
      title="Before any fold is built, every identifier is audited."
      lede="Grouping key = class_folder::raw_patient_id. Ambiguous records are kept together rather than split across folds — conservative by design."
      className="bg-paper-2/50"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Card className="h-full p-7">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Class distribution</h3>
            <div className="mt-8 space-y-6">
              {classCounts.map((c, i) => (
                <div key={c.name}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="num text-sm text-muted">
                      <span className="font-semibold text-ink">{c.images.toLocaleString()}</span> images · {c.groups} groups
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-paper-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(c.images / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-dashed border-line-2 p-5">
              <p className="text-sm text-muted">Binary task</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-full bg-teal-soft px-3 py-1 text-sm font-medium text-teal">Normal + Benign → Not-Cancer · 1,518</span>
                <span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-medium text-rose-deep">Cancer · 899</span>
              </div>
              <p className="mt-3 text-xs text-faint">Patient groups. Each outer fold: 805–806 groups, 299–300 Cancer.</p>
            </div>
          </Card>
        </Reveal>

        <div className="grid grid-cols-2 gap-4">
          {audit.map((a, i) => (
            <Reveal key={a.label} delay={i * 0.06}>
              <div className="group h-full rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <div className={`font-serif text-4xl ${a.value === "0" ? "text-teal" : "text-ink"}`}>{a.value}</div>
                <div className="mt-2 text-sm font-semibold text-ink-2">{a.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted">{a.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card p-5 font-mono text-[13px] leading-6 text-ink-2">
          <span className="text-faint"># grouping key prevents unrelated records from merging</span>
          <br />
          <span className="text-indigo">key</span> = <span className="text-rose">&quot;Benign::A_1500&quot;</span>
          <span className="text-faint">{"   "}≠{"   "}</span>
          <span className="text-indigo">key</span> = <span className="text-rose">&quot;Cancer::A_1500&quot;</span>
          <br />
          <span className="text-indigo">assert</span> train_keys ∩ test_keys == ∅{"  "}
          <span className="text-teal">✓ all 9 seed–fold splits</span>
        </div>
      </Reveal>
    </Section>
  );
}
