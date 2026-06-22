import { bloodworkFields, type BloodworkField, type RangeRule } from "@/lib/data/functionalBloodwork";
import type {
  AgentConferenceFinding,
  AssessmentInput,
  BiomarkerInterpretation,
  BloodworkConferenceResults,
  BloodworkConfidence,
  BloodworkSignalStatus,
  ConferenceConsensusItem,
  ConferenceDisagreement,
  EvidenceSourceType
} from "@/lib/types/assessment";

type AgentProfile = {
  id: string;
  name: string;
  domain: string;
  lens: string;
};

const agentProfiles: AgentProfile[] = [
  {
    id: "metabolic",
    name: "Metabolic Pattern Agent",
    domain: "Glucose, insulin, body-composition risk",
    lens: "Prioritizes early insulin-resistance signals before glucose becomes overtly abnormal."
  },
  {
    id: "cardiolipid",
    name: "Cardiometabolic Lipid Agent",
    domain: "Atherogenic particles, triglycerides, HDL, inflammation",
    lens: "Weights ApoB, triglycerides, HDL, and hs-CRP more heavily than single-marker cholesterol narratives."
  },
  {
    id: "liver_renal",
    name: "Liver/Kidney Safety Agent",
    domain: "Clearance, safety gates, CMP-style context",
    lens: "Looks for safety checkpoints that should slow or stop therapy matching until a provider reviews the case."
  },
  {
    id: "thyroid_energy",
    name: "Thyroid/Energy Agent",
    domain: "TSH, Free T4, sleep, fatigue cofactors",
    lens: "Connects thyroid signals with nutrient cofactors and symptoms without diagnosing thyroid disease from labs alone."
  },
  {
    id: "nutrient_methylation",
    name: "Nutrient and Methylation Agent",
    domain: "Vitamin D, B12, folate, ferritin, homocysteine",
    lens: "Uses functional sufficiency ranges while asking for confirmatory markers when serum values are ambiguous."
  },
  {
    id: "functional_matrix",
    name: "Functional Medicine Matrix Agent",
    domain: "Cross-system pattern clustering",
    lens: "Synthesizes antecedents, triggers, mediators, and modifiable lifestyle levers from the lab pattern."
  },
  {
    id: "evidence_auditor",
    name: "Evidence Auditor Agent",
    domain: "Claim strength and overreach control",
    lens: "Downgrades low-evidence or anecdotal claims and demands corroboration before high-confidence conclusions."
  }
];

function resolveRange(rule: RangeRule | ((input: AssessmentInput) => RangeRule), input: AssessmentInput) {
  return typeof rule === "function" ? rule(input) : rule;
}

