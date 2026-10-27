# Presentation Script — বাংলা ভার্সন (বোঝার জন্য)

**এই ফাইলটা শুধু তোমার বোঝার জন্য — conference-এ actual presentation ইংরেজিতেই দিতে হবে** (IEEE CSDE 2026 international conference, audience/judges বাংলা বুঝবে না)। প্রতিটা অংশে — আগে বাংলায় বুঝিয়ে দিচ্ছি কী বলতে হবে এবং কেন, তারপর ইংরেজি লাইনটা দেওয়া আছে যেটা মুখস্থ না করে, মানে বুঝে নিজের ভাষায় বলতে হবে। ইংরেজি script-এর পুরো ভার্সন আছে [PRESENTATION_SCRIPT.md](PRESENTATION_SCRIPT.md)-এ।

মোট সময়: **~১২ মিনিট বক্তৃতা + ৩ মিনিট প্রশ্নোত্তর**

---

## ০. শুরু করার আগে (১০ সেকেন্ড)

স্টেজে গিয়ে সাথে সাথে কথা বলা শুরু করবে না। ২-৩ সেকেন্ড চুপ করে দাঁড়িয়ে, title slide-টা দর্শকদের দেখতে দাও, তারপর শুরু করো।

## ১. Title স্লাইড (০:০০ – ০:৪০)

**বাংলায় বোঝো:** নিজের পরিচয় দাও, তারপর পুরো paper-এর মূল প্রশ্নটা এক লাইনে বলে দাও — "mammography classification সত্যিই কতটা ভালো, যদি patient অনুযায়ী সৎভাবে test করা হয়?" এই hook লাইনটাই সবচেয়ে গুরুত্বপূর্ণ, একটু ধীরে স্পষ্ট করে বলবে।

**ইংরেজিতে বলো:**
> "Good morning. I'm Sheikh Noor Abdullah, presenting on behalf of my team from BAUET, Bangladesh. Our paper asks a simple question that most mammography papers quietly skip: when you evaluate breast-cancer classification honestly — patient by patient — how good is it really? I'll show you that the answer changes a lot once you ask that question properly, and that a deliberately simple method, evaluated honestly, still wins."

## ২. Agenda (০:৪০ – ১:০০)

**বাংলায় বোঝো:** এখানে শুধু বলো কী কী order-এ আসবে — problem, audit, method, result, calibration/explainability, limitation, তারপর প্রশ্ন। ১৫-২০ সেকেন্ডের বেশি লাগবে না, বিস্তারিত বলার দরকার নাই।

**ইংরেজিতে বলো:**
> "Six parts: the problem with how this dataset is usually split, how we audited it, our method, our results, calibration and explainability, and finally what we don't claim — then questions."

## ৩. Motivation (১:০০ – ১:৪৫)

**বাংলায় বোঝো:** breast cancer কতটা common সেটা একটা statistic দিয়ে বলো (GLOBOCAN 2024-এ ২.৪৩ মিলিয়ন নতুন case), তারপর বলো — deep learning helpful কিন্তু accuracy number গুলো এক পেপার থেকে আরেক পেপারে অনেক আলাদা হয়, কারণ data split-এর পদ্ধতি আলাদা।

**ইংরেজিতে বলো:**
> "Breast cancer is the most diagnosed cancer in women worldwide — 2.43 million new cases in GLOBOCAN 2024. Deep learning is a genuinely promising screening aid. But published accuracy on Mini-DDSM swings from the high 80s to 99% — and that swing has very little to do with the model. It's mostly about how the data was split."

## ৪. The problem (১:৪৫ – ২:৪৫) — সময় কম থাকলে ২ লাইনে শেষ করো

**বাংলায় বোঝো:** এখানে মূল সমস্যাটা ব্যাখ্যা করো — একই রোগীর একাধিক ছবি (CC, MLO view) থাকে। যদি একই রোগীর ছবি train আর test দুই জায়গাতেই চলে যায়, তাহলে model যেটা test করছে সেটা আসলে আগেই "দেখে ফেলা" কিছু — এটাই leakage, আর এর কারণে accuracy fake ভাবে বেড়ে যায়। অনেক আগের paper 87-99% accuracy দাবি করেছে কিন্তু বলেনি patient-grouping করেছে কিনা।

