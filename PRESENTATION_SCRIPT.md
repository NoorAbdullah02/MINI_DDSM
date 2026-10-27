# Talk script — IEEE CSDE 2026, Paper #3958

**Multi-Backbone Ensemble Learning for Robust Breast Cancer Classification on the Mini-DDSM Mammography Dataset**
Sheikh Noor Abdullah (presenting) · Nafis Shahriar · Mehejabin Tabassum Lamia · Mysha Ibnat Mourin · Farah Ulfat Urmi · A.B.M. Kabir Hossain (supervisor)
BAUET, Natore, Bangladesh · Cox's Bazar · 1–3 Nov 2026

Target length: **~12 minutes talk + 3 minutes Q&A** (adjust pacing to your actual slot — if you get 15+3, slow down on slides 6–10; if you get 8+2, cut to the short version marked ⚡ below).

Read this once out loud before the conference, then again the night before. Don't memorize word-for-word — know the *beats*, not the sentences, so you stay natural if a judge's face tells you to slow down or speed up.

---

## 0. Before you even say a word (10 sec)

Stand still, look at the room, let the title slide sit for 2–3 seconds before speaking. Don't start while still walking to the podium.

## 1. Title (0:00 – 0:40)

> "Good morning / good afternoon. I'm Sheikh Noor Abdullah, presenting on behalf of my team from BAUET, Bangladesh.
>
> Our paper asks a simple question that most mammography papers quietly skip: **when you evaluate breast-cancer classification honestly — patient by patient — how good is it really?**
>
> I'll show you that the answer changes a lot once you ask that question properly, and that a deliberately simple method, evaluated honestly, still wins."

*Delivery tip:* that last line is your hook — say it slightly slower than the rest. It tells the judges in one sentence what the paper is about and why it matters.

## 2. Agenda (0:40 – 1:00)

> "Six parts: the problem with how this dataset is usually split, how we audited it, our method, our results, calibration and explainability, and finally what we don't claim — then questions."

Keep this to 15–20 seconds. Judges don't need detail here, just a map.

## 3. Motivation (1:00 – 1:45)

> "Breast cancer is the most diagnosed cancer in women worldwide — 2.43 million new cases in GLOBOCAN 2024. Deep learning is a genuinely promising screening aid. But published accuracy on Mini-DDSM swings from the high 80s to 99% — and that swing has very little to do with the model. It's mostly about how the data was split."

## 4. The problem (1:45 – 2:45) — ⚡ if short on time, compress to 2 sentences

> "Here's the catch. Mini-DDSM has multiple images per patient — CC and MLO views, sometimes more. If one patient's images land on *both* sides of a train/test split, the model is partly being tested on someone it already memorized. That's leakage, and it inflates accuracy without you knowing it.
>
> We went back through prior Mini-DDSM papers and found several reporting 87–99% accuracy without stating whether they grouped by patient. That's the gap we wanted to close."

*If a judge looks skeptical here, this is your strongest slide — slow down, make eye contact.*

## 5. Data audit (2:45 – 3:45)

> "So before we built a single fold, we audited every identifier in the dataset. We found three raw patient IDs that appear in *both* the Benign and Cancer folders — so we key groups by class folder plus ID, not ID alone. Four eight-image blocks we kept intact as one conservative group rather than risk splitting them. Fourteen exact duplicate image pairs by SHA-256 hash — we verified none of them cross a group boundary.
>
> End result: 9,684 mammograms collapse into 2,417 *patient groups*, and we verified programmatically — not just assumed — zero leaked groups across all nine of our splits."

*Delivery tip:* "verified programmatically, not just assumed" is a phrase worth keeping verbatim — it preempts the most common reviewer pushback (did you just trust the folder structure?).

## 6. Pipeline (3:45 – 4:30)

> "The method itself is deliberately simple — we're not claiming a new architecture. Otsu thresholding crops each mammogram to the breast region, resized to 512. Four-view test-time augmentation. Two ImageNet-pretrained backbones — EfficientNet-B4 and ConvNeXtV2-Tiny — each producing an image-level then patient-level probability. We average the two with a **fixed 50/50 weight** — nothing tuned on test data."