function round(value: number, places = 1) {
  return Number(value.toFixed(places));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function seededUnit(seed: string, label: string) {
  const hash = parseInt(hashString(`${seed}:${label}`).slice(0, 8), 16);
  return hash / 0xffffffff;
}

function jitter(seed: string, label: string, amplitude: number) {
  return (seededUnit(seed, label) - 0.5) * amplitude;
}

function confidenceLabel(score: number): BloodworkConfidence {
  if (score >= 0.74) return "high";
  if (score >= 0.46) return "moderate";
  return "low";
}

function getValue(input: AssessmentInput, key: string) {
  const value = input.labs.bloodwork?.[key];
  return Number.isFinite(value) ? value : undefined;
}

function rangeText(rule: RangeRule) {
  if (rule.low !== undefined && rule.high !== undefined) return `${rule.low}-${rule.high}`;
  if (rule.low !== undefined) return `>=${rule.low}`;
  if (rule.high !== undefined) return `<=${rule.high}`;
  return "Context-specific";
}

function hasHighRiskValue(key: string, value: number, standard: RangeRule) {
  if (key === "fasting_glucose" && value >= 126) return true;
  if (key === "hba1c" && value >= 6.5) return true;
  if (key === "triglycerides" && value >= 500) return true;
  if (key === "hs_crp" && value > 10) return true;
  if (key === "egfr" && value < 60) return true;
  if ((key === "alt" || key === "ast") && standard.high !== undefined && value > standard.high * 2) return true;
  if (key === "vitamin_d" && value > 100) return true;
  return false;
}

function standardStatus(key: string, value: number, standard: RangeRule): BiomarkerInterpretation["standardStatus"] {
  if (hasHighRiskValue(key, value, standard)) return "critical";
  if (standard.low !== undefined && value < standard.low) return "below";
  if (standard.high !== undefined && value > standard.high) return "above";
  if (standard.low === undefined && standard.high === undefined) return "not-established";
  return "within";
}

function functionalStatus(value: number, functional: RangeRule): BloodworkSignalStatus {
  const below = functional.low !== undefined && value < functional.low;
  const above = functional.high !== undefined && value > functional.high;

  if (!below && !above) return "optimal";
  if (below && functional.low !== undefined) {
    if (value < functional.low * 0.7) return "concern";
    return "low";
  }
  if (above && functional.high !== undefined) {
    if (value > functional.high * 1.35) return "concern";
    return "watch";
  }
  return "watch";
}

function signalDirection(value: number, functional: RangeRule): BiomarkerInterpretation["direction"] {
  const below = functional.low !== undefined && value < functional.low;
  const above = functional.high !== undefined && value > functional.high;
  if (below && above) return "mixed";
  if (below) return "low";
  if (above) return "high";
  return "none";
}

function summarizeBiomarker(field: BloodworkField, value: number, standard: RangeRule, functional: RangeRule) {
  const standardResult = standardStatus(field.key, value, standard);
  const functionalResult = functionalStatus(value, functional);

  if (standardResult === "critical") {
    return `${field.shortLabel} is in a provider-review zone before functional optimization claims are useful.`;
  }
  if (standardResult === "within" && functionalResult !== "optimal") {
    return `${field.shortLabel} is inside the broad conventional range but outside the tighter functional review band.`;
  }
  if (standardResult === "above" || standardResult === "below") {
    return `${field.shortLabel} is outside the conventional reference checkpoint and should be clinically reviewed.`;
  }
  return `${field.shortLabel} sits inside the functional review band for this conference.`;
}

function interpretBiomarkers(input: AssessmentInput): BiomarkerInterpretation[] {
  return bloodworkFields.flatMap((field) => {
    const value = getValue(input, field.key);
    if (value === undefined) return [];
    const standard = resolveRange(field.standard, input);
    const functional = resolveRange(field.functional, input);
    return [{
      key: field.key,
      label: field.label,
      value,
      unit: field.unit,
      standardRange: `${rangeText(standard)} ${field.unit} (${standard.text})`,
      functionalRange: `${rangeText(functional)} ${field.unit} (${functional.text})`,
      standardStatus: standardStatus(field.key, value, standard),
      functionalStatus: functionalStatus(value, functional),
      direction: signalDirection(value, functional),
      summary: summarizeBiomarker(field, value, standard, functional),
      evidenceTiers: field.evidenceTiers,
      sourceNotes: field.sourceNotes
    }];
  });
}

function byKey(interpretations: BiomarkerInterpretation[]) {
  return Object.fromEntries(interpretations.map((item) => [item.key, item])) as Record<string, BiomarkerInterpretation | undefined>;
}

function isFunctionalHigh(map: Record<string, BiomarkerInterpretation | undefined>, key: string) {
  const item = map[key];
  return item?.direction === "high" || item?.standardStatus === "above" || item?.standardStatus === "critical";
}

function isFunctionalLow(map: Record<string, BiomarkerInterpretation | undefined>, key: string) {
  const item = map[key];
  return item?.direction === "low" || item?.standardStatus === "below" || item?.standardStatus === "critical";
}

function hasAny(map: Record<string, BiomarkerInterpretation | undefined>, keys: string[]) {
  return keys.some((key) => map[key] !== undefined);
}

function tgHdlRatio(input: AssessmentInput) {
  const tg = getValue(input, "triglycerides");
  const hdl = getValue(input, "hdl");
  if (!tg || !hdl) return undefined;
  return round(tg / hdl, 2);
}

function buildAgentFinding(
  profile: AgentProfile,
  seed: string,
  baseConfidence: number,
  summary: string,
  supportingSignals: string[],
  concerns: string[],
  counterChecks: string[],
  evidenceTiers: EvidenceSourceType[]
): AgentConferenceFinding {
  const penalty = counterChecks.length > supportingSignals.length ? 0.12 : 0;
  const score = clamp(baseConfidence + supportingSignals.length * 0.045 - concerns.length * 0.01 - penalty + jitter(seed, profile.id, 0.08), 0.18, 0.95);
  return {
    agentId: profile.id,
    agentName: profile.name,
    domain: profile.domain,
    lens: profile.lens,
    confidenceScore: round(score, 2),
    confidenceLabel: confidenceLabel(score),
    summary,
    supportingSignals,
    concerns,
    counterChecks,
    evidenceTiers: [...new Set(evidenceTiers)]
  };
}

function metabolicAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[0];
  const ratio = tgHdlRatio(input);
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  if (isFunctionalHigh(map, "fasting_glucose")) signals.push("Fasting glucose is above the functional metabolic target.");
  if (isFunctionalHigh(map, "fasting_insulin")) signals.push("Fasting insulin suggests compensatory insulin demand before glucose may look overtly abnormal.");
  if (isFunctionalHigh(map, "hba1c")) signals.push("A1c is above the functional glycemic band.");
  if (isFunctionalHigh(map, "triglycerides")) signals.push("Triglycerides are above the functional lipid-handling target.");
  if (ratio !== undefined && ratio > 2) signals.push(`TG/HDL ratio is ${ratio}, a functional insulin-resistance pattern signal.`);
  if (isFunctionalHigh(map, "alt")) signals.push("ALT is above the functional band, which can cluster with metabolic liver stress.");

  if (map.hba1c?.standardStatus === "critical" || map.fasting_glucose?.standardStatus === "critical") {
    concerns.push("Diabetes-range screening values require confirmatory clinical evaluation.");
  }
  if (!hasAny(map, ["fasting_insulin", "hba1c", "fasting_glucose"])) counterChecks.push("Add fasting glucose, fasting insulin, and A1c before making a metabolic call.");
  if (map.hba1c && !hasAny(map, ["ferritin", "b12", "folate"])) counterChecks.push("A1c can be distorted by anemia and red-cell turnover; CBC, ferritin, B12, and folate help adjudicate.");
  if (ratio === undefined) counterChecks.push("TG/HDL ratio could not be calculated without both triglycerides and HDL-C.");

  const summary = signals.length
    ? "The metabolic lens sees early insulin-resistance or glycemic-drift signals worth reviewing before therapy selection."
    : "The metabolic lens does not see a strong insulin-resistance pattern from the entered values.";

  return buildAgentFinding(profile, seed, 0.5, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Epidemiology/observational",
    "Mechanistic/physiology",
    "Functional medicine clinical practice"
  ]);
}

function cardiolipidAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[1];
  const ratio = tgHdlRatio(input);
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  if (isFunctionalHigh(map, "apob")) signals.push("ApoB is above the functional atherogenic-particle target.");
  if (isFunctionalHigh(map, "ldl")) signals.push("LDL-C is above the functional review band.");
  if (isFunctionalHigh(map, "triglycerides")) signals.push("Triglycerides are elevated, which often clusters with remnant risk and insulin resistance.");
  if (isFunctionalLow(map, "hdl")) signals.push("HDL-C is below the functional favorable-signal band.");
  if (isFunctionalHigh(map, "hs_crp")) signals.push("hs-CRP is above the functional inflammatory target.");
  if (ratio !== undefined && ratio > 2) signals.push(`TG/HDL ratio is ${ratio}, adding cardiometabolic risk context.`);

  if (map.hs_crp && map.hs_crp.value > 10) concerns.push("hs-CRP above 10 mg/L often warrants repeat testing and evaluation for acute inflammation or infection.");
  if (map.triglycerides && map.triglycerides.value >= 500) concerns.push("Triglycerides at or above 500 mg/dL require prompt provider review because pancreatitis risk becomes clinically relevant.");
  if (!map.apob) counterChecks.push("ApoB is missing; LDL-C alone can misclassify atherogenic particle burden.");
  if (map.hdl && map.hdl.value >= 60 && isFunctionalHigh(map, "apob")) {
    counterChecks.push("High HDL-C does not cancel out elevated ApoB; particle burden should stay visible.");
  }

  const summary = signals.length
    ? "The lipid/inflammation lens sees cardiometabolic signals that should be prioritized before wellness-style optimization."
    : "The lipid/inflammation lens does not see a strong atherogenic or inflammatory pattern from the entered values.";

  return buildAgentFinding(profile, seed, 0.52, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Epidemiology/observational",
    "Mechanistic/physiology",
    "Functional medicine clinical practice"
  ]);
}

function liverRenalAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[2];
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  if (isFunctionalHigh(map, "alt")) signals.push("ALT is above the functional band and should be interpreted with metabolic, medication, alcohol, viral, and training context.");
  if (isFunctionalHigh(map, "ast")) signals.push("AST is above the functional band and could reflect liver or muscle sources.");
  if (isFunctionalLow(map, "egfr")) signals.push("eGFR is below the functional kidney reserve target.");

  if (map.egfr && map.egfr.value < 60) concerns.push("eGFR below 60 is a provider safety gate before therapy matching.");
  if (map.alt?.standardStatus === "critical" || map.ast?.standardStatus === "critical") concerns.push("Liver enzymes more than about 2x the lab upper checkpoint require provider review.");
  if (input.redFlags.kidneyDisease) concerns.push("Kidney disease was selected as a red flag.");
  if (input.redFlags.liverDisease) concerns.push("Liver disease or abnormal liver enzymes was selected as a red flag.");
  if (!hasAny(map, ["alt", "ast", "egfr"])) counterChecks.push("CMP-style liver and kidney markers are missing.");
  if (isFunctionalHigh(map, "ast") && !isFunctionalHigh(map, "alt")) counterChecks.push("AST-only elevation should be cross-checked against training load and CK before assuming liver origin.");

  const summary = signals.length || concerns.length
    ? "The safety lens sees liver or kidney context that should shape provider clearance and therapy timing."
    : "The safety lens does not see a major liver/kidney gate from the entered values.";

  return buildAgentFinding(profile, seed, 0.55, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Epidemiology/observational",
    "Mechanistic/physiology"
  ]);
}

function thyroidEnergyAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[3];
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  if (isFunctionalHigh(map, "tsh")) signals.push("TSH is above the functional review band.");
  if (isFunctionalLow(map, "free_t4")) signals.push("Free T4 is below the functional review band.");
  if (isFunctionalLow(map, "ferritin")) signals.push("Ferritin is below the functional sufficiency band and may affect energy, hair, training tolerance, or thyroid conversion context.");
  if (isFunctionalLow(map, "b12")) signals.push("B12 is below the functional sufficiency band.");
  if (isFunctionalLow(map, "vitamin_d")) signals.push("Vitamin D is below the functional target.");

  if (map.tsh?.standardStatus === "above" || map.free_t4?.standardStatus === "below") concerns.push("Thyroid values outside conventional checkpoints require provider interpretation.");
  if (input.medications.thyroidMedication) concerns.push("Thyroid medication is present, so labs should be interpreted by the prescribing clinician.");
  if (!map.free_t4 && map.tsh) counterChecks.push("TSH needs Free T4, and often Free T3/antibodies, before drawing strong conclusions.");
  if (!map.tsh && map.free_t4) counterChecks.push("Free T4 needs TSH context before interpretation.");
  if (!hasAny(map, ["b12", "ferritin", "vitamin_d"])) counterChecks.push("Energy interpretation is underpowered without B12, ferritin, and vitamin D.");

  const summary = signals.length
    ? "The thyroid/energy lens sees possible hormone or cofactor friction, but symptoms and medication context are required."
    : "The thyroid/energy lens does not see a strong thyroid or cofactor pattern from the entered values.";

  return buildAgentFinding(profile, seed, 0.47, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Mechanistic/physiology",
    "Functional medicine clinical practice"
  ]);
}

function nutrientMethylationAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[4];
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  for (const key of ["vitamin_d", "b12", "folate", "ferritin"]) {
    if (isFunctionalLow(map, key)) signals.push(`${map[key]?.label} is below the functional sufficiency band.`);
    if (isFunctionalHigh(map, key)) signals.push(`${map[key]?.label} is above the functional review band.`);
  }
  if (isFunctionalHigh(map, "homocysteine")) signals.push("Homocysteine is above the functional methylation target.");

  if (map.vitamin_d && map.vitamin_d.value > 50) concerns.push("Vitamin D above 50 ng/mL should avoid reflexively pushing dose higher without calcium and provider context.");
  if (map.ferritin && map.ferritin.direction === "high" && isFunctionalHigh(map, "hs_crp")) {
    counterChecks.push("Ferritin may be acting as an inflammatory marker rather than pure iron-store status.");
  }
  if (isFunctionalHigh(map, "homocysteine") && !hasAny(map, ["b12", "folate", "egfr", "tsh"])) {
    counterChecks.push("High homocysteine needs B12, folate, kidney, thyroid, and medication context before assigning cause.");
  }
  if (map.b12 && map.b12.direction === "low") counterChecks.push("MMA would help confirm functional B12 deficiency.");
  if (!hasAny(map, ["vitamin_d", "b12", "folate", "ferritin", "homocysteine"])) counterChecks.push("Nutrient/methylation markers are missing.");

  const summary = signals.length
    ? "The nutrient lens sees modifiable sufficiency signals, but confirmatory tests matter when values are borderline or discordant."
    : "The nutrient lens does not see a strong deficiency or methylation pattern from the entered values.";

  return buildAgentFinding(profile, seed, 0.45, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Epidemiology/observational",
    "Mechanistic/physiology",
    "Functional medicine clinical practice"
  ]);
}

function functionalMatrixAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[5];
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];

  const metabolicCluster = [isFunctionalHigh(map, "fasting_insulin"), isFunctionalHigh(map, "triglycerides"), isFunctionalLow(map, "hdl"), isFunctionalHigh(map, "alt")].filter(Boolean).length;
  const inflammationCluster = [isFunctionalHigh(map, "hs_crp"), isFunctionalHigh(map, "ferritin"), isFunctionalHigh(map, "fasting_glucose")].filter(Boolean).length;
  const energyCluster = [isFunctionalHigh(map, "tsh"), isFunctionalLow(map, "free_t4"), isFunctionalLow(map, "ferritin"), isFunctionalLow(map, "b12"), isFunctionalLow(map, "vitamin_d")].filter(Boolean).length;

  if (metabolicCluster >= 2) signals.push("Metabolic mediator cluster: insulin demand, triglycerides/HDL, and liver-enzyme context point in the same direction.");
  if (inflammationCluster >= 2) signals.push("Inflammation mediator cluster: hs-CRP/ferritin/glycemic signals may share upstream drivers.");
  if (energyCluster >= 2) signals.push("Energy mediator cluster: thyroid and nutrient cofactors should be reviewed before peptide-first explanations.");
  if (input.lifestyle.sleepHours < 7) signals.push("Sleep is below the foundational target and can affect appetite, glucose, recovery, thyroid, and inflammation interpretation.");
  if (input.lifestyle.resistanceTrainingDays < 2) signals.push("Low resistance-training frequency weakens body-composition and glucose-disposal resilience.");

  if (signals.length > 0) concerns.push("Functional pattern recognition is hypothesis-generating and should not outrank diagnosis-grade evidence.");
  if (input.labs.hasRecentLabs === "no" || input.labs.hasRecentLabs === "unsure") counterChecks.push("The conference is underpowered until current labs are available.");
  if (!input.lifestyle.willingTrackOutcomes) counterChecks.push("Outcome tracking is needed to test whether a functional hypothesis is useful.");

  const summary = signals.length
    ? "The functional matrix lens sees cross-system patterns that can guide provider questions and lifestyle priorities."
    : "The functional matrix lens does not see enough cross-system data to make a strong pattern call.";

  return buildAgentFinding(profile, seed, 0.4, summary, signals, concerns, counterChecks, [
    "Epidemiology/observational",
    "Mechanistic/physiology",
    "Functional medicine clinical practice"
  ]);
}

function evidenceAuditorAgent(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>, seed: string) {
  const profile = agentProfiles[6];
  const signals: string[] = [];
  const concerns: string[] = [];
  const counterChecks: string[] = [];
  const entered = Object.keys(input.labs.bloodwork ?? {}).length;

  if (entered < 6) concerns.push("Too few numeric biomarkers were entered for a confident multi-system interpretation.");
  if (map.fasting_glucose?.standardStatus === "critical" || map.hba1c?.standardStatus === "critical") signals.push("Glycemic values in a diagnostic-review zone carry stronger evidence than functional-range nuance.");
  if (map.hs_crp && map.hs_crp.value > 10) signals.push("Very high hs-CRP should be treated as an acute/inflammatory rule-out before optimization.");
  if (isFunctionalHigh(map, "homocysteine")) concerns.push("Homocysteine associations are meaningful, but intervention outcome evidence is mixed.");
  if (isFunctionalHigh(map, "tsh") && map.tsh?.standardStatus === "within") concerns.push("High-normal TSH is a functional hypothesis, not a thyroid diagnosis.");
  if (isFunctionalLow(map, "ferritin") || isFunctionalHigh(map, "ferritin")) counterChecks.push("Ferritin needs CBC, transferrin saturation, and inflammation context.");
  if (isFunctionalHigh(map, "ldl") && !map.apob) counterChecks.push("ApoB should adjudicate LDL particle burden before confident lipid conclusions.");

  if (!signals.length && !concerns.length) {
    signals.push("No entered biomarker reached a high-certainty clinical escalation threshold.");
  }

  const summary = "The evidence auditor keeps functional and anecdotal interpretations subordinate to guideline thresholds, replication, and provider review.";

  return buildAgentFinding(profile, seed, 0.58, summary, signals, concerns, counterChecks, [
    "RCT/guideline",
    "Epidemiology/observational",
    "Mechanistic/physiology"
  ]);
}

