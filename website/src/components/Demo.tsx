"use client";

import { AlertCircle, Cpu, ImageUp, Loader2, Lock, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { backend, loadModel, MODELS, predict, THRESHOLDS } from "@/lib/inference";
import { preprocess, type Prepared } from "@/lib/preprocess";
import { Card, Reveal, Section } from "./ui";

// Held-out images: these patients were in the outer TEST fold of seed 42 / fold 0,
// so the exported checkpoints never trained on them.
const SAMPLES = [
  { file: "/samples/cancer-clear.png", truth: "Cancer", view: "R · MLO" },
  { file: "/samples/cancer-borderline.png", truth: "Cancer", view: "R · MLO" },
  { file: "/samples/benign.png", truth: "Benign", view: "L · MLO" },
  { file: "/samples/normal.png", truth: "Normal", view: "L · MLO" },
];

type Phase = "idle" | "loading" | "running" | "done" | "error";
type Result = { effnet: number; convnext: number; ensemble: number; ms: number };

function Gauge({ p }: { p: number }) {
  const R = 86, C = Math.PI * R;
  const color = p >= THRESHOLDS.default ? "var(--color-rose)" : p >= THRESHOLDS.youden ? "var(--color-gold)" : "var(--color-teal)";
  const mark = (t: number) => {
    const a = Math.PI * (1 - t);
    return { x: 100 + Math.cos(a) * (R + 14), y: 100 - Math.sin(a) * (R + 14), x2: 100 + Math.cos(a) * (R - 12), y2: 100 - Math.sin(a) * (R - 12) };
  };
  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[300px]">
      <path d={`M${100 - R},100 A${R},${R} 0 0 1 ${100 + R},100`} fill="none" stroke="var(--color-paper-2)" strokeWidth={16} strokeLinecap="round" />
      <motion.path
        d={`M${100 - R},100 A${R},${R} 0 0 1 ${100 + R},100`}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={C}
        initial={{ strokeDashoffset: C }}
        animate={{ strokeDashoffset: C * (1 - p) }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {[THRESHOLDS.youden, THRESHOLDS.default].map((t) => {
        const m = mark(t);
        return <line key={t} x1={m.x} y1={m.y} x2={m.x2} y2={m.y2} stroke="var(--color-ink-2)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="2 2" />;
      })}
      <text x={100} y={88} textAnchor="middle" fontSize="34" fontFamily="var(--font-fraunces)" fill="var(--color-ink)">{(p * 100).toFixed(1)}%</text>
      <text x={100} y={108} textAnchor="middle" fontSize="9" fill="var(--color-muted)" letterSpacing="1.5">ENSEMBLE CANCER SCORE</text>
    </svg>
  );
}

export function Demo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [prep, setPrep] = useState<Prepared | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [truth, setTruth] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Callback ref: the canvas mounts after the drop-zone exit animation, so draw whenever it appears.
  const drawPreview = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (el && prep) el.getContext("2d")!.putImageData(prep.preview, 0, 0);
    },
    [prep],
  );

  const run = useCallback(async (url: string, label: string | null) => {
    setErr("");
    setRes(null);
    setTruth(label);
    setSrc(url);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const p = preprocess(ctx.getImageData(0, 0, c.width, c.height));
      setPrep(p);

      setPhase("loading");
      const sessions = await Promise.all(MODELS.map((m) => loadModel(m.key, m.url, (f) => setProgress((s) => ({ ...s, [m.key]: f })))));
      setPhase("running");
      const t0 = performance.now();
      const effnet = await predict(sessions[0], p.tensor);
      const convnext = await predict(sessions[1], p.tensor);
      setRes({ effnet, convnext, ensemble: (effnet + convnext) / 2, ms: performance.now() - t0 });
      setPhase("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }, []);

  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("Please choose a PNG or JPEG image.");
      setPhase("error");
      return;
    }
    run(URL.createObjectURL(f), null);
  };

  const reset = () => {
    setPhase("idle");
    setPrep(null);
    setSrc(null);
    setRes(null);
    setTruth(null);
  };

  const busy = phase === "loading" || phase === "running";
  const decision = (p: number, t: number) => (p >= t ? "Cancer" : "Not-Cancer");

  return (
    <Section
      id="demo"
      eyebrow="Live demo"
      title="Upload a mammogram. The trained models answer — right in your browser."
      lede="The two checkpoints from our study run locally with ONNX Runtime Web, with the same Otsu crop, 512 × 512 input and four-view TTA as the paper. Your image never leaves this device."
    >
      <Reveal>
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold-soft/70 px-5 py-4 text-sm text-ink-2">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-gold" />
          <p>
            <b className="text-ink">Research demonstration only — not a medical device.</b> The models were trained on Mini-DDSM scanned-film
            mammograms and are not validated on other scanners or populations. Never use this output for diagnosis or treatment decisions.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            {/* Left: input */}
            <div className="border-b border-line p-6 lg:border-r lg:border-b-0 md:p-8">
              <AnimatePresence mode="wait">
                {!src ? (
                  <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        onFile(e.dataTransfer.files[0]);
                      }}
                      className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed transition ${
                        drag ? "border-rose bg-rose-soft/50" : "border-line-2 bg-paper hover:border-rose/50 hover:bg-rose-soft/20"
                      }`}
                    >
                      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-card shadow-[var(--shadow-soft)]">
                        <ImageUp size={26} className="text-rose" />
                      </span>
                      <span className="mt-5 font-serif text-2xl text-ink">Drop a mammogram here</span>
                      <span className="mt-1 text-sm text-muted">or click to choose · PNG / JPEG</span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

                    <div className="mt-7">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Or try a held-out test image</p>
                      <div className="mt-3 grid grid-cols-4 gap-3">
                        {SAMPLES.map((s) => (
                          <button key={s.file} onClick={() => run(s.file, s.truth)} className="group text-left">
                            <div className="aspect-[2/3] overflow-hidden rounded-xl border border-line bg-paper-2 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={s.file} alt={`${s.truth} sample`} className="h-full w-full object-cover" />
                            </div>
                            <div className="mt-1.5 text-[11px] font-medium text-ink-2">{s.truth}</div>
                            <div className="text-[10px] text-faint">{s.view}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2 text-xs text-muted">Your image · tissue crop</p>
                        <div className="relative overflow-hidden rounded-2xl border border-line bg-paper-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="Uploaded mammogram" className="block w-full" />
                          {prep && (
                            <motion.div
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute rounded-md border-2 border-rose"
                              style={{
                                left: `${(prep.crop.x / prep.width) * 100}%`,
                                top: `${(prep.crop.y / prep.height) * 100}%`,
                                width: `${(prep.crop.w / prep.width) * 100}%`,
                                height: `${(prep.crop.h / prep.height) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs text-muted">What the network sees · 512²</p>
                        <canvas ref={drawPreview} width={512} height={512} className="block aspect-square w-full rounded-2xl border border-line bg-paper-2" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Processed locally</span>
                      <button onClick={reset} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink-2 transition hover:border-line-2 disabled:opacity-50">
                        <RotateCcw size={14} /> Try another
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: output */}
            <div className="flex flex-col p-6 md:p-8">
              {phase === "idle" && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-soft"><Cpu className="text-indigo" /></div>
                  <p className="mt-4 font-serif text-2xl text-ink">Results appear here</p>
                  <p className="mt-2 max-w-sm text-sm text-muted">First run downloads both models once (~91 MB) and caches them. After that, predictions take a few seconds.</p>
                </div>
              )}

              {(phase === "loading" || phase === "running") && (
                <div className="flex flex-1 flex-col justify-center gap-5 py-6">
                  {MODELS.map((m) => (
                    <div key={m.key}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-ink-2">{m.name}</span>
                        <span className="num font-mono text-xs text-muted">{Math.round((progress[m.key] ?? 0) * 100)}% of {m.mb} MB</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                        <motion.div className="h-full rounded-full bg-indigo" animate={{ width: `${(progress[m.key] ?? 0) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="inline-flex items-center gap-2 text-sm text-muted">
                    <Loader2 size={15} className="animate-spin text-rose" />
                    {phase === "loading" ? "Loading models…" : "Running 4-view TTA on both backbones…"}
                  </p>
                </div>
              )}

              {phase === "error" && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <AlertCircle className="text-rose" />
                  <p className="mt-3 text-sm text-ink-2">{err}</p>
                  <button onClick={reset} className="mt-4 rounded-full border border-line px-4 py-2 text-sm">Start over</button>
                </div>
              )}

              {phase === "done" && res && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
                  <div className="flex flex-col items-center">
                    <Gauge p={res.ensemble} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { label: "At threshold 0.5", t: THRESHOLDS.default },
                      { label: "At Youden 0.249", t: THRESHOLDS.youden },
                    ].map((d) => {
                      const c = decision(res.ensemble, d.t) === "Cancer";
                      return (
                        <div key={d.label} className={`rounded-2xl border px-4 py-3 ${c ? "border-rose/30 bg-rose-soft/60" : "border-teal/30 bg-teal-soft/60"}`}>
                          <div className="text-[11px] text-muted">{d.label}</div>
                          <div className={`font-serif text-xl ${c ? "text-rose-deep" : "text-teal"}`}>{c ? "Suspicious" : "Not suspicious"}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { k: "EfficientNet-B4", v: res.effnet, c: "var(--color-gold)" },
                      { k: "ConvNeXtV2-Tiny", v: res.convnext, c: "var(--color-indigo)" },
                    ].map((m) => (
                      <div key={m.k}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-ink-2">{m.k}</span>
                          <span className="num font-mono font-semibold text-ink">{m.v.toFixed(3)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-paper-2">
                          <motion.div className="h-full rounded-full" style={{ background: m.c }} initial={{ width: 0 }} animate={{ width: `${m.v * 100}%` }} transition={{ duration: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {truth && (
                    <div className="mt-6 rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
                      Ground truth: <b className={truth === "Cancer" ? "text-rose-deep" : "text-teal"}>{truth}</b>
                      <span className="text-muted"> — patient held out of training for these checkpoints.</span>
                    </div>
                  )}

                  <p className="mt-auto pt-6 text-[11px] leading-relaxed text-faint">
                    Single-image score from the seed-42 / fold-0 checkpoints. The paper averages all views of a patient before deciding.
                    {` ${backend === "webgpu" ? "WebGPU" : "WASM"} · ${(res.ms / 1000).toFixed(1)} s.`}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