**ইংরেজিতে বলো:**
> "Here's the catch. Mini-DDSM has multiple images per patient — CC and MLO views, sometimes more. If one patient's images land on both sides of a train/test split, the model is partly being tested on someone it already memorized. That's leakage, and it inflates accuracy without you knowing it. We went back through prior Mini-DDSM papers and found several reporting 87–99% accuracy without stating whether they grouped by patient. That's the gap we wanted to close."

*এই slide-এ judge সন্দিহান চেহারায় তাকালে — এটাই তোমার সবচেয়ে শক্ত slide, ধীরে বলো, চোখে চোখ রাখো।*

## ৫. Data audit (২:৪৫ – ৩:৪৫)

**বাংলায় বোঝো:** এটা তোমার paper-এর সবচেয়ে গুরুত্বপূর্ণ contribution। বলো — fold বানানোর আগেই প্রতিটা identifier audit করা হয়েছে। ৩টা raw patient ID পাওয়া গেছে যেগুলো Benign আর Cancer দুই folder-এই আছে — তাই শুধু ID না, class folder + ID মিলিয়ে group বানানো হয়েছে। ৪টা আট-ছবির block সম্পূর্ণ এক group হিসেবে রাখা হয়েছে। ১৪টা হুবহু duplicate pair পাওয়া গেছে SHA-256 hash দিয়ে, যেগুলো কোনো group boundary cross করেনি। ফলাফল: ৯,৬৮৪টা mammogram মিলে ২,৪১৭টা patient group হয়েছে, আর সবগুলো ৯টা split-এ programmatically verify করে leakage শূন্য পাওয়া গেছে।

**ইংরেজিতে বলো:**
> "So before we built a single fold, we audited every identifier in the dataset. We found three raw patient IDs that appear in both the Benign and Cancer folders — so we key groups by class folder plus ID, not ID alone. Four eight-image blocks we kept intact as one conservative group rather than risk splitting them. Fourteen exact duplicate image pairs by SHA-256 hash — we verified none of them cross a group boundary. End result: 9,684 mammograms collapse into 2,417 patient groups, and we verified programmatically — not just assumed — zero leaked groups across all nine of our splits."

*মনে রাখার মতো লাইন: "verified programmatically, not just assumed" — এইটা বললে judge বুঝবে তুমি শুধু folder structure বিশ্বাস করোনি, সত্যিই check করেছ।*

## ৬. Pipeline (৩:৪৫ – ৪:৩০)

**বাংলায় বোঝো:** method টা ইচ্ছাকৃতভাবে simple রাখা হয়েছে — নতুন architecture দাবি করছো না। Otsu thresholding দিয়ে breast region crop করা, 512-এ resize, চার-view test-time augmentation, দুইটা ImageNet-pretrained backbone (EfficientNet-B4, ConvNeXtV2-Tiny), প্রতিটা থেকে patient-level probability, তারপর fixed 50/50 average — test data-তে কিছুই tune করা হয়নি।

**ইংরেজিতে বলো:**
> "The method itself is deliberately simple — we're not claiming a new architecture. Otsu thresholding crops each mammogram to the breast region, resized to 512. Four-view test-time augmentation. Two ImageNet-pretrained backbones — EfficientNet-B4 and ConvNeXtV2-Tiny — each producing an image-level then patient-level probability. We average the two with a fixed 50/50 weight — nothing tuned on test data."

## ৭. Protocol (৪:৩০ – ৫:১৫)

**বাংলায় বোঝো:** evaluation nested — মানে প্রতিটা outer training fold আবার ভাগ হয় inner-train আর inner-validation-এ, patient অনুযায়ী। checkpoint, threshold, calibration — সব কিছু শুধু inner validation থেকে আসে, তারপর freeze হয়ে যায় — outer test fold একদম শেষ পর্যন্ত স্পর্শ করা হয় না। পুরোটা ৩টা seed আর ৩টা fold দিয়ে repeat করা হয়েছে।