function buildFunctionalPatterns(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>) {
  const patterns: string[] = [];
  const ratio = tgHdlRatio(input);

  if ([isFunctionalHigh(map, "fasting_insulin"), isFunctionalHigh(map, "fasting_glucose"), isFunctionalHigh(map, "hba1c"), isFunctionalHigh(map, "triglycerides"), ratio !== undefined && ratio > 2].filter(Boolean).length >= 2) {
    patterns.push("Insulin-resistance / glycemic-drift pattern");
  }
  if ([isFunctionalHigh(map, "apob"), isFunctionalHigh(map, "triglycerides"), isFunctionalLow(map, "hdl"), isFunctionalHigh(map, "hs_crp")].filter(Boolean).length >= 2) {
    patterns.push("Cardiometabolic particle-and-inflammation pattern");
  }
  if ([isFunctionalHigh(map, "alt"), isFunctionalHigh(map, "ast"), isFunctionalHigh(map, "triglycerides"), isFunctionalHigh(map, "fasting_insulin")].filter(Boolean).length >= 2) {
    patterns.push("Metabolic liver-stress pattern");
  }
  if ([isFunctionalHigh(map, "tsh"), isFunctionalLow(map, "free_t4"), isFunctionalLow(map, "ferritin"), isFunctionalLow(map, "b12"), isFunctionalLow(map, "vitamin_d")].filter(Boolean).length >= 2) {
    patterns.push("Thyroid-energy cofactor pattern");
  }
  if ([isFunctionalLow(map, "b12"), isFunctionalLow(map, "folate"), isFunctionalHigh(map, "homocysteine")].filter(Boolean).length >= 2) {
    patterns.push("Methylation / B-vitamin adequacy pattern");
  }
  return patterns;
}

function buildSafetyEscalations(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>) {
  const escalations: string[] = [];
  if (map.fasting_glucose && map.fasting_glucose.value >= 126) escalations.push("Fasting glucose is in a diabetes-range screening zone and needs confirmatory provider evaluation.");
  if (map.hba1c && map.hba1c.value >= 6.5) escalations.push("A1c is in a diabetes-range screening zone and needs confirmatory provider evaluation.");
  if (map.triglycerides && map.triglycerides.value >= 500) escalations.push("Triglycerides >=500 mg/dL require prompt provider review.");
  if (map.hs_crp && map.hs_crp.value > 10) escalations.push("hs-CRP >10 mg/L should be repeated/evaluated for acute inflammation, infection, injury, or other active causes.");
  if (map.egfr && map.egfr.value < 60) escalations.push("eGFR below 60 is a safety gate before therapy selection.");
  if (map.alt?.standardStatus === "critical" || map.ast?.standardStatus === "critical") escalations.push("Liver enzymes more than about 2x the common upper checkpoint need provider review.");
  if (input.redFlags.kidneyDisease) escalations.push("Client selected kidney disease/reduced kidney function.");
  if (input.redFlags.liverDisease) escalations.push("Client selected liver disease/abnormal liver enzymes.");
  return [...new Set(escalations)];
}

function buildMissingData(input: AssessmentInput, map: Record<string, BiomarkerInterpretation | undefined>) {
  const missing: string[] = [];
  if (!hasAny(map, ["fasting_glucose", "fasting_insulin", "hba1c"])) missing.push("Metabolic conference needs fasting glucose, fasting insulin, and A1c.");
  if (!hasAny(map, ["apob", "triglycerides", "hdl", "ldl"])) missing.push("Cardiometabolic conference needs ApoB plus a lipid panel.");
  if (!hasAny(map, ["alt", "ast", "egfr"])) missing.push("Safety review needs CMP-style liver enzymes and eGFR.");
  if (!hasAny(map, ["tsh", "free_t4"])) missing.push("Thyroid review needs TSH and Free T4 at minimum.");
  if (!hasAny(map, ["vitamin_d", "b12", "folate", "ferritin", "homocysteine"])) missing.push("Nutrient/methylation review needs vitamin D, B12, folate, ferritin, and homocysteine.");
  if (input.labs.hasRecentLabs === "no" || input.labs.hasRecentLabs === "unsure") missing.push("Current lab date is unavailable or absent.");
  return [...new Set(missing)];
}

