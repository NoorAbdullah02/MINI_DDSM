// Builds the same 14-slide deck as the website's "Download .pptx" button,
// but as a plain Node script — no browser, so it runs once here and the
// result is committed to the repo as a ready-made backup. Useful at a venue
// with no internet, no laptop charger for a live demo, or a projector that
// won't cooperate with the website.
//
// Usage (from website/):  npx tsx scripts/generate-pptx.ts
// Re-run after changing any numbers in src/data/site.ts or src/lib/buildDeck.ts.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";
import { toDataURL as qrDataUrl } from "qrcode";
import { buildDeck, type DeckAssets } from "../src/lib/buildDeck";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const outPath = join(__dirname, "..", "..", "Mini-DDSM-CSDE2026-Presentation.pptx");

function fileToDataUrl(relPath: string, mime: string): string {
  const buf = readFileSync(join(publicDir, relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function main() {
  const pres = new PptxGenJS();

  const assets: DeckAssets = {
    pipeline: fileToDataUrl("figures/pipeline.png", "image/png"),
    qr: await qrDataUrl("https://mini-ddsm-csde2026.vercel.app/#demo", { errorCorrectionLevel: "M", margin: 1, width: 400 }),
    gcTp: fileToDataUrl("figures/gc_tp_overlay.jpg", "image/jpeg"),
    gcTn: fileToDataUrl("figures/gc_tn_overlay.jpg", "image/jpeg"),
    gcFp: fileToDataUrl("figures/gc_fp_overlay.jpg", "image/jpeg"),
    gcFn: fileToDataUrl("figures/gc_fn_overlay.jpg", "image/jpeg"),
  };

  buildDeck(pres, assets);
  const written = await pres.writeFile({ fileName: outPath });
  console.log(`Wrote ${written}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