**ইংরেজিতে বলো:**
> "Evaluation is nested, which matters more than it sounds. Each outer training fold splits again into inner-train and inner-validation, by patient. Checkpoints, the decision threshold, and Platt calibration all come only from inner validation — then they're frozen before we ever touch the outer test fold. The outer test fold stays untouched until the very end. We repeat this whole process with three different random seeds, three folds each. In short: nothing about the test fold influences any decision we make."

## ৮. Main result (৫:১৫ – ৬:১৫) — সবচেয়ে গুরুত্বপূর্ণ slide, তাড়াহুড়া করো না

**বাংলায় বোঝো:** তিন seed জুড়ে ensemble ROC-AUC 0.891 (±0.008) আর PR-AUC 0.830 পেয়েছে — যেটা EfficientNet-B4 একা (0.882), ConvNeXtV2 একা (0.857), এমনকি fold-ভিত্তিক "সবচেয়ে ভালো model বেছে নেওয়া" strategy (0.878)-এর চেয়েও ভালো। মূল finding: **fixed, untuned 50/50 average, "সবচেয়ে ভালোটা বেছে নেওয়া" strategy-কেও হারায়** — এটা একটু counter-intuitive কিন্তু কাজের একটা result।

**ইংরেজিতে বলো:**
> "Across three seeds, the ensemble reaches ROC-AUC 0.891, plus or minus 0.008, and PR-AUC 0.830. That beats EfficientNet-B4 alone at 0.882, ConvNeXtV2-Tiny alone at 0.857, and even a fold-selected 'pick the single best model per fold' strategy at 0.878. The headline finding: a fixed, untuned 50/50 average beats cherry-picking the best model per fold."

## ৯. Ablation (৬:১৫ – ৬:৫০)

**বাংলায় বোঝো:** ৬টা metric-এর মধ্যে ensemble ৫টাতে জিতেছে। একমাত্র ব্যতিক্রম — default 0.5 threshold-এ EfficientNet-B4 একা বেশি sensitive। তাই ensemble সার্বিকভাবে ভালো, কিন্তু প্রতিটা operating point-এ dominate করে না — এটা paper-এ স্পষ্ট করে বলা আছে।

**ইংরেজিতে বলো:**
> "The ablation breaks this down across six metrics. The equal-average ensemble wins five of six. The one exception: EfficientNet-B4 alone is more sensitive at the default 0.5 threshold. So the ensemble improves overall discrimination, but it doesn't dominate every single operating point — we say that plainly in the paper."

## ১০. Operating point (৬:৫০ – ৭:৪০)

**বাংলায় বোঝো:** শুধু ranking ভালো হলেই হয় না — screening tool-এর জন্য এটাই পুরো গল্প না। default 0.5 threshold-এ specificity 92.6% ভালো, কিন্তু sensitivity মাত্র 0.62 — মানে অনেক cancer case miss হচ্ছে। শুধু training-side validation data দিয়ে বেছে নেওয়া Youden threshold ব্যবহার করলে sensitivity 0.79-এ উঠে যায়, আর per-seed missed cancer সংখ্যা প্রায় ৩৪৩ থেকে ১৯১-এ নেমে আসে — এবং এর জন্য কোনো extra training লাগে না।

**ইংরেজিতে বলো:**
> "Ranking well isn't the whole story for a screening tool. At the default 0.5 threshold we're very specific — 92.6% — but we miss a lot of cancers: sensitivity is only 0.62. Using a Youden-optimal threshold chosen only on training-side validation data, sensitivity rises to 0.79, and missed cancers drop from roughly 343 to 191 per seed. That threshold choice is free — it costs no extra training."

## ১১. Calibration (৭:৪০ – ৮:২০)

