// Copies the onnxruntime-web runtime into public/ort so the demo loads it from our own origin.
import { cpSync, mkdirSync, readdirSync } from "node:fs";

const src = "node_modules/onnxruntime-web/dist";
const dst = "public/ort";
mkdirSync(dst, { recursive: true });
for (const f of readdirSync(src)) {
  if (f === "ort.all.bundle.min.mjs" || /^ort-wasm-simd-threaded(\.jsep|\.asyncify)?\.(wasm|mjs)$/.test(f)) {
    cpSync(`${src}/${f}`, `${dst}/${f}`);
  }
}
