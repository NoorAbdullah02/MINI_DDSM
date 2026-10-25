// Runs the two exported backbones fully in the browser (WebGPU if available, else WASM).
// Each ONNX graph already contains the paper's 4-view TTA and sigmoid.

type Ort = typeof import("onnxruntime-web");
type Session = import("onnxruntime-web").InferenceSession;

export const MODELS = [
  { key: "effnet", name: "EfficientNet-B4", url: "/models/effnet_b4.onnx", mb: 35 },
  { key: "convnext", name: "ConvNeXtV2-Tiny", url: "/models/convnextv2_tiny.onnx", mb: 56 },
] as const;

// Inner-validation Youden thresholds for the exported checkpoints (seed 42, fold 0).
export const THRESHOLDS = { default: 0.5, youden: 0.2491 };

let ortPromise: Promise<Ort> | null = null;
const sessions: Record<string, Promise<Session>> = {};
export let backend = "wasm";

function loadOrt(): Promise<Ort> {
  if (!ortPromise) {
    ortPromise = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/ort/ort.all.bundle.min.mjs" as string).then((m) => {
      const ort = m as Ort;
      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
      return ort;
    });
  }
  return ortPromise;
}

async function fetchWithProgress(url: string, onProgress: (f: number) => void): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Could not download ${url}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (total) onProgress(got / total);
  }
  const buf = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) {
    buf.set(c, o);
    o += c.length;
  }
  onProgress(1);
  return buf;
}

export function loadModel(key: string, url: string, onProgress: (f: number) => void): Promise<Session> {
  if (!sessions[key]) {
    sessions[key] = (async () => {
      const ort = await loadOrt();
      const bytes = await fetchWithProgress(url, onProgress);
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      if (hasGpu) {
        try {
          const s = await ort.InferenceSession.create(bytes, { executionProviders: ["webgpu"] });
          backend = "webgpu";
          return s;
        } catch {
          /* fall through to wasm */
        }
      }
      backend = "wasm";
      return ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
    })();
    sessions[key].catch(() => delete sessions[key]);
  }
  return sessions[key];
}

export async function predict(session: Session, tensor: Float32Array): Promise<number> {
  const ort = await loadOrt();
  const input = new ort.Tensor("float32", tensor, [1, 3, 512, 512]);
  const out = await session.run({ image: input });
  return (out.prob.data as Float32Array)[0];
}
