"use client";

import { ArrowUpRight, HelpCircle, ShieldCheck, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { relatedWork } from "@/data/site";
import { Card, Reveal, Section } from "./ui";

function GroupBadge({ grouped }: { grouped: boolean | undefined }) {
  if (grouped === false)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2.5 py-1 text-[11px] font-medium text-rose-deep">
        <XCircle size={12} /> Not reported
      </span>
    );
  if (grouped === undefined)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-medium text-muted">
        <HelpCircle size={12} /> Unclear
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 text-[11px] font-medium text-teal">
      <ShieldCheck size={12} /> Audited
    </span>
  );
}

export function Compare() {
  const maxVal = 1.0;
  return (
    <Section
      id="compare"
      eyebrow="Related work"
      title="Why a lower headline number can be the more trustworthy one."
      lede="A short web search for Mini-DDSM results turns up accuracies from 0.61 to 0.99 — a 38-point spread on the same public dataset. None of these studies' released splits confirm whether a patient's images were kept on one side. This is context, not a leaderboard: without a shared, audited protocol, these numbers are not directly comparable to ours or to each other."
      className="bg-paper-2/50"
    >
      <Reveal>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-2/60 text-xs text-muted">
                  <th className="px-6 py-3 text-left font-medium">Study</th>
                  <th className="px-3 py-3 text-left font-medium">Method</th>
                  <th className="px-3 py-3 text-left font-medium">Patient grouping</th>
                  <th className="px-3 py-3 text-right font-medium">Reported accuracy</th>
                </tr>
              </thead>
              <tbody>
                {relatedWork.map((r, i) => (
                  <tr key={r.study} className="border-b border-line/70">
                    <td className="px-6 py-3.5">
                      <a href={r.href} target="_blank" rel="noopener" className="group inline-flex items-center gap-1 font-medium text-ink-2 hover:text-rose">
                        {r.study} <span className="text-faint">· {r.year}</span>
                        <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                      <div className="text-xs text-faint">{r.venue}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-2">{r.method}</td>
                    <td className="px-3 py-3.5"><GroupBadge grouped={r.grouped} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-2">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(("valueHigh" in r ? (r.value + (r as { valueHigh: number }).valueHigh) / 2 : r.value) / maxVal) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-ink-2/60"
                          />
                        </div>
                        <span className="num w-16 text-right font-mono text-ink">
                          {"valueHigh" in r ? `${(r.value * 100).toFixed(0)}–${((r as { valueHigh: number }).valueHigh * 100).toFixed(0)}%` : `${(r.value * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-rose-soft/40">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-ink">This work</span> <span className="text-faint">· 2026</span>
                    <div className="text-xs text-rose-deep">IEEE CSDE 2026</div>
                  </td>
                  <td className="px-3 py-4 text-ink-2">EfficientNet-B4 + ConvNeXtV2-Tiny, fixed 50/50</td>
                  <td className="px-3 py-4"><GroupBadge grouped={true} /></td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "81.2%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-rose"
                        />
                      </div>
                      <span className="num w-16 text-right font-mono font-semibold text-ink">81.2%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-paper-2/40 px-6 py-4 text-xs leading-relaxed text-muted">
            Our 81.2% is patient-level accuracy, meaned over 3 repeated seeds, on an outer-test fold that shares no patient with training — reported with
            a 95% bootstrap interval (79.8–81.6%). Everything above is image- or study-reported accuracy under an unstated split, included only so the
            spread is visible, not so a single number can be picked as &ldquo;the&rdquo; benchmark.
          </p>
        </Card>
      </Reveal>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          { t: "Not the highest number", d: "0.812 sits below four of the five prior reports here — by design, not by accident." },
          { t: "The only audited split", d: "2,417 patient groups, 0 cross-fold overlap, verified on all 9 seed–fold combinations — checkable in the repo." },
          { t: "Repeated, not lucky", d: "3 seeds × 3 folds with bootstrap confidence intervals, so the number comes with its own uncertainty." },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-line bg-card/70 p-6">
              <ShieldCheck size={18} className="text-teal" />
              <h3 className="mt-3 text-base font-semibold text-ink">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