function buildConsensus(findings: AgentConferenceFinding[], patterns: string[], safetyEscalations: string[]): ConferenceConsensusItem[] {
  const consensus: ConferenceConsensusItem[] = [];
  const agentsWithSignals = findings.filter((finding) => finding.supportingSignals.length > 0);

  if (safetyEscalations.length) {
    consensus.push({
      theme: "Provider safety gate",
      agreement: "At least one agent found a value or history item that should be handled before optimization or peptide matching.",
      strength: "high",
      agents: findings.filter((finding) => finding.concerns.length > 0 || finding.agentId === "evidence_auditor").map((finding) => finding.agentName),
      followUp: "Route to licensed provider review and repeat/confirm abnormal values as clinically appropriate."
    });
  }

  for (const pattern of patterns) {
    const supportingAgents = agentsWithSignals
      .filter((finding) => {
        const text = `${finding.summary} ${finding.supportingSignals.join(" ")}`.toLowerCase();
        if (pattern.includes("Insulin")) return text.includes("insulin") || text.includes("glycemic") || text.includes("triglyceride");
        if (pattern.includes("Cardiometabolic")) return text.includes("apob") || text.includes("cardiometabolic") || text.includes("hs-crp");
        if (pattern.includes("liver")) return text.includes("alt") || text.includes("ast") || text.includes("liver");
        if (pattern.includes("Thyroid")) return text.includes("thyroid") || text.includes("tsh") || text.includes("energy");
        if (pattern.includes("Methylation")) return text.includes("homocysteine") || text.includes("b12") || text.includes("folate");
        return false;
      })
      .map((finding) => finding.agentName);

    consensus.push({
      theme: pattern,
      agreement: "Multiple lenses identify the same broad pattern, but this remains decision support rather than diagnosis.",
      strength: supportingAgents.length >= 3 ? "high" : "moderate",
      agents: supportingAgents.length ? supportingAgents : agentsWithSignals.map((finding) => finding.agentName).slice(0, 3),
      followUp: "Use the pattern to choose provider questions, confirmatory labs, lifestyle priorities, and outcome tracking."
    });
  }

  if (!consensus.length) {
    consensus.push({
      theme: "No dominant numeric pattern",
      agreement: "The agents did not converge on a strong abnormal blood-work pattern from the entered values.",
      strength: "low",
      agents: findings.map((finding) => finding.agentName),
      followUp: "Fill missing labs, verify collection conditions, and interpret alongside symptoms and history."
    });
  }

  return consensus;
}

function buildDisagreements(map: Record<string, BiomarkerInterpretation | undefined>): ConferenceDisagreement[] {
  const disagreements: ConferenceDisagreement[] = [];
  if (map.hdl && map.hdl.value >= 60 && isFunctionalHigh(map, "apob")) {
    disagreements.push({
      theme: "High HDL-C vs elevated ApoB",
      positions: ["Functional pattern agent may view high HDL-C as favorable.", "Lipid agent and evidence auditor keep ApoB visible as particle-burden risk."],
      resolution: "Do not let high HDL-C override elevated ApoB; review non-HDL-C, family history, blood pressure, glycemia, and ASCVD risk."
    });
  }
  if (isFunctionalHigh(map, "hba1c") && !isFunctionalHigh(map, "fasting_glucose") && !isFunctionalHigh(map, "fasting_insulin")) {
    disagreements.push({
      theme: "A1c drift without matching fasting glucose/insulin",
      positions: ["Metabolic agent treats A1c as a glycemic signal.", "Evidence auditor asks whether red-cell turnover, iron/B12/folate status, kidney disease, or assay factors are distorting A1c."],
      resolution: "Repeat fasting glucose/insulin, consider CGM or oral glucose testing if provider-directed, and check CBC/iron/B12/folate context."
    });
  }
  if (isFunctionalHigh(map, "ferritin") && isFunctionalHigh(map, "hs_crp")) {
    disagreements.push({
      theme: "Ferritin as iron stores vs inflammation",
      positions: ["Nutrient agent flags high ferritin.", "Inflammation and safety agents note ferritin can rise as an acute-phase reactant."],
      resolution: "Interpret ferritin with hs-CRP, transferrin saturation, CBC, liver enzymes, infection/inflammation context, and provider review."
    });
  }
  if (isFunctionalHigh(map, "tsh") && map.tsh?.standardStatus === "within" && !isFunctionalLow(map, "free_t4")) {
    disagreements.push({
      theme: "High-normal TSH",
      positions: ["Functional thyroid lens treats high-normal TSH as a possible friction signal.", "Evidence auditor does not treat it as diagnosis-grade without symptoms, antibodies, Free T4/T3, and repeat testing."],
      resolution: "Use symptoms, medication status, repeat TSH/Free T4, thyroid antibodies, and provider judgment before thyroid conclusions."
    });
  }
  if (isFunctionalHigh(map, "ldl") && map.apob?.functionalStatus === "optimal") {
    disagreements.push({
      theme: "LDL-C and ApoB discordance",
      positions: ["LDL-C appears above the functional band.", "ApoB suggests particle number may be less concerning than LDL-C alone implies."],
      resolution: "Risk discussion should prioritize ApoB/non-HDL-C, family history, metabolic health, and formal ASCVD risk rather than LDL-C in isolation."
    });
  }
  return disagreements;
}