## 7. Protocol (4:30 – 5:15)

> "Evaluation is nested, which matters more than it sounds. Each outer training fold splits again into inner-train and inner-validation, by patient. Checkpoints, the decision threshold, and Platt calibration all come *only* from inner validation — then they're frozen before we ever touch the outer test fold. The outer test fold stays untouched until the very end. We repeat this whole process with three different random seeds, three folds each."

> "In short: nothing about the test fold influences any decision we make — not the checkpoint, not the threshold, not the calibration."

## 8. Main result (5:15 – 6:15) — your strongest slide, don't rush

> "Across three seeds, the ensemble reaches ROC-AUC **0.891**, plus or minus 0.008, and PR-AUC **0.830**. That beats EfficientNet-B4 alone at 0.882, ConvNeXtV2-Tiny alone at 0.857, and even a fold-selected 'pick the single best model per fold' strategy at 0.878.
>
> The headline finding: a **fixed, untuned 50/50 average beats cherry-picking the best model per fold.** That's a useful, slightly counter-intuitive result for anyone building a similar pipeline."

## 9. Ablation (6:15 – 6:50)

> "The ablation breaks this down across six metrics. The equal-average ensemble wins five of six. The one exception: EfficientNet-B4 alone is more *sensitive* at the default 0.5 threshold. So the ensemble improves overall discrimination, but it doesn't dominate every single operating point — we say that plainly in the paper."

## 10. Operating point (6:50 – 7:40)

> "Ranking well isn't the whole story for a screening tool. At the default 0.5 threshold we're very specific — 92.6% — but we miss a lot of cancers: sensitivity is only 0.62. Using a Youden-optimal threshold chosen **only on training-side validation data**, sensitivity rises to 0.79, and missed cancers drop from roughly 343 to 191 per seed. That threshold choice is free — it costs no extra training — and it's the kind of decision a clinical deployment absolutely has to make deliberately, not default to 0.5."

## 11. Calibration (7:40 – 8:20)

> "Raw scores aren't automatically trustworthy probabilities. Platt scaling, fit only on inner validation, drops Brier score from 0.136 to 0.124 and expected calibration error from 0.075 to 0.023. Decision-curve analysis shows positive net clinical benefit across a 0.05-to-0.80 threshold range, consistently across all three seeds. We're careful to call this internal evidence only — it's not external validation."

## 12. Grad-CAM (8:20 – 8:55)

> "Grad-CAM gives us a qualitative look at where the network is looking. For true positives, attention concentrates right on the lesion. For false negatives, it's often *near* the lesion but the signal is too weak to cross the threshold. We present this as a transparency aid for clinicians, not as validated localization — we don't have radiologist-annotated bounding boxes to score it against."

## 13. Limitations (8:55 – 9:30)

> "We want to be upfront about limits. One dataset. Three folds. We chose to keep eight-image identifier blocks intact, which is conservative but could in principle merge distinct subjects. Grad-CAM is qualitative only, with no overlap metric against radiologist annotations. Next step: the same protocol on CBIS-DDSM and INbreast, with richer metadata and real radiologist review."

*Delivery tip:* say this section with confidence, not apology. Judges respect explicit limitations far more than they respect a paper that pretends to have none.

## 14. References (9:30 – 9:40)

> "Ten references — the dataset, the two backbones, Grad-CAM, and the prior Mini-DDSM work we compare against. Full list is in the paper."

Don't linger here — a 5–10 second beat is enough.

## 15. Thank you (9:40 – 10:15)

> "To summarize in one sentence: **audit first, a simple ensemble wins, thresholds matter, and we're honest about what we don't know.**
>
> Everything — code, the patient-grouping audit, all split files — is public on GitHub. If you scan this QR code right now, you can try the live model yourself, on your own phone, on a mammogram image, in your browser, no install. Thank you — I'm happy to take questions."

## 16. Any questions (10:15 → Q&A)

Stay standing at this slide. It just needs to display cleanly — don't talk over it, let silence do its job for 2–3 seconds before the first question comes.

---

## Q&A — anticipated questions and sharp answers

