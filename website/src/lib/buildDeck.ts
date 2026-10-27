// The slide-by-slide builder shared by both export paths:
//  - src/lib/exportPptx.ts   (runs in the visitor's browser, "Download .pptx")
//  - scripts/generate-pptx.ts (runs in Node at release time, for a pptx
//    committed straight to the repo — a working backup with no internet,
//    no browser, and no build step needed at the venue)
// Takes a PptxGenJS presentation and already-resolved image/QR data URIs;
// knows nothing about how those were fetched, so it works the same in both.

import type PptxGenJS from "pptxgenjs";
import results from "../data/results.json";
import { deckNotes } from "../data/deckNotes";
import { affiliation, audit, authors, comparison, operatingPoints, paper } from "../data/site";

// The official IEEE CSDE 2026 template's own palette (ppt/theme/theme1.xml
// in IEEE_CSDE_2026_Template.pptx) — matches the website's /present, which
// re-skins to the same colors.
const C = {
  paper: "FFFFFF",
  card: "FFFFFF",
  line: "DCE6F0",
  ink: "1A2433",
  ink2: "0B2545",
  muted: "5C6B7A",
  faint: "8DA9C4",
  rose: "D1495B",
  roseSoft: "FBE8EA",
  roseDeep: "A83349",
  teal: "1C7293",
  tealSoft: "E3EEF2",
  indigo: "3E7CB1",
  indigoSoft: "E8F0F7",
  gold: "F2A900",
  goldSoft: "FDF1D9",
} as const;

// Cambria / Calibri — the template's own fonts, present on every real
// PowerPoint install (LibreOffice substitutes its own metric-compatible
// clones automatically, same as this repo's web fonts do).
const SERIF = "Cambria";
const SANS = "Calibri";
const MONO = "Courier New";

