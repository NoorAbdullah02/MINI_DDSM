// Client-side .pptx export: mirrors the live deck as a standalone, editable
// PowerPoint file (native charts + table), generated entirely in the browser —
// no server round-trip, same static-export friendly approach as the ONNX demo.
// The slide content itself lives in buildDeck.ts, shared with the Node script
// that bakes a ready-made copy of this file into the repo (scripts/generate-pptx.ts).

import { toDataURL as qrDataUrl } from "qrcode";
import { buildDeck, type DeckAssets } from "./buildDeck";

async function toDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function downloadPptx(onProgress?: (label: string) => void) {
  onProgress?.("Loading PowerPoint engine…");
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pres = new PptxGenJS();

  onProgress?.("Fetching figures…");
  const [pipeline, qr, gcTp, gcTn, gcFp, gcFn] = await Promise.all([
    toDataUrl("/figures/pipeline.png"),
    qrDataUrl("https://mini-ddsm-csde2026.vercel.app/#demo", { errorCorrectionLevel: "M", margin: 1, width: 400 }),
    toDataUrl("/figures/gc_tp_overlay.jpg"),
    toDataUrl("/figures/gc_tn_overlay.jpg"),
    toDataUrl("/figures/gc_fp_overlay.jpg"),
    toDataUrl("/figures/gc_fn_overlay.jpg"),
  ]);

  onProgress?.("Building slides…");
  const assets: DeckAssets = { pipeline, qr, gcTp, gcTn, gcFp, gcFn };
  buildDeck(pres, assets);

  onProgress?.("Preparing download…");
  await pres.writeFile({ fileName: "Mini-DDSM-CSDE2026.pptx" });
}
