// Speaker notes for the 14-slide deck, shared by the live /present view
// (src/components/Deck.tsx) and the PowerPoint export (src/lib/buildDeck.ts)
// so the two never drift apart — and so the .pptx carries real notes in
// PowerPoint's own Notes pane, not just on the website.
export const deckNotes = [
  "Good morning. I'm Sheikh Noor Abdullah from BAUET. Our paper asks a simple question: how good is breast-cancer classification on Mini-DDSM when we evaluate it honestly, patient by patient?",
  "Breast cancer is the most diagnosed cancer in women — 2.43 million new cases in GLOBOCAN 2024. Deep learning can help screening, but reported accuracy depends heavily on how the data are split.",
  "Here's the catch. Mini-DDSM has several views per patient. If a patient's CC and MLO images fall on both sides of the split, the model is partly tested on someone it has already seen. Several prior papers report 0.87 to 0.99 accuracy without saying whether they grouped by patient.",
  "So before building any fold, we audited every identifier. Three raw IDs appear in both Benign and Cancer folders — we key groups by class folder plus ID. Four eight-image blocks are kept intact. Fourteen exact duplicate pairs, none crossing groups. Result: 2,417 patient groups and zero leakage on all nine splits.",
  "The pipeline is deliberately simple. Otsu crop to 512, four-view test-time augmentation, two ImageNet backbones, average to a patient score, then a fixed 50/50 ensemble — no weights tuned on test data.",
  "Evaluation is nested. Each outer training fold is split into inner train and inner validation by patient. Checkpoints, Youden thresholds and Platt scaling come only from inner validation, then are frozen. The outer test fold is untouched until the end. We repeat everything with three seeds.",
  "Across three seeds, the ensemble reaches ROC-AUC 0.891 plus-minus 0.008 and PR-AUC 0.830. That beats EfficientNet-B4 at 0.882, ConvNeXtV2 at 0.857 and the fold-selected single best at 0.878.",
  "The ablation shows the fixed average wins on five of six metrics. EfficientNet alone stays more sensitive at 0.5 — so the ensemble improves discrimination but doesn't dominate every operating point.",
  "Ranking isn't the whole story. At 0.5 the model is specific — 92.6% — but misses many cancers. Using the Youden threshold chosen on training-side validation raises sensitivity from 0.62 to 0.79 and cuts missed cancers from about 343 to 191 per seed.",
  "Platt scaling, fit only on inner validation, lowers Brier from 0.136 to 0.124 and ECE from 0.075 to 0.023. Decision-curve analysis shows positive net benefit from 0.05 to 0.80 in every seed — still internal evidence only.",
  "Grad-CAM gives a qualitative look. For true positives, attention concentrates on the lesion; for false negatives it's near the lesion but too weak. We present this as a transparency aid, not validated localisation.",
  "Limitations: one dataset, three folds, eight-image identifiers kept as conservative groups, and Grad-CAM is qualitative. Next we'll apply the same protocol to CBIS-DDSM and INbreast with radiologist review.",
  "To summarise: audit first, a simple ensemble wins, thresholds matter, and we're honest about the limits. Everything — code, splits and audit files — is public. Scan the QR code to try the live demo on your own phone. Thank you; happy to take questions.",
  "That's the talk. I'm glad to take questions — on the patient-grouping protocol, the ensemble, the thresholds, or what we'd do differently on a second dataset.",
] as const;