**বাংলায় বোঝো:** model-এর raw score সবসময় বিশ্বাসযোগ্য probability না। শুধু inner validation দিয়ে fit করা Platt scaling Brier score 0.136 থেকে 0.124-এ, আর ECE 0.075 থেকে 0.023-এ নামিয়ে দেয়। Decision-curve analysis 0.05 থেকে 0.80 threshold range-এ positive net clinical benefit দেখায়, সব seed-এ consistently — কিন্তু এটা internal evidence, external validation না — সেটা স্পষ্ট বলতে হবে।

**ইংরেজিতে বলো:**
> "Raw scores aren't automatically trustworthy probabilities. Platt scaling, fit only on inner validation, drops Brier score from 0.136 to 0.124 and expected calibration error from 0.075 to 0.023. Decision-curve analysis shows positive net clinical benefit across a 0.05-to-0.80 threshold range, consistently across all three seeds. We're careful to call this internal evidence only — it's not external validation."

## ১২. Grad-CAM (৮:২০ – ৮:৫৫)

**বাংলায় বোঝো:** Grad-CAM দিয়ে দেখানো হয়েছে model কোথায় "তাকাচ্ছে"। true positive-এ attention lesion-এর উপরই concentrate করে, false negative-এ lesion-এর কাছাকাছি থাকে কিন্তু signal দুর্বল থাকে threshold পার করার মতো। এটা একটা transparency aid হিসেবে দেখানো হচ্ছে, validated localization হিসেবে না — কারণ radiologist-annotated bounding box দিয়ে score করা হয়নি।

**ইংরেজিতে বলো:**
> "Grad-CAM gives us a qualitative look at where the network is looking. For true positives, attention concentrates right on the lesion. For false negatives, it's often near the lesion but the signal is too weak to cross the threshold. We present this as a transparency aid for clinicians, not as validated localization."

## ১৩. Limitations (৮:৫৫ – ৯:৩০)

**বাংলায় বোঝো:** honest থাকো — একটা dataset, তিনটা fold, আট-ছবির block সম্পূর্ণ group হিসেবে রাখা (conservative কিন্তু ভিন্ন subject merge হয়ে যেতে পারে এমন সম্ভাবনা আছে), Grad-CAM শুধু qualitative। পরবর্তী ধাপ: একই protocol CBIS-DDSM আর INbreast-এ apply করা, সাথে radiologist review।

**ইংরেজিতে বলো:**
> "We want to be upfront about limits. One dataset. Three folds. We chose to keep eight-image identifier blocks intact, which is conservative but could in principle merge distinct subjects. Grad-CAM is qualitative only, with no overlap metric against radiologist annotations. Next step: the same protocol on CBIS-DDSM and INbreast, with richer metadata and real radiologist review."

*এই অংশ confidence নিয়ে বলবে, sorry-sorry ভাব না — limitation স্পষ্ট করে বললে judge-রা বেশি respect করে।*

## ১৪. References (৯:৩০ – ৯:৪০)

**বাংলায় বোঝো:** শুধু বলো — dataset, দুইটা backbone, Grad-CAM, আর আগের Mini-DDSM কাজের reference — পুরো list paper-এ আছে। ৫-১০ সেকেন্ডের বেশি না।

**ইংরেজিতে বলো:**
> "Ten references — the dataset, the two backbones, Grad-CAM, and the prior Mini-DDSM work we compare against. Full list is in the paper."

## ১৫. Thank you (৯:৪০ – ১০:১৫)

**বাংলায় বোঝো:** এক লাইনে পুরো paper summarize করো — আগে audit করো, simple ensemble জেতে, threshold matter করে, আর limitation-এ honest থাকো। সব code/data public, QR code স্ক্যান করলে live demo নিজের ফোনেই চালানো যায়।

**ইংরেজিতে বলো:**
> "To summarize in one sentence: audit first, a simple ensemble wins, thresholds matter, and we're honest about what we don't know. Everything — code, the patient-grouping audit, all split files — is public on GitHub. If you scan this QR code right now, you can try the live model yourself, on your own phone, no install. Thank you — I'm happy to take questions."

## ১৬. Any questions

