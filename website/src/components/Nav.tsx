"use client";

import { FileText, Menu, Presentation, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { paper } from "@/data/site";
import { GithubIcon } from "./ui";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#audit", label: "Data audit" },
  { href: "#method", label: "Method" },
  { href: "#results", label: "Results" },
  { href: "#demo", label: "Live demo" },
  { href: "#explain", label: "Grad-CAM" },
  { href: "#cite", label: "Cite" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line/80 bg-paper/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-soft">
            <span className="h-3 w-3 rounded-full bg-rose" />
          </span>
          <span className="whitespace-nowrap font-serif text-lg text-ink">Mini-DDSM</span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted sm:inline">
            {paper.venueShort}
          </span>
        </a>

        <div className="hidden items-center gap-6 xl:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="whitespace-nowrap text-sm text-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/present"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-sm font-medium text-ink-2 transition hover:border-line-2 hover:text-ink"
          >
            <Presentation size={15} /> Present
          </Link>
          <a
            href={paper.pdf}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2"
          >
            <FileText size={15} /> Paper
          </a>
        </div>

        <button className="text-ink xl:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper px-4 pb-6 xl:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-ink-2">
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2">
            <a href={paper.pdf} target="_blank" className="flex-1 rounded-full bg-ink py-2.5 text-center text-sm text-paper">
              Paper
            </a>
            <a href={paper.code} target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm text-ink">
              <GithubIcon size={14} /> Code
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
