"use client";

import { Check, Copy, FileText, Mail } from "lucide-react";
import { useState } from "react";
import { affiliation, authors, bibtex, paper } from "@/data/site";
import { Card, GithubIcon, Reveal, Section } from "./ui";

export function Takeaways() {
  const items = [
    { t: "Protocol first", d: "Collision-aware patient keys, SHA-256 duplicate audit and 0 cross-fold groups on every split." },
    { t: "Simple ensemble wins", d: "Fixed 50/50 average: ROC-AUC 0.891 vs 0.882 (B4), 0.857 (ConvNeXtV2), 0.878 (single-best)." },
    { t: "Thresholds matter", d: "Train-side Youden raises sensitivity 0.62 → 0.79 and cuts missed cancers from ~343 to ~191 per seed." },
    { t: "Honest limits", d: "One dataset, three folds, qualitative Grad-CAM. Next: CBIS-DDSM / INbreast and radiologist review." },
  ];
  return (
    <Section id="takeaways" eyebrow="Takeaways" title="What to remember.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.t} delay={i * 0.06}>
            <div className="h-full rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="font-serif text-5xl text-rose/25">{i + 1}</div>
              <h3 className="mt-3 text-base font-semibold text-ink">{it.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{it.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function Cite() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <Section id="cite" eyebrow="Citation" title="Cite this work." className="bg-paper-2/50">
      <Reveal>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-xs text-muted">BibTeX</span>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-2 transition hover:border-line-2">
              {copied ? <Check size={13} className="text-teal" /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-ink-2">{bibtex}</pre>
        </Card>
      </Reveal>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={paper.pdf} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2"><FileText size={15} /> Paper PDF</a>
        <a href={paper.code} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-card px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"><GithubIcon size={15} /> GitHub repository</a>
      </div>
    </Section>
  );
}

export function Team() {
  return (
    <Section id="team" eyebrow="Team" title="The people behind the study.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a, i) => {
          const initials = a.name.replace(/\./g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
          return (
            <Reveal key={a.name} delay={i * 0.05}>
              <div className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-serif text-lg text-white"
                  style={{ background: ["var(--color-rose)", "var(--color-indigo)", "var(--color-teal)", "var(--color-gold)", "#8a4fbf", "var(--color-ink-2)"][i % 6] }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{a.name}</div>
                  <div className="text-xs text-muted">{a.supervisor ? "Supervisor" : a.lead ? "First author" : "Co-author"} · BAUET ICE</div>
                  <a href={`mailto:${a.email}`} className="mt-1 inline-flex items-center gap-1 truncate text-xs text-faint transition hover:text-rose">
                    <Mail size={11} /> {a.email}
                  </a>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted">
        {affiliation.dept}, {affiliation.uni}, {affiliation.place}.
      </p>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <span>
          © 2026 The authors · {paper.venueShort}, {paper.location}
        </span>
        <span>Mini-DDSM: Lekamlage et al., DMIP 2020. Images shown for research illustration.</span>
      </div>
      <p className="mx-auto mt-4 max-w-6xl text-[11px] leading-relaxed text-faint">
        Paper © 2026 IEEE. Personal use of this material is permitted. Permission from IEEE must be obtained for all other uses, in any current or
        future media, including reprinting/republishing this material for advertising or promotional purposes, creating new collective works, for
        resale or redistribution to servers or lists, or reuse of any copyrighted component of this work in other works.
      </p>
    </footer>
  );
}
