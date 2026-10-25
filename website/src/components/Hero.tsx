"use client";

import { ArrowDown, Calendar, FileText, MapPin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { affiliation, authors, headline, paper } from "@/data/site";
import { CountUp, GithubIcon } from "./ui";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section id="top" className="grain relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 md:pt-40 md:pb-28">
      <div className="hairline-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-wrap items-center gap-2 text-xs text-muted"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft px-3 py-1 font-semibold text-gold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> {paper.venueShort} · Paper #{paper.paperId}
            </span>
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {paper.location}</span>
            <span className="inline-flex items-center gap-1"><Calendar size={12} /> {paper.dates}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="mt-6 font-serif text-[2.6rem] leading-[1.04] tracking-tight text-ink sm:text-5xl md:text-[4.1rem]"
          >
            Multi-Backbone Ensemble Learning for <span className="text-gradient italic">Robust</span> Breast Cancer
            Classification on Mini-DDSM
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            Mammography accuracy looks better than it is when one patient&apos;s images land on both sides of the split.
            We rebuilt the Mini-DDSM evaluation around <strong className="font-semibold text-ink-2">audited patient groups</strong>, then
            showed that a simple, untuned two-backbone ensemble still wins.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-7 text-sm leading-relaxed"
          >
            <p className="text-ink-2">
              {authors.map((a, i) => (
                <span key={a.name}>
                  <span className={a.lead ? "font-semibold text-ink" : ""}>{a.name}</span>
                  {i < authors.length - 1 && <span className="text-faint">,&nbsp; </span>}
                </span>
              ))}
            </p>
            <p className="mt-1 text-muted">
              {affiliation.dept} · {affiliation.uni}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a href={paper.pdf} target="_blank" className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 hover:bg-ink-2">
              <FileText size={16} /> Read the paper
            </a>
            <a href={paper.code} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-card px-6 py-3 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-ink/30">
              <GithubIcon size={16} /> Code &amp; audit files
            </a>
            <a href="#demo" className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose-soft px-6 py-3 text-sm font-medium text-rose-deep transition hover:-translate-y-0.5">
              <Sparkles size={15} /> Try the live demo
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-rose-soft via-card to-indigo-soft blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-3 shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[464/470] overflow-hidden rounded-[1.5rem]">
              <Image src="/figures/gc_tp_overlay.jpg" alt="Grad-CAM overlay on a mammogram with a correctly detected lesion" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-paper">
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Grad-CAM · qualitative</p>
                <div className="mt-1 flex items-end justify-between">
                  <span className="font-serif text-4xl">Cancer</span>
                  <span className="rounded-full bg-rose px-3 py-1 text-xs font-semibold">True positive</span>
                </div>
              </div>
            </div>
          </div>

          {[
            { k: "EfficientNet-B4", v: "0.882", c: "bg-gold", pos: "-left-4 top-10 sm:-left-10", d: 0.6 },
            { k: "ConvNeXtV2-Tiny", v: "0.857", c: "bg-indigo", pos: "-right-3 top-1/3 sm:-right-8", d: 0.75 },
            { k: "Ensemble AUC", v: "0.891", c: "bg-rose", pos: "-left-3 bottom-24 sm:-left-12", d: 0.9 },
          ].map((chip) => (
            <motion.div
              key={chip.k}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{ opacity: { delay: chip.d, duration: 0.5 }, y: { delay: chip.d, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
              className={`absolute ${chip.pos} flex items-center gap-2.5 rounded-2xl border border-line bg-card/95 px-3.5 py-2.5 shadow-[var(--shadow-lift)] backdrop-blur`}
            >
              <span className={`h-2 w-2 rounded-full ${chip.c}`} />
              <span className="text-xs text-muted">{chip.k}</span>
              <span className="num font-mono text-sm font-semibold text-ink">{chip.v}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="relative mx-auto mt-20 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label} className="bg-card/90 px-6 py-7 backdrop-blur">
            <div className="font-serif text-4xl text-ink md:text-5xl">
              <CountUp to={h.value} digits={h.digits} suffix={h.suffix} />
            </div>
            <div className="mt-2 text-sm font-medium text-ink-2">{h.label}</div>
            <div className="text-xs text-faint">{h.sub}</div>
          </div>
        ))}
      </div>

      <a href="#problem" className="relative mx-auto mt-12 flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-faint transition hover:text-muted">
        <ArrowDown size={14} className="animate-bounce" /> Scroll
      </a>
    </section>
  );
}
