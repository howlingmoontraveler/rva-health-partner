import { baselineLabs, goalLabPanels } from "@/lib/data/labPanels";
import { goalLabels } from "@/lib/data/options";
import { therapies, therapyById } from "@/lib/data/therapies";
import { runBloodworkConference } from "@/lib/rules/bloodworkConference";
import type { AssessmentInput, GoalKey, MatchingResults, TherapyBucketItem } from "@/lib/types/assessment";
import { regulatoryGroupLabels } from "@/lib/types/therapy";

type Bucket = "providerDiscussion" | "adjunctOnly" | "poorFitOrCaution" | "labsNeededFirst";

type WorkingItem = {
  bucket: Bucket;
  therapyId: string;
  reasons: string[];
  cautions: string[];
  labs: string[];
  metrics: string[];
};

const bucketPriority: Record<Bucket, number> = {
  poorFitOrCaution: 1,
  labsNeededFirst: 2,
  providerDiscussion: 3,
  adjunctOnly: 4
};

const allMedicationLabels: Record<string, string> = {
  insulin: "Insulin",
  sulfonylureas: "Sulfonylureas",
  metformin: "Metformin",
  sglt2: "SGLT2 inhibitors",
  glp1Gip: "Current GLP-1/GIP medication",
  antihypertensives: "Blood pressure medications",
  anticoagulants: "Anticoagulants/blood thinners",
  immunosuppressants: "Immunosuppressants",
  corticosteroids: "Corticosteroids",
  thyroidMedication: "Thyroid medication",
  hormoneTherapy: "Hormone therapy",
  stimulantsAdhd: "Stimulants or ADHD medications",
  ssriSnri: "SSRIs/SNRIs",
  benzodiazepines: "Benzodiazepines",
  moodStabilizersAntipsychotics: "Mood stabilizers or antipsychotics"
};

