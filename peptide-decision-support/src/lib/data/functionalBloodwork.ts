import type { EvidenceSourceType } from "@/lib/types/assessment";

type RangeInput = {
  user: {
    sexAtBirth?: string;
  };
};

export type RangeRule = {
  low?: number;
  high?: number;
  text: string;
};

export type BloodworkField = {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  group: "Metabolic" | "Cardiometabolic" | "Inflammation" | "Liver/Kidney" | "Thyroid" | "Nutrients";
  step?: string;
  placeholder?: string;
  standard: RangeRule | ((input: RangeInput) => RangeRule);
  functional: RangeRule | ((input: RangeInput) => RangeRule);
  evidenceTiers: EvidenceSourceType[];
  sourceNotes: string[];
  lowConcern?: string;
  highConcern?: string;
};

function sexAtBirth(input: RangeInput) {
  return input.user.sexAtBirth?.toLowerCase() ?? "";
}

function hdlStandard(input: RangeInput): RangeRule {
  return sexAtBirth(input).startsWith("female")
    ? { low: 50, text: ">=50 mg/dL is a common conventional HDL-C checkpoint for women" }
    : { low: 40, text: ">=40 mg/dL is a common conventional HDL-C checkpoint for men" };
}

function ferritinStandard(input: RangeInput): RangeRule {
  return sexAtBirth(input).startsWith("female")
    ? { low: 15, high: 150, text: "15-150 ng/mL is a common female lab reference interval" }
    : { low: 30, high: 400, text: "30-400 ng/mL is a common male lab reference interval" };
}

function ferritinFunctional(input: RangeInput): RangeRule {
  return sexAtBirth(input).startsWith("female")
    ? { low: 40, high: 100, text: "40-100 ng/mL is a common functional sufficiency target, interpreted with CBC and inflammation" }
    : { low: 50, high: 150, text: "50-150 ng/mL is a common functional sufficiency target, interpreted with CBC and inflammation" };
}