স্লাইডের সামনে দাঁড়িয়ে থাকো, কথা চালিয়ে যেও না। ২-৩ সেকেন্ড চুপ থাকলে প্রথম প্রশ্নটা আসবে।

---

## প্রশ্নোত্তর (Q&A) — বাংলায় বুঝে নাও, ইংরেজিতে উত্তর দাও

**প্রশ্ন: শুধু একটা dataset — এটা কি limitation না?**
বাংলায় বোঝো: হ্যাঁ, এবং এটা paper-এই স্বীকার করা আছে। তোমার contribution "সবচেয়ে বেশি accuracy" না — বরং একটা rigorous, leak-free protocol যেটা সততার সাথে apply করা হয়েছে, আর সেই একই audit method সরাসরি অন্য dataset-এ transfer করা যায় — সেটাই পরের ধাপ।
> "Correct, and we say so explicitly in Limitations. Our contribution isn't 'the best accuracy ever reported' — it's a rigorous, leak-free protocol applied honestly to one dataset, with the audit methodology designed to transfer directly to CBIS-DDSM and INbreast, which is our immediate next step."

**প্রশ্ন: Fixed 50/50 ensemble কেন, learned weight কেন না?**
বাংলায় বোঝো: ablation-এই এই প্রশ্নের উত্তর আছে — fixed average, fold-selected "best model" strategy-কেও হারিয়েছে। একই data-তে ensemble weight learn করলে exactly সেই leakage হওয়ার ঝুঁকি থাকে যেটা এড়াতে পুরো paper লেখা হয়েছে।
> "We tested that question directly — see the ablation. A fixed average beats the fold-selected 'pick the best model' strategy. Learning ensemble weights on the same data you evaluate on risks exactly the kind of test-set leakage we spent the whole paper trying to eliminate."

**প্রশ্ন: Leakage শূন্য সেটা কীভাবে জানো — folder structure বিশ্বাস করেছ শুধু?**
বাংলায় বোঝো: না, programmatically verify করা হয়েছে ৯টা split-এই, শুধু ধরে নেওয়া হয়নি। এই কারণেই cross-class ID collision আর eight-image block ধরা পড়েছে, যেগুলো সাধারণ ID-based grouping ধরতে পারত না।
> "No — we verified it programmatically on all nine splits, not just assumed it from the directory layout. That's also why we caught the three cross-class ID collisions and the eight-image blocks that a naive ID-based grouping would have missed."

**প্রশ্ন: আট-ছবির block আলাদা না করে এক group রাখলে কেন?**
বাংলায় বোঝো: conservative approach — metadata দিয়ে নিশ্চিত করা যায়নি এই আট ছবি একজন না একাধিক patient-এর। তাই যেই option performance কখনোই fake বাড়াতে পারে না, সেটাই বেছে নেওয়া হয়েছে — data diversity একটু কমতে পারে, কিন্তু leakage কখনো হবে না।
> "Conservatism. We couldn't confirm from metadata whether those eight images represent one patient or several, so we chose the option that can only under-report performance, never inflate it."

**প্রশ্ন: 0.5 threshold-এ sensitivity 0.62 — এটা কি real screening-এর জন্য যথেষ্ট?**
বাংলায় বোঝো: default threshold-এ না, আর সেটাই operating-point slide-এর মূল কথা। Youden threshold (training-side data দিয়ে বেছে নেওয়া) ব্যবহার করলে প্রায় gap বন্ধ হয়ে যায় — sensitivity 0.79-এ উঠে যায়, extra cost প্রায় শূন্য। আসল deployment-এ clinician নিজের risk tolerance অনুযায়ী threshold ঠিক করবে।
> "Not at the default threshold, no — and that's exactly the point of the operating-point slide. Moving to the Youden threshold, chosen only on training-side data, nearly closes that gap — sensitivity to 0.79 — at essentially zero extra cost."

