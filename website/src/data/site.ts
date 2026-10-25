// All numbers below are copied from the camera-ready paper and
// mini_ddsm_csde2026_fixed_patient_outputs/ (3 seeds × 3 folds, patient-grouped).

export const paper = {
  title: "Multi-Backbone Ensemble Learning for Robust Breast Cancer Classification on the Mini-DDSM Mammography Dataset",
  shortTitle: "Multi-Backbone Ensemble on Mini-DDSM",
  venue: "11th IEEE Asia-Pacific Conference on Computer Science and Data Engineering",
  venueShort: "IEEE CSDE 2026",
  location: "Cox's Bazar, Bangladesh",
  dates: "1–3 November 2026",
  paperId: "3958",
  pdf: "/paper.pdf",
  code: "https://github.com/NoorAbdullah02/MINI_DDSM",
};

export const authors = [
  { name: "Sheikh Noor Abdullah", email: "sheikhnoorabdullah02@gmail.com", lead: true },
  { name: "Nafis Shahriar", email: "nafisshahriar60@gmail.com" },
  { name: "Mehejabin Tabassum Lamia", email: "mehejabintabassumlamia@gmail.com" },
  { name: "Mysha Ibnat Mourin", email: "myshaibnat15@gmail.com" },
  { name: "Farah Ulfat Urmi", email: "farahulfaturmi@gmail.com" },
  { name: "A.B.M. Kabir Hossain", email: "kabir111192@gmail.com", supervisor: true },
];

export const affiliation = {
  dept: "Department of Information and Communication Engineering",
  uni: "Bangladesh Army University of Engineering & Technology (BAUET)",
  place: "Natore, Bangladesh",
};

export const headline = [
  { value: 0.8912, digits: 3, label: "ROC-AUC", sub: "± 0.0076 across 3 seeds" },
  { value: 0.8304, digits: 3, label: "PR-AUC", sub: "± 0.0120 across 3 seeds" },
  { value: 92.6, digits: 1, suffix: "%", label: "Specificity", sub: "at threshold 0.5" },
  { value: 0, digits: 0, label: "Patient overlap", sub: "train ↔ test, every split" },
];

export const audit = [
  { value: "9,684", label: "Mammograms", note: "2,728 Normal · 3,360 Benign · 3,596 Cancer" },
  { value: "2,417", label: "Patient groups", note: "682 Normal · 836 Benign · 899 Cancer" },
  { value: "3", label: "Cross-class ID collisions", note: "A_1500, A_1511, A_1632 — 24 records" },
  { value: "4", label: "Eight-image blocks", note: "Kept intact as one conservative group" },
  { value: "14", label: "Exact duplicate pairs", note: "SHA-256; none crosses a group boundary" },
  { value: "0", label: "Leaked groups", note: "Verified programmatically on all 9 splits" },
];

export const classCounts = [
  { name: "Normal", images: 2728, groups: 682, color: "var(--color-teal)" },
  { name: "Benign", images: 3360, groups: 836, color: "var(--color-indigo)" },
  { name: "Cancer", images: 3596, groups: 899, color: "var(--color-rose)" },
];

export const backbones = [
  {
    name: "EfficientNet-B4",
    tag: "Compound-scaled CNN",
    lr: "2 × 10⁻⁴",
    epochs: 25,
    patience: 6,
    innerAuc: "0.8970 ± 0.0195",
    outerAuc: "0.8820",
    color: "var(--color-gold)",
    blurb: "Balances depth, width and resolution with efficient MBConv blocks. Most sensitive single model at 0.5.",
  },
  {
    name: "ConvNeXtV2-Tiny",
    tag: "Modernised ConvNet",
    lr: "5 × 10⁻⁵",
    epochs: 17,
    patience: 4,
    innerAuc: "0.8864 ± 0.0310",
    outerAuc: "0.8572",
    color: "var(--color-indigo)",
    blurb: "Large kernels, LayerNorm and Global Response Normalisation — a different inductive bias to complement B4.",
  },
];

// Table IV — mean of three repeated seeds, identical outer-test TTA.
export const comparison = {
  methods: ["EfficientNet-B4", "ConvNeXtV2-Tiny", "Single-best", "Equal-average"],
  rows: [
    { metric: "ROC-AUC", values: [0.882, 0.8572, 0.8775, 0.8912] },
    { metric: "PR-AUC", values: [0.8198, 0.7821, 0.8078, 0.8304] },
    { metric: "Accuracy", values: [0.8071, 0.7777, 0.7931, 0.812] },
    { metric: "Sensitivity", values: [0.6515, 0.5517, 0.5832, 0.6188] },
    { metric: "Specificity", values: [0.8992, 0.9115, 0.9174, 0.9264] },
    { metric: "PPV", values: [0.7938, 0.79, 0.8071, 0.8335] },
  ],
};

// Table III — ensemble operating points (seed means; bootstrap CI envelope).
export const operatingPoints = {
  default: {
    label: "Threshold 0.5",
    accuracy: [0.812, ".796–.829"],
    sensitivity: [0.619, ".568–.667"],
    specificity: [0.926, ".900–.950"],
    ppv: [0.833, ".786–.879"],
    npv: [0.804, ".780–.828"],
    missed: [327, 343, 358],
    // Class-normalised confusion (rows: true Not-Cancer, true Cancer)
    cm: [
      [0.926, 0.074],
      [0.381, 0.619],
    ],
  },
  youden: {
    label: "Train-side Youden",
    accuracy: [0.82, ".801–.839"],
    sensitivity: [0.788, ".745–.824"],
    specificity: [0.839, ".807–.864"],
    ppv: [0.743, ".705–.777"],
    npv: [0.87, ".845–.890"],
    missed: [181, 187, 205],
    cm: [
      [0.839, 0.161],
      [0.212, 0.788],
    ],
  },
} as const;

// Outer-test patient-group ROC-AUC per repeated seed (metrics_by_seed.csv).
export const seedTable = [
  { seed: 42, effnet: 0.8746, convnext: 0.8543, ensemble: 0.8839 },
  { seed: 123, effnet: 0.8914, convnext: 0.8598, ensemble: 0.8991 },
  { seed: 2026, effnet: 0.8801, convnext: 0.8575, ensemble: 0.8906 },
];

export const calibrationStats = {
  brier: [0.1357, 0.1237],
  ece: [0.0745, 0.023],
};

export const gradcam = [
  { key: "tp", label: "True positive", note: "Cancer correctly flagged — attention concentrates on the annotated lesion." },
  { key: "tn", label: "True negative", note: "Not-Cancer correctly cleared — diffuse, low-intensity response." },
  { key: "fp", label: "False positive", note: "Dense tissue draws moderate attention inside the outlined region." },
  { key: "fn", label: "False negative", note: "The model looks near the lesion but the score stays below threshold." },
];

export const bibtex = `@inproceedings{abdullah2026minidsm,
  title     = {Multi-Backbone Ensemble Learning for Robust Breast Cancer
               Classification on the Mini-DDSM Mammography Dataset},
  author    = {Abdullah, Sheikh Noor and Shahriar, Nafis and
               Lamia, Mehejabin Tabassum and Mourin, Mysha Ibnat and
               Urmi, Farah Ulfat and Hossain, A.B.M. Kabir},
  booktitle = {Proc. 11th IEEE Asia-Pacific Conference on Computer
               Science and Data Engineering (CSDE)},
  address   = {Cox's Bazar, Bangladesh},
  year      = {2026}
}`;