const redFlagLabels: Record<string, string> = {
  pregnancy: "Pregnant, trying to conceive, or breastfeeding",
  mtcMen2: "Personal or family history of medullary thyroid carcinoma or MEN2",
  pancreatitis: "History of pancreatitis",
  gallbladderDisease: "Active or significant gallbladder disease",
  cancerHistory: "Current or past cancer history",
  uncontrolledDiabetesHypoglycemia: "Uncontrolled diabetes or recurrent hypoglycemia",
  kidneyDisease: "Kidney disease or reduced kidney function",
  liverDisease: "Liver disease or abnormal liver enzymes",
  activeInfection: "Active infection",
  autoimmuneCondition: "Autoimmune condition",
  activeEatingDisorder: "Diagnosed eating disorder or current binge/restrict cycle",
  psychiatricInstability: "Unstable psychiatric symptoms or recent psychiatric medication changes",
  researchPeptideUse: "Current non-prescribed peptide, research chemical, or injectable compound use"
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function hasGoal(input: AssessmentInput, goal: GoalKey) {
  return input.goals.primary === goal || input.goals.secondary.includes(goal);
}

function createItem(therapyId: string, bucket: Bucket, reason: string, caution?: string): WorkingItem {
  const therapy = therapyById[therapyId];
  return {
    therapyId,
    bucket,
    reasons: [reason],
    cautions: caution ? [caution] : [],
    labs: unique([...therapy.baselineLabs.essential, ...therapy.baselineLabs.safety]),
    metrics: unique([...therapy.baselineLabs.outcomeTracking, ...therapy.baselineLabs.clinicalMetrics])
  };
}

function addItem(items: Map<string, WorkingItem>, next: WorkingItem) {
  const current = items.get(next.therapyId);
  if (!current) {
    items.set(next.therapyId, next);
    return;
  }

  const winningBucket = bucketPriority[next.bucket] < bucketPriority[current.bucket] ? next.bucket : current.bucket;
  items.set(next.therapyId, {
    therapyId: next.therapyId,
    bucket: winningBucket,
    reasons: unique([...current.reasons, ...next.reasons]),
    cautions: unique([...current.cautions, ...next.cautions]),
    labs: unique([...current.labs, ...next.labs]),
    metrics: unique([...current.metrics, ...next.metrics])
  });
}

function toBucketItem(item: WorkingItem): TherapyBucketItem {
  const therapy = therapyById[item.therapyId];
  return {
    therapyId: therapy.id,
    therapyName: therapy.name,
    evidenceGrade: therapy.evidenceGrade,
    evidenceDescription: therapy.evidenceDescription,
    regulatoryStatus: therapy.regulatoryStatus,
    regulatoryGroup: regulatoryGroupLabels[therapy.regulatoryGroup],
    oversightLevel: therapy.providerOversightLevel,
    reasons: unique(item.reasons),
    cautions: unique(item.cautions),
    labs: unique(item.labs),
    metrics: unique(item.metrics),
    stopTriggers: therapy.stopReassessTriggers
  };
}

function addGoalBasedMatches(input: AssessmentInput, items: Map<string, WorkingItem>) {
  if (input.goals.primary === "fat_loss_metabolic") {
    addItem(items, createItem("tirzepatide", "providerDiscussion", "Your primary goal is fat loss, appetite control, or metabolic improvement."));
    addItem(items, createItem("semaglutide", "providerDiscussion", "Your primary goal is fat loss, appetite control, or metabolic improvement."));
    addItem(items, createItem("lipo_b", "adjunctOnly", "May be an adjunct discussion only; it is not a primary fat-loss therapy."));
    addItem(items, createItem("nad_plus", "adjunctOnly", "May be an adjunct discussion only after sleep, nutrition, and lab checkpoints are reviewed."));
    addItem(items, createItem("glutathione", "adjunctOnly", "May be an adjunct discussion for oxidative-stress context, not a fat-loss therapy."));
    addItem(items, createItem("aod_9604", "poorFitOrCaution", "AOD-9604 is not a first-line fat-loss option.", "Evidence is limited and marketing claims may exceed available human data."));
    addItem(items, createItem("mots_c", "poorFitOrCaution", "MOTS-C is research-adjacent and not proven for fat loss.", "Requires provider-only discussion and clear expectation limits."));
  }

  if (hasGoal(input, "muscle_preservation")) {
    addItem(items, createItem("tirzepatide", "labsNeededFirst", "Lean-mass monitoring is important if GLP-1/GIP therapy is being considered."));
    addItem(items, createItem("semaglutide", "labsNeededFirst", "Lean-mass monitoring is important if GLP-1 therapy is being considered."));
  }

  if (input.goals.primary === "recovery_injury") {
    addItem(items, createItem("bpc_tb", input.lifestyle.hasDiagnosedInjury ? "providerDiscussion" : "labsNeededFirst", "Injury/recovery interest requires diagnosis, rehab context, and provider review.", "BPC-157/TB-500 has limited human evidence and should not replace diagnosis or rehabilitation."));
    addItem(items, createItem("glutathione", "adjunctOnly", "May be discussed as a general recovery adjunct, not an injury-healing treatment."));
    addItem(items, createItem("nad_plus", "adjunctOnly", "May be discussed as a general recovery adjunct, not an injury-healing treatment."));
  }

  if (input.goals.primary === "hormone_gh_axis") {
    addItem(items, createItem("sermorelin", "labsNeededFirst", "GH-axis interest requires IGF-1, glucose/A1c, thyroid, sex-hormone context when appropriate, and sleep apnea screening."));
  }

  if (input.goals.primary === "energy_mitochondrial") {
    addItem(items, createItem("nad_plus", "adjunctOnly", "Energy goals may warrant an adjunct discussion after sleep, nutrition, medications, and nutrient labs are reviewed."));
    addItem(items, createItem("lipo_b", "adjunctOnly", "May be discussed as nutrient support when deficiency risk or dietary context exists."));
    addItem(items, createItem("glutathione", "adjunctOnly", "May be discussed as a redox adjunct with measurable outcomes."));
    addItem(items, createItem("mots_c", "poorFitOrCaution", "MOTS-C is research-adjacent and not a proven fatigue or mitochondrial therapy."));
  }

  if (input.goals.primary === "cognition_mood_focus") {
    addItem(items, createItem("semax_selank", "labsNeededFirst", "Cognition, mood, or focus goals require sleep, mental health, medication, thyroid, and nutrient screening before peptide discussion.", "This is provider-only and not a treatment for psychiatric conditions."));
  }

  if (input.goals.primary === "inflammation_oxidative") {
    addItem(items, createItem("glutathione", "adjunctOnly", "May be discussed as an oxidative-stress adjunct after the likely source is evaluated."));
    addItem(items, createItem("nad_plus", "adjunctOnly", "May be discussed as a wellness adjunct, not a disease treatment."));
  }

  if (input.goals.primary === "skin_hair_connective") {
    addItem(items, createItem("ghk_cu", "labsNeededFirst", "Skin, hair, or connective-tissue goals require thyroid, ferritin, vitamin D, B12, protein, and copper/zinc context before systemic discussion."));
  }

  if (input.goals.primary === "general_longevity") {
    addItem(items, createItem("nad_plus", "adjunctOnly", "Longevity interest should first be converted into measurable health-risk markers; NAD+ may be an adjunct only after baseline review."));
    addItem(items, createItem("glutathione", "adjunctOnly", "Longevity interest should first be converted into measurable health-risk markers; glutathione may be an adjunct only after baseline review."));
    addItem(items, createItem("lipo_b", "adjunctOnly", "Nutrient support may be relevant only when deficiency risk or diet context exists."));
    for (const id of ["mots_c", "sermorelin", "ghk_cu", "semax_selank"]) {
      addItem(items, createItem(id, "poorFitOrCaution", "General longevity does not directly match to peptide therapy.", "Research-adjacent or limited-evidence therapies are not first-line for longevity goals."));
    }
  }
}

function applyRedFlags(input: AssessmentInput, items: Map<string, WorkingItem>) {
  const r = input.redFlags;

  if (r.pregnancy) {
    for (const therapy of therapies) {
      addItem(items, createItem(therapy.id, "poorFitOrCaution", "Pregnancy, trying to conceive, or breastfeeding requires licensed medical clearance before therapy matching."));
    }
    return;
  }

  if (r.mtcMen2) {
    for (const id of ["tirzepatide", "semaglutide"]) {
      addItem(items, createItem(id, "poorFitOrCaution", "MTC/MEN2 history is a major GLP-1/GIP exclusion or clearance issue."));
    }
  }

  if (r.pancreatitis || r.gallbladderDisease || r.activeEatingDisorder) {
    for (const id of ["tirzepatide", "semaglutide"]) {
      addItem(items, createItem(id, "poorFitOrCaution", "Your answers include a GLP-1/GIP safety checkpoint that requires provider evaluation."));
    }
  }

  if (r.cancerHistory) {
    for (const id of ["sermorelin", "bpc_tb", "ghk_cu"]) {
      addItem(items, createItem(id, "poorFitOrCaution", "Cancer history requires provider or specialist clearance before growth/regeneration-adjacent therapy discussion."));
    }
  }

  if (r.psychiatricInstability) {
    addItem(items, createItem("semax_selank", "poorFitOrCaution", "Psychiatric instability makes Semax/Selank a poor fit without psychiatric/provider oversight."));
  }

  if (r.activeInfection || r.autoimmuneCondition) {
    addItem(items, createItem("bpc_tb", "poorFitOrCaution", "Active infection or autoimmune instability requires medical evaluation before injury peptide discussion."));
  }
}

function applyMedicationRules(input: AssessmentInput, items: Map<string, WorkingItem>) {
  const m = input.medications;
  if (m.insulin || m.sulfonylureas) {
    for (const id of ["tirzepatide", "semaglutide"]) {
      addItem(items, createItem(id, "labsNeededFirst", "Insulin or sulfonylurea use requires provider review for hypoglycemia risk."));
    }
  }
  if (m.antihypertensives) {
    for (const id of ["tirzepatide", "semaglutide"]) {
      addItem(items, createItem(id, "labsNeededFirst", "Blood pressure medications may need monitoring as weight, appetite, hydration, or intake changes."));
    }
  }
  if (m.anticoagulants) {
    addItem(items, createItem("bpc_tb", "poorFitOrCaution", "Anticoagulant use requires caution with injectables and injury-peptide discussions."));
  }
  if (m.immunosuppressants || m.corticosteroids) {
    addItem(items, createItem("bpc_tb", "poorFitOrCaution", "Immunosuppressants or corticosteroids require infection, wound-healing, and provider review before experimental peptide discussion."));
  }
  if (m.thyroidMedication) {
    for (const id of ["nad_plus", "lipo_b", "semax_selank", "sermorelin"]) {
      addItem(items, createItem(id, "labsNeededFirst", "Thyroid medication means thyroid labs and provider review should precede energy, cognition, or hormone-axis matching."));
    }
  }
  if (m.hormoneTherapy) {
    addItem(items, createItem("sermorelin", "labsNeededFirst", "Hormone therapy requires endocrine context before GH-axis or body-composition assumptions."));
  }
  if (m.stimulantsAdhd || m.ssriSnri || m.benzodiazepines || m.moodStabilizersAntipsychotics) {
    addItem(items, createItem("semax_selank", "poorFitOrCaution", "Psychiatric or stimulant medications require provider review; nootropic peptide claims should be handled cautiously."));
  }
}

function buildLabRecommendations(input: AssessmentInput, items: WorkingItem[]) {
  const goalLabs = unique([input.goals.primary, ...input.goals.secondary].flatMap((goal) => [...goalLabPanels[goal]]));
  const therapyLabs = unique(items.flatMap((item) => item.labs));
  const missing = input.labs.hasRecentLabs === "yes_upload" || input.labs.hasRecentLabs === "yes_manual" ? input.labs.missingLabs : baselineLabs;
  return {
    essential: unique([...baselineLabs, ...missing]),
    optional: goalLabs,
    safety: unique(therapyLabs),
    outcomeTracking: unique(items.flatMap((item) => item.metrics).filter((metric) => ["Weight", "Waist circumference", "Body composition", "Blood pressure", "IGF-1", "Glucose/A1c"].includes(metric))),
    clinicalMetrics: unique(items.flatMap((item) => item.metrics))
  };
}

function buildCoachingPriorities(input: AssessmentInput) {
  const priorities = ["Complete baseline labs before provider review", "Prepare a complete medication/supplement list", "Track outcomes for 8-12 weeks"];
  if (hasGoal(input, "fat_loss_metabolic") || hasGoal(input, "muscle_preservation")) {
    priorities.push("Set protein and resistance-training targets to protect lean mass");
    priorities.push("Track weight trend, waist, strength, and body composition if available");
  }
  if (input.lifestyle.resistanceTrainingDays < 2) priorities.push("Build a resistance-training foundation before relying on therapy alone");
  if (!input.lifestyle.proteinGrams || input.lifestyle.proteinGrams < 90) priorities.push("Clarify daily protein intake and adjust before or during any weight-loss plan");
  if (input.lifestyle.sleepHours < 7) priorities.push("Address sleep as a first-line checkpoint for energy, hormones, appetite, and recovery");
  if (hasGoal(input, "recovery_injury") && !input.lifestyle.hasDiagnosedInjury) priorities.push("Get a clinical diagnosis or rehab evaluation before injury peptide discussion");
  if (!input.lifestyle.hasNutritionPlan) priorities.push("Create a structured nutrition plan with measurable adherence");
  return unique(priorities);
}

export function runMatchingEngine(input: AssessmentInput): MatchingResults {
  const items = new Map<string, WorkingItem>();
  addGoalBasedMatches(input, items);
  applyRedFlags(input, items);
  applyMedicationRules(input, items);

  const keyRisks = Object.entries(input.redFlags)
    .filter(([, value]) => value)
    .map(([key]) => redFlagLabels[key] ?? key);

  const medicationConflicts = Object.entries(input.medications)
    .filter(([key, value]) => key !== "other" && value === true)
    .map(([key]) => allMedicationLabels[key] ?? key);

  const requiresProviderClearance = keyRisks.length > 0 || medicationConflicts.length > 0;
  const severeProviderGate = input.redFlags.pregnancy || input.redFlags.mtcMen2 || input.redFlags.cancerHistory || input.redFlags.psychiatricInstability || input.redFlags.researchPeptideUse;
  const workingItems = [...items.values()];
  const labRecommendations = buildLabRecommendations(input, workingItems);
  const bloodworkConference = runBloodworkConference(input);

  const therapyBuckets = {
    providerDiscussion: workingItems.filter((item) => item.bucket === "providerDiscussion").map(toBucketItem),
    adjunctOnly: workingItems.filter((item) => item.bucket === "adjunctOnly").map(toBucketItem),
    poorFitOrCaution: workingItems.filter((item) => item.bucket === "poorFitOrCaution").map(toBucketItem),
    labsNeededFirst: workingItems.filter((item) => item.bucket === "labsNeededFirst").map(toBucketItem)
  };

  const primaryGoal = goalLabels[input.goals.primary];
  const nextStep = severeProviderGate
    ? "Licensed medical review is required before therapy matching is finalized."
    : input.labs.hasRecentLabs === "no" || input.labs.hasRecentLabs === "unsure"
      ? "Complete baseline labs, then review this report with the coach and licensed provider."
      : "Review this assessment and recent labs with a licensed provider before any therapy decision.";

  return {
    requiresProviderClearance,
    severeProviderGate,
    keyRisks,
    medicationConflicts,
    therapyBuckets,
    labRecommendations,
    monitoringPlan: ["Baseline", "8-12 weeks", "3-6 months", "Provider-directed intervals"],
    coachingPriorities: buildCoachingPriorities(input),
    nextStep,
    providerHandoff: [
      `Primary goal: ${primaryGoal}.`,
      input.goals.secondary.length ? `Secondary goals: ${input.goals.secondary.map((goal) => goalLabels[goal]).join(", ")}.` : "Secondary goals: none selected.",
      keyRisks.length ? `Risk checkpoints: ${keyRisks.join(", ")}.` : "Risk checkpoints: no red flags selected.",
      medicationConflicts.length ? `Medication review: ${medicationConflicts.join(", ")}.` : "Medication review: no listed categories selected.",
      `Lab status: ${input.labs.hasRecentLabs}.`,
      `Blood-work conference: ${bloodworkConference.moderatorSummary}`,
      `Next step: ${nextStep}`
    ].join("\n"),
    bloodworkConference
  };
}
