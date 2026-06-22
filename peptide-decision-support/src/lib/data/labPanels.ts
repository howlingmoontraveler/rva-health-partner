export const baselineLabs = [
  "CBC with differential",
  "Comprehensive metabolic panel",
  "Fasting glucose",
  "Fasting insulin",
  "HbA1c",
  "Lipid panel",
  "ApoB",
  "hs-CRP",
  "TSH",
  "Free T4",
  "Vitamin D",
  "B12",
  "Folate",
  "Ferritin",
  "Blood pressure",
  "Weight",
  "Waist circumference",
  "Body composition scan if available"
];

export const goalLabPanels = {
  fat_loss_metabolic: [
    "Kidney function/eGFR",
    "Liver enzymes",
    "Gallbladder history/symptoms",
    "Pregnancy status when relevant",
    "Diabetes medication review",
    "Amylase/lipase only if clinically indicated or symptomatic"
  ],
  muscle_preservation: ["Protein intake estimate", "Body composition scan", "Strength baseline"],
  recovery_injury: ["Diagnosis or rehab evaluation", "Pain/function baseline", "Inflammation markers if provider-directed"],
  hormone_gh_axis: [
    "IGF-1",
    "Total testosterone",
    "Free testosterone",
    "SHBG",
    "Estradiol when appropriate",
    "LH",
    "FSH",
    "DHEA-S",
    "Morning cortisol when clinically appropriate",
    "Sleep apnea screen"
  ],
  energy_mitochondrial: ["Ferritin", "B12", "Folate", "Vitamin D", "Thyroid panel", "Glucose/A1c", "Sleep apnea risk"],
  cognition_mood_focus: ["Thyroid panel", "B12", "Ferritin", "Vitamin D", "Sleep screen", "Blood pressure/resting heart rate"],
  inflammation_oxidative: ["hs-CRP", "Glucose control markers", "Waist circumference", "Sleep quality", "Provider evaluation of likely source"],
  skin_hair_connective: ["Ferritin", "Thyroid panel", "Vitamin D", "B12", "Protein intake", "Copper", "Zinc", "Ceruloplasmin if systemic/long-term copper peptide use is considered"],
  general_longevity: ["Waist circumference", "Blood pressure", "ApoB", "A1c", "Fasting insulin", "hs-CRP", "Strength", "Cardiorespiratory fitness proxy", "Sleep", "Body composition"]
} as const;