Read these out loud a few times so the *content* is automatic; don't read them verbatim on stage.

**Q: Why only one dataset — doesn't that limit your claims?**
> "Correct, and we say so explicitly in Limitations. Our contribution isn't 'the best accuracy ever reported' — it's a rigorous, leak-free protocol applied honestly to one dataset, with the audit methodology designed to transfer directly to CBIS-DDSM and INbreast, which is our immediate next step."

**Q: Why a fixed 50/50 ensemble instead of a learned weighting?**
> "We tested that question directly — see the ablation. A fixed average beats the fold-selected 'pick the best model' strategy. Learning ensemble weights on the same data you evaluate on risks exactly the kind of test-set leakage we spent the whole paper trying to eliminate. A fixed, untuned weight is a deliberate choice, not an oversight."

**Q: How do you know there's really zero leakage — did you just trust the folder structure?**
> "No — we verified it programmatically on all nine splits, not just assumed it from the directory layout. That's also why we caught the three cross-class ID collisions and the eight-image blocks that a naive ID-based grouping would have missed."

**Q: Why keep eight-image blocks as one group instead of splitting them?**
> "Conservatism. We couldn't confirm from metadata whether those eight images represent one patient or several, so we chose the option that can only *under*-report performance, never inflate it — treating them as one group risks losing a bit of data diversity, but it can never leak information across the split."

**Q: Is the 92.6% specificity / 0.62 sensitivity at threshold 0.5 good enough for real screening use?**
> "Not at the default threshold, no — and that's exactly the point of the operating-point slide. At 0.5 you'd miss too many cancers. Moving to the Youden threshold, chosen only on training-side data, nearly closes that gap — sensitivity to 0.79 — at essentially zero extra cost. A real deployment would also want a clinician-set threshold reflecting their specific risk tolerance, not our default."

**Q: Is your calibration internally or externally validated?**
> "Internal only, and we say that directly. Platt scaling and the decision-curve analysis are both inner-validation-fit and outer-test-evaluated within the same dataset's splits — that's honest about what it is, but it's not external validation on a different hospital's data. That's future work."

**Q: Why EfficientNet-B4 and ConvNeXtV2-Tiny specifically?**
> "We wanted two architecturally different inductive biases rather than two similar CNNs. EfficientNet-B4 is a compound-scaled, MBConv-based CNN; ConvNeXtV2-Tiny uses large kernels, LayerNorm, and Global Response Normalization — a more transformer-influenced design. The idea is that their errors are less correlated, which is exactly what makes averaging useful."

**Q: What would you do differently on a second dataset?**
> "Run the identical audit-first protocol — check for cross-class ID collisions, duplicate images, and multi-image blocks before building any fold — then bring in a radiologist to actually score the Grad-CAM maps against ground-truth lesion locations, which we couldn't do here."

**Q: Is the code and data really public, or is that just in the paper?**
> "Really public — GitHub link in the paper and on the title slide, including the audit scripts and the exact split files, not just the model code. And the QR code on the last slide links to a live, client-side demo anyone can try right now."

---

## 30-second version (if you're cut off / elevator-pitch moment)

> "Mammography papers on Mini-DDSM report wildly different accuracy because most don't check whether a patient's images land on both sides of the train/test split. We audited every identifier, built a leak-free patient-grouped protocol, and found that a simple, fixed 50/50 ensemble of two backbones — honestly evaluated — beats cherry-picking the best single model. ROC-AUC 0.891, zero leaked patients, fully reproducible, code's on GitHub."

---

## Logistics checklist for the day

- [ ] Laptop charged + charger packed; `Mini-DDSM-CSDE2026-Presentation.pptx` and `Mini-DDSM-CSDE2026-IEEE-Template.pptx` both on a USB stick (offline backup — no internet needed)
- [ ] `/present` site open and tested on the venue Wi-Fi beforehand if presenting from the browser
- [ ] QR code slide tested — can your own phone actually resolve it from across a room?
- [ ] Know your time slot exactly; have the ⚡ short-version cuts marked above ready
- [ ] Water nearby; look at the audience, not the slide, for the hook and the closing line