// Downsample the 51-point ROC grid to a clean, editable ~13-point chart.
function downsample<T>(arr: T[], n: number): T[] {
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

export type DeckAssets = {
  pipeline: string;
  qr: string;
  gcTp: string;
  gcTn: string;
  gcFp: string;
  gcFn: string;
  logo: string;
};

export function buildDeck(pres: PptxGenJS, { pipeline, qr, gcTp, gcTn, gcFp, gcFn, logo }: DeckAssets) {
  pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pres.layout = "WIDE";
  pres.author = authors.find((a) => a.lead)?.name ?? authors[0].name;
  pres.title = paper.title;
  pres.subject = paper.venue;

  const MX = 0.75; // stage margin
  const W = 13.333 - MX * 2;

  const base = () => {
    const s = pres.addSlide();
    s.background = { color: C.paper };
    s.addText(`${paper.venueShort} · Mini-DDSM patient-grouped ensemble`, {
      x: MX, y: 7.08, w: 7, h: 0.3, fontFace: SANS, fontSize: 9, color: C.faint,
    });
    return s;
  };
  type Slide = ReturnType<typeof base>;
  const kicker = (s: Slide, text: string) => {
    s.addShape(pres.ShapeType.line, { x: MX, y: 0.72, w: 0.5, h: 0, line: { color: C.rose, width: 1.5 } });
    s.addText(text.toUpperCase(), { x: MX + 0.6, y: 0.58, w: 8, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, color: C.rose, charSpacing: 2 });
  };
  const title = (s: Slide, text: string, opts: Partial<{ fontSize: number; w: number }> = {}) =>
    s.addText(text, { x: MX, y: 1.05, w: opts.w ?? W, h: 1.3, fontFace: SERIF, fontSize: opts.fontSize ?? 30, color: C.ink, valign: "top", lineSpacingMultiple: 1.08 });

  const statBox = (s: Slide, x: number, y: number, w: number, h: number, value: string, label: string, note?: string, accent: string = C.ink) => {
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
    s.addText(value, { x: x + 0.25, y: y + 0.15, w: w - 0.5, h: h * 0.5, fontFace: SERIF, fontSize: 26, color: accent, valign: "top" });
    s.addText(label, { x: x + 0.25, y: y + h * 0.58, w: w - 0.5, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, color: C.ink2 });
    if (note) s.addText(note, { x: x + 0.25, y: y + h * 0.58 + 0.28, w: w - 0.5, h: h * 0.3, fontFace: SANS, fontSize: 9.5, color: C.muted });
  };

  // 1 — Title
  {
    const s = base();
    s.addNotes(deckNotes[0]);
    s.addImage({ data: logo, x: MX, y: 0.5, w: 0.7, h: 0.7 });
    s.addShape(pres.ShapeType.roundRect, {
      x: MX + 0.9, y: 0.65, w: 5.3, h: 0.42, rectRadius: 0.21, fill: { color: C.goldSoft }, line: { color: C.gold, width: 0.75 },
    });
    s.addText(`${paper.venueShort} · Paper #${paper.paperId} · ${paper.location}`, {
      x: MX + 1.05, y: 0.65, w: 5, h: 0.42, fontFace: SANS, fontSize: 11, bold: true, color: C.gold, valign: "middle",
    });
    s.addText(
      [{ text: "Multi-Backbone Ensemble Learning for ", options: {} }, { text: "Robust", options: { italic: true, color: C.rose } }, { text: " Breast Cancer Classification on Mini-DDSM", options: {} }],
      { x: MX, y: 1.25, w: W, h: 2.1, fontFace: SERIF, fontSize: 38, color: C.ink, lineSpacingMultiple: 1.05, valign: "top" },
    );
    s.addText(authors.map((a) => a.name).join("   ·   "), { x: MX, y: 3.5, w: W, h: 0.5, fontFace: SANS, fontSize: 15, color: C.ink2 });
    s.addText(`${affiliation.dept} · ${affiliation.uni}`, { x: MX, y: 3.95, w: W, h: 0.4, fontFace: SANS, fontSize: 12, color: C.muted });
    const chips: [string, string][] = [["ROC-AUC", "0.891"], ["Patient groups", "2,417"], ["Leaked groups", "0"]];
    chips.forEach(([k, v], i) => {
      const x = MX + i * 2.2;
      s.addShape(pres.ShapeType.roundRect, { x, y: 4.7, w: 2, h: 0.95, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(v, { x: x + 0.15, y: 4.78, w: 1.7, h: 0.5, fontFace: MONO, fontSize: 20, bold: true, color: C.ink });
      s.addText(k, { x: x + 0.15, y: 5.28, w: 1.7, h: 0.3, fontFace: SANS, fontSize: 10, color: C.muted });
    });
  }

  // 1b — Agenda
  {
    const s = base();
    s.addNotes(deckNotes[14]);
    kicker(s, "Agenda");
    title(s, "What this talk covers.", { fontSize: 28 });
    const items: [string, string][] = [
      ["The problem", "Why same-patient splits inflate accuracy"],
      ["Data audit & method", "Patient grouping, pipeline, protocol"],
      ["Results", "Ensemble vs. backbones, operating points"],
      ["Calibration & Grad-CAM", "Beyond AUC, qualitative explainability"],
      ["Limitations", "What this study does not claim"],
      ["References & Q&A", "Sources, then your questions"],
    ];
    items.forEach(([t, d], i) => {
      const x = MX + (i % 3) * (W / 3 + 0.1);
      const y = 2.9 + Math.floor(i / 3) * 1.9;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: W / 3 - 0.1, h: 1.7, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.25, y: y + 0.2, w: 1, h: 0.4, fontFace: MONO, fontSize: 13, bold: true, color: C.indigo });
      s.addText(t, { x: x + 0.25, y: y + 0.65, w: W / 3 - 0.6, h: 0.6, fontFace: SANS, fontSize: 14, bold: true, color: C.ink });
      s.addText(d, { x: x + 0.25, y: y + 1.15, w: W / 3 - 0.6, h: 0.5, fontFace: SANS, fontSize: 10.5, color: C.muted });
    });
  }

  // 2 — Motivation
  {
    const s = base();
    s.addNotes(deckNotes[1]);
    kicker(s, "Why it matters");
    title(s, "2.43 million women were diagnosed with breast cancer in 2024.", { fontSize: 27, w: 7.6 });
    s.addText("Benign and malignant findings look alike and readers are overloaded. AI can help — if its accuracy is real.", {
      x: MX, y: 2.65, w: 7.3, h: 1.2, fontFace: SANS, fontSize: 14, color: C.muted, lineSpacingMultiple: 1.3,
    });
    s.addChart(
      pres.ChartType.bar,
      [{ name: "New cases (millions)", labels: ["GLOBOCAN 2020", "GLOBOCAN 2022", "GLOBOCAN 2024"], values: [2.3, 2.3, 2.43] }],
      {
        x: 8.5, y: 1.1, w: 4.1, h: 4.3,
        chartColors: [C.ink2, C.ink2, C.rose],
        barGapWidthPct: 40,
        showLegend: false, showTitle: false, showValue: true,
        dataLabelFormatCode: "0.00",
        dataLabelFontSize: 11, dataLabelColor: C.ink, dataLabelPosition: "outEnd",
        catAxisLabelFontSize: 10, catAxisLabelColor: C.muted,
        valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 2.7,
        catGridLine: { style: "none" }, valGridLine: { style: "none" },
      },
    );
  }

  // 3 — The problem
  {
    const s = base();
    s.addNotes(deckNotes[2]);
    kicker(s, "The problem");
    title(s, "Same patient on both sides of the split → inflated scores.", { fontSize: 26 });
    const panels: [string, boolean][] = [["Image-level split", false], ["Patient-grouped split", true]];
    panels.forEach(([label, ok], pi) => {
      const x = MX + pi * (W / 2 + 0.3);
      const w = W / 2 - 0.15;
      s.addShape(pres.ShapeType.roundRect, { x, y: 2.7, w, h: 3.3, rectRadius: 0.1, fill: { color: ok ? C.tealSoft : C.roseSoft }, line: { color: ok ? C.teal : C.rose, width: 0.75 } });
      s.addText(`${label}  ${ok ? "✓" : "⚠"}`, { x: x + 0.3, y: 2.9, w: w - 0.6, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, color: ok ? C.teal : C.roseDeep });
      const groupsTrain = ok ? [1, 1, 1, 1, 2, 2, 2, 2] : [1, 2, 1, 3, 2, 4, 1, 3];
      const groupsTest = ok ? [3, 3, 3, 3, 4, 4, 4, 4] : [3, 1, 2, 1, 1, 2, 3, 1];
      ([["Train", groupsTrain, 0], ["Test", groupsTest, 1]] as const).forEach(([lbl, grid, col]) => {
        const gx = x + 0.3 + col * (w / 2 - 0.1);
        s.addText(lbl, { x: gx, y: 3.35, w: 2, h: 0.25, fontFace: SANS, fontSize: 9, bold: true, color: C.muted, charSpacing: 1 });
        grid.forEach((p, gi) => {
          const cols = [C.rose, C.indigo, C.teal, C.gold];
          const cx = gx + (gi % 4) * 0.42;
          const cy = 3.65 + Math.floor(gi / 4) * 0.42;
          s.addShape(pres.ShapeType.roundRect, { x: cx, y: cy, w: 0.36, h: 0.36, rectRadius: 0.06, fill: { color: cols[(p - 1) % 4] } });
          s.addText(`P${p}`, { x: cx, y: cy, w: 0.36, h: 0.36, fontFace: SANS, fontSize: 8, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
        });
      });
      s.addText(ok ? "No patient appears in both sets." : "P1, P2, P3 leak into the test set.", { x: x + 0.3, y: 5.5, w: w - 0.6, h: 0.4, fontFace: SANS, fontSize: 11, color: C.ink2 });
    });
  }

  // 4 — Data audit
  {
    const s = base();
    s.addNotes(deckNotes[3]);
    kicker(s, "Contribution 1 · Data audit");
    title(s, "Every identifier audited before a single fold is built.", { fontSize: 26 });
    const cols = 3, gw = (W - 0.4) / cols;
    audit.forEach((a, i) => {
      const x = MX + (i % cols) * (gw + 0.2);
      const y = 2.75 + Math.floor(i / cols) * 1.75;
      statBox(s, x, y, gw, 1.6, a.value, a.label, a.note, a.value === "0" ? C.teal : C.ink);
    });
  }

  // 5 — Pipeline
  {
    const s = base();
    s.addNotes(deckNotes[4]);
    kicker(s, "Contribution 2 · Method");
    title(s, "Simple pipeline. Fixed 50/50 ensemble. No test-set tuning.", { fontSize: 26 });
    s.addImage({ data: pipeline, x: MX, y: 2.7, w: W, h: 4.1, sizing: { type: "contain", w: W, h: 4.1 } });
  }

  // 6 — Protocol
  {
    const s = base();
    s.addNotes(deckNotes[5]);
    kicker(s, "Contribution 3 · Protocol");
    title(s, "Nested, patient-grouped, repeated three times.", { fontSize: 26 });
    s.addShape(pres.ShapeType.roundRect, { x: MX, y: 2.8, w: 4.9, h: 2.1, rectRadius: 0.1, fill: { color: C.indigoSoft }, line: { color: C.indigo, width: 0.75 } });
    s.addText("OUTER TRAINING", { x: MX + 0.3, y: 2.95, w: 4, h: 0.3, fontFace: SANS, fontSize: 10, bold: true, color: C.indigo, charSpacing: 1 });
    s.addText([{ text: "Inner train 88%\n", options: { bold: true, color: C.ink } }, { text: "model weights", options: { color: C.muted } }], { x: MX + 0.3, y: 3.4, w: 2.1, h: 1.3, fontFace: SANS, fontSize: 11, fill: { color: C.card } });
    s.addText([{ text: "Val 12%\n", options: { bold: true, color: C.ink } }, { text: "ckpt · threshold · Platt", options: { color: C.muted } }], { x: MX + 2.6, y: 3.4, w: 2, h: 1.3, fontFace: SANS, fontSize: 11, fill: { color: C.card } });
    s.addText("→", { x: MX + 5.0, y: 3.4, w: 0.6, h: 1.0, fontFace: SANS, fontSize: 30, color: C.rose, align: "center" });
    s.addShape(pres.ShapeType.roundRect, { x: MX + 5.7, y: 2.8, w: 4.9, h: 2.1, rectRadius: 0.1, fill: { color: C.roseSoft }, line: { color: C.rose, width: 0.75 } });
    s.addText("OUTER TEST", { x: MX + 6, y: 2.95, w: 4, h: 0.3, fontFace: SANS, fontSize: 10, bold: true, color: C.rose, charSpacing: 1 });
    s.addText([{ text: "Untouched until the end\n", options: { bold: true, color: C.ink } }, { text: "same TTA · patient-level metrics", options: { color: C.muted } }], { x: MX + 6, y: 3.4, w: 4.3, h: 1.3, fontFace: SANS, fontSize: 11, fill: { color: C.card } });
    ["StratifiedGroupKFold × 3", "Seeds 42 · 123 · 2026", "2,000 patient bootstraps"].forEach((t, i) => {
      s.addShape(pres.ShapeType.roundRect, { x: MX + i * 3.5, y: 5.3, w: 3.3, h: 0.55, rectRadius: 0.27, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(t, { x: MX + i * 3.5, y: 5.3, w: 3.3, h: 0.55, fontFace: SANS, fontSize: 11, color: C.ink2, align: "center", valign: "middle" });
    });
  }

  // 7 — Main result
  {
    const s = base();
    s.addNotes(deckNotes[6]);
    kicker(s, "Results");
    title(s, "Ensemble ROC-AUC 0.891 ± 0.008", { fontSize: 28, w: 6 });
    const rows: [string, string, string][] = [["Equal-average ensemble", "0.891", C.rose], ["EfficientNet-B4", "0.882", C.gold], ["Fold-selected single best", "0.878", C.ink2], ["ConvNeXtV2-Tiny", "0.857", C.indigo]];
    rows.forEach(([k, v, dot], i) => {
      const y = 2.6 + i * 0.68;
      s.addShape(pres.ShapeType.roundRect, { x: MX, y, w: 6, h: 0.56, rectRadius: 0.08, fill: { color: i === 0 ? C.roseSoft : C.card }, line: { color: i === 0 ? C.rose : C.line, width: 0.75 } });
      s.addShape(pres.ShapeType.ellipse, { x: MX + 0.2, y: y + 0.21, w: 0.14, h: 0.14, fill: { color: dot } });
      s.addText(k, { x: MX + 0.45, y, w: 4, h: 0.56, fontFace: SANS, fontSize: 12.5, color: C.ink2, valign: "middle" });
      s.addText(v, { x: MX + 4.3, y, w: 1.5, h: 0.56, fontFace: MONO, fontSize: 14, bold: true, color: C.ink, valign: "middle", align: "right" });
    });
    s.addText("PR-AUC 0.830 ± 0.012 · 95% t-interval 0.872–0.910", { x: MX, y: 5.45, w: 6, h: 0.4, fontFace: SANS, fontSize: 10.5, color: C.muted });

    const grid = downsample(results.rocGrid, 13);
    const idx = results.rocGrid.map((_, i) => i);
    const sampleIdx = downsample(idx, 13);
    const seriesFor = (k: keyof typeof results.roc) => sampleIdx.map((i) => results.roc[k][i]);
    s.addChart(
      pres.ChartType.line,
      [
        { name: "Equal-average ensemble", labels: grid.map((g) => g.toFixed(2)), values: seriesFor("ensemble") },
        { name: "EfficientNet-B4", labels: grid.map((g) => g.toFixed(2)), values: seriesFor("effnet") },
        { name: "ConvNeXtV2-Tiny", labels: grid.map((g) => g.toFixed(2)), values: seriesFor("convnext") },
      ],
      {
        x: 7.3, y: 1.1, w: 5.3, h: 4.6,
        chartColors: [C.rose, C.gold, C.indigo],
        lineSize: 2.5, lineDataSymbol: "none",
        showLegend: true, legendPos: "b", legendFontSize: 9,
        catAxisLabelFontSize: 8, catAxisLabelColor: C.muted, catAxisTitle: "False-positive rate", showCatAxisTitle: true, catAxisTitleFontSize: 9,
        valAxisLabelFontSize: 8, valAxisLabelColor: C.muted, valAxisTitle: "True-positive rate", showValAxisTitle: true, valAxisTitleFontSize: 9,
        valAxisMinVal: 0, valAxisMaxVal: 1,
        catGridLine: { style: "none" },
      },
    );
  }

  // 8 — Ablation
  {
    const s = base();
    s.addNotes(deckNotes[7]);
    kicker(s, "Ablation");
    title(s, "Best on 5 of 6 metrics — without learning any weights.", { fontSize: 26 });
    const header = [{ text: "Metric", options: { bold: true, color: C.muted, fontSize: 10.5 } }, ...comparison.methods.map((m, i) => ({ text: m, options: { bold: true, color: i === 3 ? C.rose : C.muted, fontSize: 10.5, align: "right" as const } }))];
    const body = comparison.rows.map((r) => {
      const best = Math.max(...r.values);
      return [
        { text: r.metric, options: { color: C.ink2, fontSize: 12 } },
        ...r.values.map((v, i) => ({ text: v.toFixed(4), options: { align: "right" as const, fontFace: MONO, fontSize: 12, bold: v === best, color: v === best ? C.ink : C.muted, fill: { color: i === 3 ? C.roseSoft : C.card } } })),
      ];
    });
    s.addTable([header, ...body], {
      x: MX, y: 2.75, w: W, h: 3.6,
      colW: [3.3, ...Array(4).fill((W - 3.3) / 4)],
      border: { type: "solid", color: C.line, pt: 0.5 },
      fontFace: SANS, valign: "middle",
      autoPage: false,
    });
  }

  // 9 — Operating point
  {
    const s = base();
    s.addNotes(deckNotes[8]);
    kicker(s, "Operating point");
    title(s, "Youden threshold: sensitivity 0.62 → 0.79", { fontSize: 27 });
    (["default", "youden"] as const).forEach((k, pi) => {
      const op = operatingPoints[k];
      const x = MX + pi * (W / 2 + 0.3);
      const w = W / 2 - 0.15;
      s.addShape(pres.ShapeType.roundRect, { x, y: 2.75, w, h: 3.3, rectRadius: 0.1, fill: { color: pi ? C.roseSoft : C.card }, line: { color: pi ? C.rose : C.line, width: 0.75 } });
      s.addText(op.label, { x: x + 0.3, y: 2.95, w: w - 0.6, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, color: C.ink });
      const metrics: [string, number][] = [["Sensitivity", op.sensitivity[0]], ["Specificity", op.specificity[0]], ["Accuracy", op.accuracy[0]]];
      metrics.forEach(([l, v], mi) => {
        const mx = x + 0.3 + mi * ((w - 0.6) / 3);
        s.addText(v.toFixed(3), { x: mx, y: 3.5, w: (w - 0.6) / 3, h: 0.6, fontFace: SERIF, fontSize: 22, color: C.ink, align: "center" });
        s.addText(l, { x: mx, y: 4.1, w: (w - 0.6) / 3, h: 0.3, fontFace: SANS, fontSize: 9.5, color: C.muted, align: "center" });
      });
      s.addText([{ text: "Missed cancers per seed: ", options: { color: C.roseDeep } }, { text: op.missed.join(" · "), options: { bold: true, fontFace: MONO, color: C.roseDeep } }], { x: x + 0.3, y: 4.7, w: w - 0.6, h: 0.9, fontFace: SANS, fontSize: 12 });
    });
  }

  // 10 — Calibration
  {
    const s = base();
    s.addNotes(deckNotes[9]);
    kicker(s, "Beyond AUC");
    title(s, "Calibrated probabilities and positive net benefit.", { fontSize: 27 });
    const stats: [string, string, string][] = [["0.136 → 0.124", "Brier score (Platt)", C.teal], ["0.075 → 0.023", "Expected calibration error", C.teal], ["0.05–0.80", "Threshold range with net benefit", C.ink]];
    stats.forEach(([v, l, c], i) => statBox(s, MX + i * (W / 3 + 0.1), 2.8, W / 3 - 0.1, 1.6, v, l, undefined, c));
    s.addText("Platt scaling fitted only on inner-validation predictions — outer labels stay reserved for evaluation.", { x: MX, y: 4.8, w: W, h: 0.6, fontFace: SANS, fontSize: 13, color: C.muted });
  }

  // 11 — Grad-CAM
  {
    const s = base();
    s.addNotes(deckNotes[10]);
    kicker(s, "Explainability");
    title(s, "Where the network looks — qualitatively.", { fontSize: 27 });
    const imgs: [string, string][] = [["True positive", gcTp], ["True negative", gcTn], ["False positive", gcFp], ["False negative", gcFn]];
    const iw = (W - 0.6) / 4;
    imgs.forEach(([label, data], i) => {
      const x = MX + i * (iw + 0.2);
      s.addImage({ data, x, y: 2.75, w: iw, h: iw, sizing: { type: "cover", w: iw, h: iw } });
      s.addText(label, { x, y: 2.75 + iw + 0.1, w: iw, h: 0.35, fontFace: SANS, fontSize: 11, color: C.ink2, align: "center" });
    });
  }

  // 12 — Limitations
  {
    const s = base();
    s.addNotes(deckNotes[11]);
    kicker(s, "Honest limits · Future work");
    title(s, "What this study does not claim.", { fontSize: 27 });
    const items: [string, string][] = [
      ["Single dataset", "Results are internal to Mini-DDSM."],
      ["Three folds", "More folds would describe split variability more finely."],
      ["Conservative groups", "Eight-image IDs kept intact; may merge distinct subjects."],
      ["Qualitative Grad-CAM", "No overlap metric against radiologist annotations."],
    ];
    items.forEach(([t, d], i) => {
      const x = MX + (i % 2) * (W / 2 + 0.2);
      const y = 2.8 + Math.floor(i / 2) * 1.35;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: W / 2 - 0.1, h: 1.15, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(t, { x: x + 0.25, y: y + 0.12, w: W / 2 - 0.6, h: 0.35, fontFace: SANS, fontSize: 13, bold: true, color: C.ink });
      s.addText(d, { x: x + 0.25, y: y + 0.5, w: W / 2 - 0.6, h: 0.55, fontFace: SANS, fontSize: 10.5, color: C.muted });
    });
    s.addText("Next → CBIS-DDSM and INbreast · richer metadata · radiologist review.", { x: MX, y: 5.7, w: W, h: 0.4, fontFace: SANS, fontSize: 13, color: C.ink2 });
  }

  // 12b — References
  {
    const s = base();
    s.addNotes(deckNotes[15]);
    kicker(s, "Sources");
    title(s, "References.", { fontSize: 28 });
    const refs = [
      "[1] H. Sung et al., “Global cancer statistics 2024,” CA Cancer J. Clin., 2026.",
      "[2] C. D. Lekamlage et al., “Mini-DDSM: Mammography age estimation,” Proc. DMIP, 2020.",
      "[3] M. Tan and Q. V. Le, “EfficientNet: Rethinking model scaling for CNNs,” Proc. ICML, 2019.",
      "[4] S. Woo et al., “ConvNeXt V2: Co-designing and scaling ConvNets with MAE,” Proc. CVPR, 2023.",
      "[5] R. R. Selvaraju et al., “Grad-CAM: Visual explanations via gradient localization,” Proc. ICCV, 2017.",
      "[6] M. Heenaye-Mamode Khan et al., “Multi-class classification of breast abnormalities,” PLOS ONE, 2021.",
      "[7] A. Sahu, P. K. Das, and S. Meher, “High accuracy hybrid CNN classifiers for breast cancer,” Biomed. Signal Process. Control, 2023.",
      "[8] Y. Khourdifi et al., “Early breast cancer detection based on deep learning,” BioMedInformatics, 2024.",
      "[9] I. Loshchilov and F. Hutter, “Decoupled weight decay regularization,” Proc. ICLR, 2019.",
      "[10] N. Otsu, “A threshold selection method from gray-level histograms,” IEEE Trans. SMC, 1979.",
    ];
    s.addShape(pres.ShapeType.roundRect, { x: MX, y: 2.7, w: W, h: 3.9, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
    refs.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      s.addText(r, { x: MX + 0.3 + col * (W / 2 - 0.2), y: 3.0 + row * 0.68, w: W / 2 - 0.5, h: 0.62, fontFace: SANS, fontSize: 10.5, color: C.ink2, valign: "top" });
    });
  }

  // 13 — Thank you
  {
    const s = base();
    s.addNotes(deckNotes[12]);
    s.addImage({ data: logo, x: 13.333 - MX - 0.6, y: 0.4, w: 0.6, h: 0.6 });
    kicker(s, "Takeaways");
    const cards: [string, string][] = [["Protocol first", "0 leaked patient groups"], ["Simple ensemble", "ROC-AUC 0.891"], ["Thresholds matter", "Sensitivity 0.79"], ["Calibrated", "ECE 0.023"]];
    cards.forEach(([t, d], i) => {
      const x = MX + (i % 2) * 3.9;
      const y = 1.1 + Math.floor(i / 2) * 1.05;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: 3.7, h: 0.9, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(String(i + 1), { x: x + 0.2, y: y + 0.1, w: 0.6, h: 0.5, fontFace: SERIF, fontSize: 20, color: C.rose, transparency: 55 });
      s.addText(t, { x: x + 0.8, y: y + 0.1, w: 2.8, h: 0.4, fontFace: SANS, fontSize: 12, bold: true, color: C.ink });
      s.addText(d, { x: x + 0.8, y: y + 0.48, w: 2.8, h: 0.35, fontFace: SANS, fontSize: 10, color: C.muted });
    });
    s.addText("Thank you.", { x: MX, y: 3.5, w: 7.3, h: 1.2, fontFace: SERIF, fontSize: 48, color: C.ink });
    s.addText([{ text: "Questions welcome · code & audit files: ", options: {} }, { text: "github.com/NoorAbdullah02/MINI_DDSM", options: { color: C.ink, hyperlink: { url: paper.code } } }], {
      x: MX, y: 4.75, w: 7.3, h: 0.4, fontFace: SANS, fontSize: 13, color: C.muted,
    });

    const qx = 10.6, qy = 1.1;
    s.addShape(pres.ShapeType.roundRect, { x: qx, y: qy, w: 2, h: 2.75, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
    s.addText("TRY IT LIVE", { x: qx, y: qy + 0.15, w: 2, h: 0.25, fontFace: SANS, fontSize: 9, bold: true, color: C.rose, align: "center", charSpacing: 1 });
    s.addImage({ data: qr, x: qx + 0.3, y: qy + 0.45, w: 1.4, h: 1.4 });
    s.addText("Scan to run the model on your phone", { x: qx + 0.1, y: qy + 1.95, w: 1.8, h: 0.5, fontFace: SANS, fontSize: 8.5, color: C.muted, align: "center" });
    s.addText("mini-ddsm-csde2026.vercel.app", { x: qx, y: qy + 2.45, w: 2, h: 0.25, fontFace: MONO, fontSize: 7, color: C.ink2, align: "center" });
  }

  // 14 — Any questions?
  {
    const s = base();
    s.addNotes(deckNotes[13]);
    const lead = authors.find((a) => a.lead) ?? authors[0];
    s.addText("?", { x: 8.3, y: 0.3, w: 5, h: 7, fontFace: SERIF, fontSize: 420, italic: true, color: C.indigo, transparency: 95, align: "right" });
    kicker(s, "Q & A");
    s.addText(
      [{ text: "Any ", options: {} }, { text: "questions", options: { italic: true, color: C.rose } }, { text: "?", options: {} }],
      { x: MX, y: 1.6, w: 10, h: 1.6, fontFace: SERIF, fontSize: 56, color: C.ink },
    );
    s.addText("Happy to dig into the patient-grouping protocol, the ensemble, the thresholds, or what we would do differently on a second dataset.", {
      x: MX, y: 3.1, w: 9, h: 0.9, fontFace: SANS, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.3,
    });
    const chips: [string, string][] = [[lead.name, lead.email], ["Code & audit files", "github.com/NoorAbdullah02/MINI_DDSM"], ["Try it live", "mini-ddsm-csde2026.vercel.app"]];
    chips.forEach(([k, v], i) => {
      const x = MX + i * 3.9;
      s.addShape(pres.ShapeType.roundRect, { x, y: 4.3, w: 3.6, h: 1, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
      s.addText(k, { x: x + 0.25, y: 4.42, w: 3.1, h: 0.3, fontFace: SANS, fontSize: 10, bold: true, color: C.indigo, charSpacing: 1 });
      s.addText(v, { x: x + 0.15, y: 4.72, w: 3.3, h: 0.45, fontFace: MONO, fontSize: 10, color: C.ink2 });
    });
  }
}
