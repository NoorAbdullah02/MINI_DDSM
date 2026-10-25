"use client";

import { ArrowUp } from "lucide-react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useState } from "react";

// A thin, three-colour progress line fixed to the very top of the viewport —
// tracks whole-page scroll with a light spring so it never feels jittery.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, var(--color-rose), var(--color-indigo), var(--color-teal))",
      }}
    />
  );
}

// Appears once the reader has scrolled roughly a screen's worth, with a
// spring pop-in; scrolls smoothly back to the hero on click.
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setVisible(v > 900));

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: 20, pointerEvents: "none" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-line bg-card text-ink-2 shadow-[var(--shadow-lift)] sm:bottom-8 sm:right-8"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="21" fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <motion.circle
          cx="24"
          cy="24"
          r="21"
          fill="none"
          stroke="var(--color-rose)"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          style={{ pathLength: scrollYProgress }}
        />
      </svg>
      <ArrowUp size={18} />
    </motion.button>
  );
}
