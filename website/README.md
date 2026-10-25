# Mini-DDSM · IEEE CSDE 2026 — project website

Premium static site for the paper *Multi-Backbone Ensemble Learning for Robust Breast Cancer
Classification on the Mini-DDSM Mammography Dataset*. Built with Next.js (static export),
Tailwind CSS v4, Motion and ONNX Runtime Web.

| Route | What it is |
|---|---|
| `/` | Project page: problem, data audit, method, interactive results, live demo, Grad-CAM, BibTeX, team |
| `/present` | 13-slide conference deck. `→ / Space` next, `←` back, `N` speaker notes, `F` full screen, `/present#7` deep-links |

## Live demo

`public/models/*.onnx` are the seed-42 / fold-0 checkpoints exported with
`scripts/export_onnx.py` (4-view TTA + sigmoid baked in, fp16 weights / fp32 compute).
`src/lib/preprocess.ts` reproduces the notebook's OpenCV preprocessing exactly
(grayscale, Otsu, 7×7 closing, largest-region crop, `INTER_AREA` resize, ImageNet
normalisation). Inference runs entirely in the visitor's browser — images are never uploaded.
The four sample images are from that fold's held-out test patients.

Re-export after retraining (from the repo root, in the training environment):

```bash
python website/scripts/export_onnx.py --seed 42 --fold 0
```

## Develop

```bash
npm install
npm run dev
```

## Deploy (GitHub → Vercel, automatic)

One-time setup:

1. Push this repository to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repository.
3. Set **Root Directory** to `website` (framework is auto-detected as Next.js). Deploy.

After that every `git push` to `master` redeploys the site, and every pull request gets
its own preview URL. `vercel.json` adds cross-origin isolation (multi-threaded WASM for the
demo) and caching headers for the model files.