function buildEvidenceBalance(interpretations: BiomarkerInterpretation[], findings: AgentConferenceFinding[]) {
  const tiers: EvidenceSourceType[] = ["RCT/guideline", "Epidemiology/observational", "Mechanistic/physiology", "Functional medicine clinical practice"];
  const balance = Object.fromEntries(tiers.map((tier) => [tier, 0])) as Record<EvidenceSourceType, number>;
  for (const tier of interpretations.flatMap((item) => item.evidenceTiers)) balance[tier] += 1;
  for (const tier of findings.flatMap((item) => item.evidenceTiers)) balance[tier] += 1;
  return balance;
}

function moderatorSummary(valuesEntered: number, patterns: string[], safetyEscalations: string[], missingData: string[]) {
  if (!valuesEntered) {
    return "No numeric blood-work values were entered, so the conference can only recommend which labs would make the provider review more useful.";
  }
  if (safetyEscalations.length) {
    return "The conference found at least one provider-review checkpoint. Functional interpretation should pause until the safety issue is clinically reviewed.";
  }
  if (patterns.length) {
    return `The conference converged on ${patterns.length} functional pattern${patterns.length === 1 ? "" : "s"} while preserving evidence-grade uncertainty.`;
  }
  if (missingData.length) {
    return "Entered values do not show a dominant pattern, but missing data limits confidence.";
  }
  return "Entered values are broadly reassuring across this functional conference, with routine provider context still required.";
}

export function runBloodworkConference(input: AssessmentInput): BloodworkConferenceResults {
  const seed = hashString(JSON.stringify({
    goals: input.goals,
    labs: input.labs.bloodwork ?? {},
    lifestyle: input.lifestyle,
    redFlags: input.redFlags
  }));
  const biomarkerInterpretations = interpretBiomarkers(input);
  const map = byKey(biomarkerInterpretations);
  const agentFindings = [
    metabolicAgent(input, map, seed),
    cardiolipidAgent(input, map, seed),
    liverRenalAgent(input, map, seed),
    thyroidEnergyAgent(input, map, seed),
    nutrientMethylationAgent(input, map, seed),
    functionalMatrixAgent(input, map, seed),
    evidenceAuditorAgent(input, map, seed)
  ];
  const functionalPatterns = buildFunctionalPatterns(input, map);
  const safetyEscalations = buildSafetyEscalations(input, map);
  const missingData = buildMissingData(input, map);
  const consensus = buildConsensus(agentFindings, functionalPatterns, safetyEscalations);
  const disagreements = buildDisagreements(map);

  return {
    version: "functional-bloodwork-conference-v1",
    seed,
    hasNumericBloodwork: biomarkerInterpretations.length > 0,
    valuesEntered: biomarkerInterpretations.length,
    moderatorSummary: moderatorSummary(biomarkerInterpretations.length, functionalPatterns, safetyEscalations, missingData),
    functionalPatterns,
    safetyEscalations,
    missingData,
    biomarkerInterpretations,
    agentFindings,
    consensus,
    disagreements,
    evidenceBalance: buildEvidenceBalance(biomarkerInterpretations, agentFindings)
  };
}
