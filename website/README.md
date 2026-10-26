# Mini-DDSM · IEEE CSDE 2026 — project website

Premium static site for the paper *Multi-Backbone Ensemble Learning for Robust Breast Cancer
Classification on the Mini-DDSM Mammography Dataset*. Built with Next.js (static export),
Tailwind CSS v4, Motion and ONNX Runtime Web.

| Route | What it is |
|---|---|
| `/` | Project page: problem, data audit, method, interactive results, live demo, Grad-CAM, BibTeX, team |
| `/present` | 14-slide conference deck (see **Present** below) |

## Present

`/present` (keyboard, from anywhere in the deck):

| Key | Does |
|---|---|
| `→` / `Space` / `Enter` | Next slide |
| `←` / `Backspace` | Previous slide |
| `Home` / `End` | First / last slide |
| `O` | Overview grid — jump straight to any slide, handy mid-Q&A |
| `N` | Toggle the speaker-notes bar |
| `P` | **Presenter view** — a side panel with an elapsed timer (pause/reset), the next slide's title, and the full speaker notes in reading size, while the main view keeps showing the current slide full-size |
| `L` | **Laser pointer** — a glowing dot that follows the cursor, for pointing things out on a projector |
| `F` | Full screen |
| `Esc` | Close the overview grid |

`/present#7` deep-links to slide 7. The footer also has a **Download .pptx** button that
builds the same 14 slides as a standalone PowerPoint file, entirely in the browser (see
below) — useful as a backup when there's no reliable way to show the website itself at the
venue.

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

## PowerPoint export

The deck's "Download .pptx" button generates the file client-side (`src/lib/exportPptx.ts`),
but a ready copy is also committed at the repo root
([`Mini-DDSM-CSDE2026-Presentation.pptx`](../Mini-DDSM-CSDE2026-Presentation.pptx)) — a
working backup if the venue has no reliable internet or browser for the live site. Both are
built from the same slide definitions in `src/lib/buildDeck.ts` (native charts, a table, and
the real figures, in fonts every copy of PowerPoint has), so they never drift apart.

Re-generate it after changing any number in `src/data/site.ts` or any slide in
`src/lib/buildDeck.ts`:

```bash
npm run pptx
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
