"""Fills the official IEEE_CSDE_2026_Template.pptx with this paper's real
content, preserving every shape, layout, color and font exactly as supplied —
only the placeholder text (and the one sample chart) changes.

Usage (from repo root, needs python-pptx):
    python website/scripts/fill_ieee_template.py
"""

import copy
from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.util import Pt

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "IEEE_CSDE_2026_Template.pptx"
OUT = ROOT / "Mini-DDSM-CSDE2026-IEEE-Template.pptx"


def set_runs(shape, *texts: str) -> None:
    """Set each paragraph's first run to the given text, one per paragraph,
    in order. Leaves every other run/paragraph property (font, color, size,
    bullet) untouched by editing the existing run in place."""
    tf = shape.text_frame
    for para, text in zip(tf.paragraphs, texts):
        if not para.runs:
            continue
        para.runs[0].text = text
        for extra in para.runs[1:]:
            extra.text = ""


def shape(slide, name: str):
    matches = [s for s in slide.shapes if s.name == name]
    if not matches:
        raise KeyError(f"shape {name!r} not found on slide")
    return matches[0]


def main() -> None:
    pres = Presentation(str(SRC))
    slides = pres.slides

    # ---------------------------------------------------------- 1. Title
    s = slides[0]
    # The layout reuses the placeholder name "Text 0" five times — index by
    # shape_id order instead (matches the dump above: 8,9,10,11,12).
    by_id = {sh.shape_id: sh for sh in s.shapes}
    set_runs(by_id[8], "11th IEEE Asia-Pacific Conference on Computer Science and Data Engineering (IEEE CSDE 2026)")
    set_runs(by_id[9], "Paper ID: 3958")
    set_runs(by_id[10], "Multi-Backbone Ensemble Learning for Robust Breast Cancer Classification on the Mini-DDSM Mammography Dataset")
    for para in by_id[10].text_frame.paragraphs:
        for r in para.runs:
            r.font.size = Pt(28)  # down from 34pt, so the long real title fits the 1.65in box
    set_runs(by_id[11], "Sheikh Noor Abdullah, Nafis Shahriar, Mehejabin Tabassum Lamia, Mysha Ibnat Mourin, Farah Ulfat Urmi, A.B.M. Kabir Hossain")
    set_runs(by_id[12], "Dept. of Information and Communication Engineering, Bangladesh Army University of Engineering & Technology (BAUET), Bangladesh")

    # ---------------------------------------------------------- 2. Agenda
    # Six section labels already match our story exactly — nothing to change.

    # ---------------------------------------------------------- 3. Introduction
    s = slides[2]
    set_runs(shape(s, "Background text"), "Mammography screening drives early breast-cancer detection, and deep learning can support readers who face heavy caseloads and visually similar benign/malignant findings.")
    set_runs(shape(s, "Problem Statement text"), "Published Mini-DDSM accuracies range 0.87–0.99, but none disclose whether a patient's images were kept on one side of the split — so headline numbers may reflect leakage, not model skill.")
    set_runs(shape(s, "Motivation and Contribution text"), "We audit every patient identifier, enforce a patient-grouped split, and show a simple, untuned two-backbone ensemble still reaches strong, honestly-measured performance.")
    set_runs(shape(s, "Key statistic value"), "2.43M")
    set_runs(shape(s, "Key statistic label"), "women were newly diagnosed with breast cancer in 2024 — the scale that makes trustworthy screening AI worth getting right.")
    set_runs(shape(s, "Key statistic source"), "Source: GLOBOCAN 2024 [1]")

    # ---------------------------------------------------------- 4. Research Objectives
    s = slides[3]
    set_runs(shape(s, "Objective 1 text"), "Audit Mini-DDSM's patient identifiers and build a leakage-free, patient-grouped evaluation protocol.")
    set_runs(shape(s, "Objective 2 text"), "Train and ensemble two complementary, ImageNet-pretrained backbones — EfficientNet-B4 and ConvNeXtV2-Tiny.")
    set_runs(shape(s, "Objective 3 text"), "Report calibrated, honestly-uncertain results — repeated seeds and bootstrap confidence intervals — instead of one best-case split.")
    set_runs(shape(s, "Research question text"), "Under an audited, patient-grouped protocol, how much of Mini-DDSM's reported accuracy survives — and does a simple fixed ensemble still outperform either backbone alone?")

    # ---------------------------------------------------------- 5. Methodology
    s = slides[4]
    set_runs(shape(s, "Data Collection text"), "9,684 Mini-DDSM mammograms (2,728 Normal · 3,360 Benign · 3,596 Cancer), resolved into 2,417 audited patient groups.")
    set_runs(shape(s, "Preprocessing text"), "Otsu tissue mask, largest-contour crop, resize to 512×512, 4-view test-time augmentation (original, H-flip, V-flip, 180°).")
    set_runs(shape(s, "Proposed Approach text"), "EfficientNet-B4 + ConvNeXtV2-Tiny, ImageNet-pretrained, combined with a fixed, untuned 50/50 probability average.")
    set_runs(shape(s, "Evaluation text"), "Patient-grouped StratifiedGroupKFold × 3 folds, repeated over 3 seeds (42, 123, 2026); outer test untouched until the end.")
    set_runs(shape(s, "Dataset and tools"), "Dataset and Tools", "Mini-DDSM · PyTorch + timm + AdamW · trained on an RTX 5070.")
    set_runs(shape(s, "Evaluation metrics"), "Evaluation Metrics", "ROC-AUC, PR-AUC, sensitivity/specificity, Brier score, ECE · 2,000-sample patient bootstrap CIs.")

    # ---------------------------------------------------------- 6. Results
    s = slides[5]
    set_runs(
        shape(s, "Key findings text"),
        "Ensemble ROC-AUC 0.891 ± 0.008, PR-AUC 0.830 ± 0.012 across 3 seeds.",
        "Beats both single backbones and the fold-selected single-best (0.882 / 0.857 / 0.878).",
        "0 patient groups leak across any of the 9 outer seed–fold splits.",
    )
    set_runs(
        shape(s, "Discussion text"),
        "A fixed, untuned 50/50 ensemble is enough — architecture search was not the bottleneck here.",
        "At threshold 0.5 sensitivity is only 0.619; the train-side Youden threshold lifts it to 0.788, cutting missed cancers from ~343 to ~191 per seed.",
    )
    chart = shape(s, "Chart 0").chart
    chart.chart_title.text_frame.text = "Ensemble vs. weaker backbone — patient-level (%)"
    data = CategoryChartData()
    data.categories = ["ROC-AUC", "PR-AUC", "Accuracy", "Specificity"]
    data.add_series("Ensemble (proposed)", (89.1, 83.0, 81.2, 92.6))
    data.add_series("ConvNeXtV2-Tiny alone", (85.7, 78.2, 77.8, 91.2))
    chart.replace_data(data)

    # ---------------------------------------------------------- 7. Conclusion & future work
    s = slides[6]
    set_runs(
        shape(s, "Conclusion text"),
        "A patient-grouped, leakage-audited protocol is the right way to evaluate Mini-DDSM classifiers.",
        "The fixed ensemble reaches ROC-AUC 0.891 ± 0.008 — competitive, and fully reproducible from public code.",
        "Honest evaluation costs little accuracy, but it changes which published claims can be trusted.",
    )
    set_runs(
        shape(s, "Future work text"),
        "Extend the same audited protocol to CBIS-DDSM and INbreast.",
        "Add richer metadata and radiologist-reviewed lesion annotations.",
        "Move from qualitative Grad-CAM to a validated localisation metric.",
    )

    # ---------------------------------------------------------- 8. References
    s = slides[7]
    refs = [
        "[1] H. Sung et al., “Global cancer statistics 2024,” CA Cancer J. Clin., 2026.",
        "[2] C. D. Lekamlage et al., “Mini-DDSM: Mammography age estimation,” Proc. DMIP, 2020.",
        "[3] M. Tan and Q. V. Le, “EfficientNet: Rethinking model scaling for CNNs,” Proc. ICML, 2019.",
        "[4] S. Woo et al., “ConvNeXt V2: Co-designing and scaling ConvNets with MAE,” Proc. CVPR, 2023.",
        "[5] R. R. Selvaraju et al., “Grad-CAM: Visual explanations via gradient localization,” Proc. ICCV, 2017.",
        "[6] M. Heenaye-Mamode Khan et al., “Multi-class classification of breast abnormalities,” PLOS ONE, 2021.",
        "[7] A. Sahu, P. K. Das, and S. Meher, “High accuracy hybrid CNN classifiers for breast cancer,” Biomed. Signal Process. Control, 2023.",
        "[8] Y. Khourdifi et al., “Early breast cancer detection based on deep learning,” BioMedInformatics, 2024.",
        "[9] I. Loshchilov and F. Hutter, “Decoupled weight decay regularization,” Proc. ICLR, 2019.",
        "[10] N. Otsu, “A threshold selection method from gray-level histograms,” IEEE Trans. SMC, 1979.",
    ]
    refbox = shape(s, "Reference list")
    tf = refbox.text_frame
    base_p = tf.paragraphs[0]._p
    # Clone the first paragraph's XML (keeps its exact bullet/spacing/run
    # formatting) until there are as many paragraphs as references.
    while len(tf.paragraphs) < len(refs):
        base_p.addnext(copy.deepcopy(base_p))
    set_runs(refbox, *refs)
    # 10 short references plus the per-paragraph spacing used a hair more
    # height than the box allows — 15pt (was 16pt) gives it clean margin
    # above the footer, verified by rendering.
    for para in tf.paragraphs:
        for r in para.runs:
            r.font.size = Pt(15)

    # ---------------------------------------------------------- 9. Thank you
    s = slides[8]
    by_id = {sh.shape_id: sh for sh in s.shapes}
    set_runs(by_id[9], "sheikhnoorabdullah02@gmail.com  ·  Paper ID: 3958  ·  github.com/NoorAbdullah02/MINI_DDSM")

    # ---------------------------------------------------------- Speaker notes
    notes = [
        "Good morning. I'm Sheikh Noor Abdullah, presenting on behalf of our team from BAUET. Our paper asks a simple question: how good is breast-cancer classification on Mini-DDSM when we evaluate it honestly, patient by patient?",
        "Here's how the talk is organised: Introduction, Research Objectives, Methodology, Results, Conclusion and Future Work, then References.",
        "Breast cancer is the most diagnosed cancer in women — 2.43 million new cases in GLOBOCAN 2024. But several prior papers report 0.87 to 0.99 accuracy on Mini-DDSM without disclosing whether they grouped by patient — so those numbers may not mean what they seem to.",
        "Our three objectives: build a leakage-free, patient-grouped protocol; train and ensemble two complementary backbones under identical, untuned conditions; and report calibrated, honestly-uncertain results rather than one best-case number.",
        "Methodology in four steps: audited patient identifiers resolve 9,684 images into 2,417 groups; Otsu-crop and 4-view TTA preprocessing; a fixed 50/50 ensemble of EfficientNet-B4 and ConvNeXtV2-Tiny; and patient-grouped evaluation repeated over 3 seeds.",
        "Across three seeds, the ensemble reaches ROC-AUC 0.891 plus-minus 0.008, beating both backbones and the fold-selected single-best. Zero patient groups leak across any of the nine outer splits. At the default threshold sensitivity is only 0.62; the Youden threshold raises it to 0.79.",
        "To conclude: a patient-grouped, audited protocol is the right way to evaluate Mini-DDSM classifiers, and honest evaluation costs little accuracy while changing which claims can be trusted. Future work: extend to CBIS-DDSM and INbreast, add radiologist-reviewed annotations, and move to validated Grad-CAM localisation metrics.",
        "These are the core references behind the dataset, the two backbones, the explainability method, and the prior Mini-DDSM reports we compare against.",
        "Thank you — I'm happy to take questions on the patient-grouping protocol, the ensemble, the thresholds, or what we'd do differently on a second dataset.",
    ]
    for slide, note in zip(slides, notes):
        slide.notes_slide.notes_text_frame.text = note

    pres.save(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