export const bloodworkFields: BloodworkField[] = [
  {
    key: "fasting_glucose",
    label: "Fasting glucose",
    shortLabel: "Glucose",
    unit: "mg/dL",
    group: "Metabolic",
    placeholder: "92",
    standard: { low: 70, high: 99, text: "70-99 mg/dL is conventionally normal fasting glucose; 100-125 suggests prediabetes; >=126 needs confirmatory diabetes evaluation" },
    functional: { low: 75, high: 90, text: "75-90 mg/dL is a common functional target for metabolic flexibility" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["ADA diagnostic criteria for prediabetes/diabetes", "Risk rises continuously across glycemic markers in observational cohorts"],
    lowConcern: "Low fasting glucose can reflect under-fueling, medication effects, or hypoglycemia risk.",
    highConcern: "Elevated fasting glucose should be interpreted with A1c, insulin, medications, and symptoms."
  },
  {
    key: "fasting_insulin",
    label: "Fasting insulin",
    shortLabel: "Insulin",
    unit: "uIU/mL",
    group: "Metabolic",
    placeholder: "7",
    standard: { low: 2, high: 25, text: "Lab reference intervals vary; many labs flag fasting insulin only at higher values" },
    functional: { low: 2, high: 8, text: "2-8 uIU/mL is a common functional target when interpreted with glucose, A1c, waist, and TG/HDL" },
    evidenceTiers: ["Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["Insulin resistance is physiologically upstream of many cardiometabolic patterns", "Functional practices often use tighter insulin targets than standard lab flags"],
    lowConcern: "Very low insulin with high glucose may need provider review for insulin deficiency physiology.",
    highConcern: "High fasting insulin can precede abnormal glucose and A1c."
  },
  {
    key: "hba1c",
    label: "HbA1c",
    shortLabel: "A1c",
    unit: "%",
    group: "Metabolic",
    step: "0.1",
    placeholder: "5.3",
    standard: { high: 5.6, text: "<5.7% is conventionally normal; 5.7-6.4% suggests prediabetes; >=6.5% needs confirmatory diabetes evaluation" },
    functional: { low: 4.8, high: 5.3, text: "4.8-5.3% is a common functional optimization band, interpreted with CBC and iron status" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["ADA diagnostic criteria for prediabetes/diabetes", "A1c can be distorted by anemia, hemoglobin variants, kidney disease, and altered red-cell turnover"],
    highConcern: "Rising A1c should be interpreted alongside fasting glucose, insulin, triglycerides, HDL, and medication history."
  },
  {
    key: "triglycerides",
    label: "Triglycerides",
    shortLabel: "TG",
    unit: "mg/dL",
    group: "Cardiometabolic",
    placeholder: "105",
    standard: { high: 149, text: "<150 mg/dL is a common conventional triglyceride checkpoint" },
    functional: { low: 50, high: 100, text: "50-100 mg/dL is a common functional target for insulin-sensitive lipid handling" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["Triglycerides are part of standard cardiometabolic risk assessment", "TG/HDL pattern is commonly used as a surrogate for insulin resistance"],
    highConcern: "Elevated triglycerides can reflect insulin resistance, alcohol intake, hypothyroid physiology, medications, or recent non-fasting intake."
  },
  {
    key: "hdl",
    label: "HDL-C",
    shortLabel: "HDL",
    unit: "mg/dL",
    group: "Cardiometabolic",
    placeholder: "52",
    standard: hdlStandard,
    functional: { low: 60, text: ">=60 mg/dL is often treated as a favorable functional HDL-C signal, but function matters more than HDL number alone" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["HDL-C is a conventional risk marker, though raising HDL-C pharmacologically has not reliably improved outcomes"],
    lowConcern: "Low HDL-C is most useful when interpreted with triglycerides, waist, glucose, insulin, and activity."
  },
  {
    key: "ldl",
    label: "LDL-C",
    shortLabel: "LDL",
    unit: "mg/dL",
    group: "Cardiometabolic",
    placeholder: "118",
    standard: { high: 99, text: "<100 mg/dL is a common conventional LDL-C checkpoint for many adults, with lower targets for higher-risk patients" },
    functional: { low: 70, high: 100, text: "70-100 mg/dL is a common functional review band; ApoB and overall risk context matter more than LDL-C alone" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["LDL-C lowering has strong outcomes evidence in appropriate risk groups", "Discordance between LDL-C and ApoB can change risk interpretation"],
    lowConcern: "Unexpectedly low LDL-C should be interpreted in context of diet, medications, thyroid, liver status, and clinical picture.",
    highConcern: "High LDL-C should be reviewed with ApoB, non-HDL-C, family history, metabolic health, and ASCVD risk."
  },
  {
    key: "apob",
    label: "ApoB",
    shortLabel: "ApoB",
    unit: "mg/dL",
    group: "Cardiometabolic",
    placeholder: "82",
    standard: { high: 89, text: "<90 mg/dL is a common lower-risk ApoB checkpoint; lower targets may apply for higher-risk patients" },
    functional: { high: 80, text: "<80 mg/dL is a common functional cardiometabolic target when risk is being optimized" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["ApoB estimates the number of atherogenic particles", "Guidelines increasingly use ApoB as a risk-enhancing or treatment-guiding marker"],
    highConcern: "High ApoB is a stronger atherogenic particle signal than LDL-C alone."
  },
  {
    key: "hs_crp",
    label: "hs-CRP",
    shortLabel: "hs-CRP",
    unit: "mg/L",
    group: "Inflammation",
    step: "0.1",
    placeholder: "0.8",
    standard: { high: 3, text: "<1 low, 1-3 average/moderate, >3 higher cardiovascular inflammatory signal; >10 often suggests acute inflammation and retesting" },
    functional: { high: 1, text: "<1.0 mg/L is a common functional and cardiovascular low-inflammatory target" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["AHA/CDC categories commonly classify <1, 1-3, and >3 mg/L", "Inflammation-source workup is more important than treating hs-CRP as a diagnosis"],
    highConcern: "High hs-CRP is nonspecific and should be repeated if illness, injury, dental issues, hard training, or infection is present."
  },
  {
    key: "alt",
    label: "ALT",
    shortLabel: "ALT",
    unit: "U/L",
    group: "Liver/Kidney",
    placeholder: "24",
    standard: { high: 55, text: "Typical lab upper limits often sit around 40-56 U/L, depending on the lab" },
    functional: { low: 8, high: 26, text: "Roughly 8-26 U/L is a common functional review band, with lower thresholds used for fatty-liver pattern recognition" },
    evidenceTiers: ["Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["ALT can rise with fatty liver, alcohol, medications, intense exercise, viral hepatitis, and other liver injury patterns"],
    lowConcern: "Very low ALT can be seen with low B6 status or low muscle mass but is nonspecific.",
    highConcern: "Elevated ALT needs provider review, especially when persistent or paired with symptoms or abnormal bilirubin/alk phos."
  },
  {
    key: "ast",
    label: "AST",
    shortLabel: "AST",
    unit: "U/L",
    group: "Liver/Kidney",
    placeholder: "22",
    standard: { high: 40, text: "Typical lab upper limits often sit around 35-40 U/L, depending on the lab" },
    functional: { low: 10, high: 26, text: "10-26 U/L is a common functional review band; interpret with ALT, GGT, bilirubin, muscle injury, and training" },
    evidenceTiers: ["Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["AST can reflect liver or muscle sources", "Hard training can transiently elevate AST"],
    highConcern: "Elevated AST should be interpreted with ALT, CK if training-related, alcohol/medication exposure, and symptoms."
  },
  {
    key: "egfr",
    label: "eGFR",
    shortLabel: "eGFR",
    unit: "mL/min/1.73m2",
    placeholder: "92",
    group: "Liver/Kidney",
    standard: { low: 60, text: ">=60 mL/min/1.73m2 is a common conventional checkpoint; persistent values below this require provider review" },
    functional: { low: 90, text: ">=90 mL/min/1.73m2 is a common functional kidney reserve target, interpreted with age, creatinine, cystatin C, urine albumin, and muscle mass" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["Kidney staging depends on persistence, albuminuria, and clinical context", "Creatinine-based eGFR can be distorted by muscle mass and diet"],
    lowConcern: "Lower eGFR is a safety checkpoint before injectable, dehydration-risk, or medication decisions."
  },
  {
    key: "tsh",
    label: "TSH",
    shortLabel: "TSH",
    unit: "uIU/mL",
    group: "Thyroid",
    step: "0.01",
    placeholder: "2.1",
    standard: { low: 0.4, high: 4.5, text: "About 0.4-4.5 uIU/mL is a common conventional reference interval" },
    functional: { low: 0.5, high: 2.5, text: "0.5-2.5 uIU/mL is a common functional review band, interpreted with Free T4, Free T3 when available, antibodies, medications, and symptoms" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["TSH is first-line screening in many guidelines", "Functional practices often use tighter bands but must avoid diagnosing from TSH alone"],
    lowConcern: "Low TSH can reflect hyperthyroid physiology, thyroid medication dose, pituitary context, or non-thyroid illness.",
    highConcern: "High-normal or elevated TSH is most meaningful when symptoms, Free T4/T3, antibodies, iodine status, and medications are reviewed."
  },
  {
    key: "free_t4",
    label: "Free T4",
    shortLabel: "Free T4",
    unit: "ng/dL",
    group: "Thyroid",
    step: "0.01",
    placeholder: "1.2",
    standard: { low: 0.8, high: 1.8, text: "0.8-1.8 ng/dL is a common lab reference interval" },
    functional: { low: 1, high: 1.5, text: "1.0-1.5 ng/dL is a common functional review band, interpreted with TSH, Free T3, medication, and symptoms" },
    evidenceTiers: ["RCT/guideline", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["Free T4 helps contextualize TSH", "Free hormone immunoassays have method limitations"],
    lowConcern: "Low Free T4 with high TSH suggests thyroid hormone production concerns; low Free T4 with low/normal TSH needs provider review.",
    highConcern: "High Free T4 should be reviewed for thyroid medication dose, hyperthyroid physiology, assay interference, and symptoms."
  },
  {
    key: "vitamin_d",
    label: "25(OH) Vitamin D",
    shortLabel: "Vitamin D",
    unit: "ng/mL",
    group: "Nutrients",
    placeholder: "36",
    standard: { low: 20, high: 50, text: "NIH ODS notes <20 ng/mL as inadequate for many people and >50 ng/mL may be associated with adverse effects" },
    functional: { low: 30, high: 50, text: "30-50 ng/mL is a conservative functional target that avoids pushing above the NIH caution zone" },
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["NIH Office of Dietary Supplements cautions about serum 25(OH)D above 50 ng/mL", "Optimal targets vary by guideline and clinical context"],
    lowConcern: "Low vitamin D should be interpreted with sun exposure, intake, body size, malabsorption risk, kidney/liver context, and calcium status.",
    highConcern: "High vitamin D can become a safety issue, especially with high calcium or supplementation."
  },
  {
    key: "b12",
    label: "Vitamin B12",
    shortLabel: "B12",
    unit: "pg/mL",
    group: "Nutrients",
    placeholder: "620",
    standard: { low: 200, high: 1100, text: "Common lab reference intervals often flag B12 below roughly 200 pg/mL" },
    functional: { low: 500, high: 900, text: "500-900 pg/mL is a common functional sufficiency band; MMA and homocysteine are better functional checks when available" },
    evidenceTiers: ["RCT/guideline", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["Serum B12 can miss functional deficiency", "MMA and homocysteine help adjudicate borderline results"],
    lowConcern: "Low or borderline B12 can affect methylation, neurologic symptoms, anemia, and energy, but symptoms and MMA/homocysteine matter.",
    highConcern: "High B12 is often supplementation-related but can need review if unexplained."
  },
  {
    key: "folate",
    label: "Folate",
    shortLabel: "Folate",
    unit: "ng/mL",
    group: "Nutrients",
    step: "0.1",
    placeholder: "12",
    standard: { low: 3, high: 20, text: "Lab reference intervals vary; low serum folate is often flagged below about 3 ng/mL" },
    functional: { low: 8, high: 20, text: "8-20 ng/mL is a common functional sufficiency band, interpreted with B12 and homocysteine" },
    evidenceTiers: ["RCT/guideline", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["Folate and B12 should be interpreted together", "Serum folate can reflect recent intake"],
    lowConcern: "Low folate may matter for methylation and red-cell indices, especially when B12 is also low.",
    highConcern: "High folate with low B12 can obscure B12 deficiency concerns and deserves review."
  },
  {
    key: "ferritin",
    label: "Ferritin",
    shortLabel: "Ferritin",
    unit: "ng/mL",
    group: "Nutrients",
    placeholder: "68",
    standard: ferritinStandard,
    functional: ferritinFunctional,
    evidenceTiers: ["RCT/guideline", "Epidemiology/observational", "Functional medicine clinical practice"],
    sourceNotes: ["Ferritin reflects iron stores but also rises with inflammation, liver disease, infection, and metabolic dysfunction", "CBC, transferrin saturation, hs-CRP, symptoms, and sex matter"],
    lowConcern: "Low ferritin can affect fatigue, hair shedding, restless legs, exercise tolerance, and anemia risk.",
    highConcern: "High ferritin is not automatically iron overload; it can reflect inflammation, liver stress, infection, or metabolic dysfunction."
  },
  {
    key: "homocysteine",
    label: "Homocysteine",
    shortLabel: "Homocysteine",
    unit: "umol/L",
    group: "Nutrients",
    step: "0.1",
    placeholder: "8.2",
    standard: { high: 15, text: "<15 umol/L is a common conventional checkpoint" },
    functional: { low: 5, high: 9, text: "5-9 umol/L is a common functional methylation/cardiometabolic target" },
    evidenceTiers: ["Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"],
    sourceNotes: ["Homocysteine is associated with vascular and methylation patterns, but lowering it has not uniformly improved outcomes in trials", "Interpret with B12, folate, B6, renal function, thyroid, and genetics"],
    highConcern: "High homocysteine should trigger nutrient and kidney/thyroid context, not automatic supplement stacking."
  }
];

export const bloodworkFieldByKey = Object.fromEntries(bloodworkFields.map((field) => [field.key, field])) as Record<string, BloodworkField>;