**প্রশ্ন: Calibration কি internal না external validate করা?**
বাংলায় বোঝো: internal — একই dataset-এর split-এর ভেতরেই fit আর evaluate করা হয়েছে। এটা honest ভাবে বলা আছে, কিন্তু অন্য hospital-এর data-তে external validation করা হয়নি — সেটা future work।
> "Internal only, and we say that directly. That's honest about what it is, but it's not external validation on a different hospital's data. That's future work."

**প্রশ্ন: EfficientNet-B4 আর ConvNeXtV2-Tiny কেন এই দুইটা specifically?**
বাংলায় বোঝো: দুইটা আলাদা ধরনের architecture চেয়েছ, একই রকমের দুই CNN না। EfficientNet-B4 compound-scaled MBConv CNN, ConvNeXtV2-Tiny বড় kernel, LayerNorm, Global Response Normalization ব্যবহার করে — transformer-ঘেঁষা design। দুইটার error কম correlated হলে averaging-এর লাভ বেশি হয়।
> "We wanted two architecturally different inductive biases rather than two similar CNNs... The idea is that their errors are less correlated, which is exactly what makes averaging useful."

**প্রশ্ন: দ্বিতীয় dataset-এ কী আলাদা করবে?**
বাংলায় বোঝো: একই audit-first protocol চালাবে — fold বানানোর আগেই cross-class ID collision, duplicate image, multi-image block check করা — তারপর radiologist এনে Grad-CAM map সত্যিকার lesion location-এর সাথে score করবে, যেটা এই paper-এ করা যায়নি।
> "Run the identical audit-first protocol... then bring in a radiologist to actually score the Grad-CAM maps against ground-truth lesion locations, which we couldn't do here."

**প্রশ্ন: Code/data সত্যিই public, না শুধু paper-এ বলা?**
বাংলায় বোঝো: সত্যিই public — GitHub link paper আর title slide দুইটাতেই আছে, model code-এর সাথে audit script আর exact split file-ও আছে। শেষ স্লাইডের QR code দিয়ে যে কেউ এখনই live demo চালাতে পারবে।
> "Really public — GitHub link in the paper and on the title slide, including the audit scripts and the exact split files, not just the model code."

---

## ৩০ সেকেন্ডের সংক্ষিপ্ত version (হঠাৎ থামিয়ে দিলে বা hallway-তে কাউকে বলতে হলে)

বাংলায় বোঝো: পুরো paper-এর সারমর্ম এক নিঃশ্বাসে — Mini-DDSM-এ accuracy এত আলাদা হওয়ার কারণ বেশিরভাগ paper patient-grouping check করে না। তুমি প্রতিটা identifier audit করেছ, leak-free protocol বানিয়েছ, আর দেখিয়েছ fixed 50/50 ensemble — সৎভাবে evaluate করলে — best single model বেছে নেওয়ার চেয়ে ভালো।

> "Mammography papers on Mini-DDSM report wildly different accuracy because most don't check whether a patient's images land on both sides of the train/test split. We audited every identifier, built a leak-free patient-grouped protocol, and found that a simple, fixed 50/50 ensemble of two backbones — honestly evaluated — beats cherry-picking the best single model. ROC-AUC 0.891, zero leaked patients, fully reproducible, code's on GitHub."

---

## Conference-দিনের checklist

- [ ] ল্যাপটপ full charge + charger সাথে; দুইটা PPTX (`Mini-DDSM-CSDE2026-Presentation.pptx` আর `Mini-DDSM-CSDE2026-IEEE-Template.pptx`) USB-তে রাখা — internet ছাড়াই backup
- [ ] venue-র Wi-Fi-তে আগে থেকে `/present` খুলে test করা, যদি browser থেকে present করো
- [ ] QR code স্লাইড test করা — room-এর শেষ থেকে নিজের ফোন দিয়ে scan হয় কিনা
- [ ] নিজের exact time slot জানা থাকা; সময় কম হলে ⚡ মার্ক করা জায়গাগুলো কাটার জন্য রেডি থাকা
- [ ] পানি হাতের কাছে; hook আর closing line বলার সময় slide-এ না তাকিয়ে audience-এর দিকে তাকানো
