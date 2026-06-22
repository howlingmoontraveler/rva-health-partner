"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { bloodworkFields } from "@/lib/data/functionalBloodwork";
import { baselineLabs } from "@/lib/data/labPanels";
import { runMatchingEngine } from "@/lib/rules/matchingEngine";
import type { AssessmentInput, AssessmentRecord, AssessmentStatus } from "@/lib/types/assessment";
import { saveAssessment, updateAssessmentStatus } from "@/server/db";
import { parseUploadedLabReport } from "@/server/labReportParser";

const boolFromForm = (formData: FormData, key: string) => formData.get(key) === "on" || formData.get(key) === "true";
const numberFromForm = (formData: FormData, key: string) => {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
};
const optionalNumberFromForm = (formData: FormData, key: string) => {
  const raw = String(formData.get(key) ?? "").trim().replaceAll(",", "");
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

function bloodworkFromForm(formData: FormData): Record<string, number> {
  const values: Record<string, number> = {};
  for (const field of bloodworkFields) {
    const value = optionalNumberFromForm(formData, `bloodwork_${field.key}`);
    if (value !== undefined) values[field.key] = value;
  }
  return values;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function baselineLabsFromBloodwork(values: Record<string, number>) {
  const labs = new Set<string>();
  for (const key of Object.keys(values)) {
    if (key === "fasting_glucose") labs.add("Fasting glucose");
    if (key === "fasting_insulin") labs.add("Fasting insulin");
    if (key === "hba1c") labs.add("HbA1c");
    if (["triglycerides", "hdl", "ldl"].includes(key)) labs.add("Lipid panel");
    if (key === "apob") labs.add("ApoB");
    if (key === "hs_crp") labs.add("hs-CRP");
    if (["alt", "ast", "egfr"].includes(key)) labs.add("Comprehensive metabolic panel");
    if (key === "tsh") labs.add("TSH");
    if (key === "free_t4") labs.add("Free T4");
    if (key === "vitamin_d") labs.add("Vitamin D");
    if (key === "b12") labs.add("B12");
    if (key === "folate") labs.add("Folate");
    if (key === "ferritin") labs.add("Ferritin");
  }
  return [...labs];
}

const schema = z.object({
  firstName: z.string().min(1),
  email: z.string().email(),
  ageRange: z.string().min(1),
  primaryGoal: z.string().min(1),
  secondaryGoals: z.array(z.string()).max(2)
});

export async function createAssessment(formData: FormData) {
  const parsed = schema.parse({
    firstName: formData.get("firstName"),
    email: formData.get("email"),
    ageRange: formData.get("ageRange"),
    primaryGoal: formData.get("primaryGoal"),
    secondaryGoals: formData.getAll("secondaryGoals")
  });

  const uploadedLabReport = await parseUploadedLabReport(formData.get("labReport"));
  const manualBloodwork = bloodworkFromForm(formData);
  const bloodwork = { ...uploadedLabReport.values, ...manualBloodwork };
  const availableLabs = unique([...formData.getAll("availableLabs").map(String), ...baselineLabsFromBloodwork(bloodwork)]);
  const input: AssessmentInput = {
    user: {
      firstName: parsed.firstName,
      email: parsed.email,
      ageRange: parsed.ageRange,
      sexAtBirth: String(formData.get("sexAtBirth") ?? "")
    },
    goals: {
      primary: parsed.primaryGoal as AssessmentInput["goals"]["primary"],
      secondary: parsed.secondaryGoals as AssessmentInput["goals"]["secondary"]
    },
    redFlags: {
      pregnancy: boolFromForm(formData, "pregnancy"),
      mtcMen2: boolFromForm(formData, "mtcMen2"),
      pancreatitis: boolFromForm(formData, "pancreatitis"),
      gallbladderDisease: boolFromForm(formData, "gallbladderDisease"),
      cancerHistory: boolFromForm(formData, "cancerHistory"),
      uncontrolledDiabetesHypoglycemia: boolFromForm(formData, "uncontrolledDiabetesHypoglycemia"),
      kidneyDisease: boolFromForm(formData, "kidneyDisease"),
      liverDisease: boolFromForm(formData, "liverDisease"),
      activeInfection: boolFromForm(formData, "activeInfection"),
      autoimmuneCondition: boolFromForm(formData, "autoimmuneCondition"),
      activeEatingDisorder: boolFromForm(formData, "activeEatingDisorder"),
      psychiatricInstability: boolFromForm(formData, "psychiatricInstability"),
      researchPeptideUse: boolFromForm(formData, "researchPeptideUse")
    },
    medications: {
      insulin: boolFromForm(formData, "insulin"),
      sulfonylureas: boolFromForm(formData, "sulfonylureas"),
      metformin: boolFromForm(formData, "metformin"),
      sglt2: boolFromForm(formData, "sglt2"),
      glp1Gip: boolFromForm(formData, "glp1Gip"),
      antihypertensives: boolFromForm(formData, "antihypertensives"),
      anticoagulants: boolFromForm(formData, "anticoagulants"),
      immunosuppressants: boolFromForm(formData, "immunosuppressants"),
      corticosteroids: boolFromForm(formData, "corticosteroids"),
      thyroidMedication: boolFromForm(formData, "thyroidMedication"),
      hormoneTherapy: boolFromForm(formData, "hormoneTherapy"),
      stimulantsAdhd: boolFromForm(formData, "stimulantsAdhd"),
      ssriSnri: boolFromForm(formData, "ssriSnri"),
      benzodiazepines: boolFromForm(formData, "benzodiazepines"),
      moodStabilizersAntipsychotics: boolFromForm(formData, "moodStabilizersAntipsychotics"),
      other: String(formData.get("otherMedications") ?? "")
    },
    labs: {
      hasRecentLabs: String(formData.get("hasRecentLabs")) as AssessmentInput["labs"]["hasRecentLabs"],
      availableLabs,
      missingLabs: baselineLabs.filter((lab) => !availableLabs.includes(lab)),
      bloodwork,
      uploadedReport: uploadedLabReport.summary
    },
    lifestyle: {
      resistanceTrainingDays: numberFromForm(formData, "resistanceTrainingDays"),
      proteinGrams: formData.get("proteinGrams") ? numberFromForm(formData, "proteinGrams") : null,
      sleepHours: numberFromForm(formData, "sleepHours"),
      tracksBodyMetrics: boolFromForm(formData, "tracksBodyMetrics"),
      hasNutritionPlan: boolFromForm(formData, "hasNutritionPlan"),
      hasDiagnosedInjury: boolFromForm(formData, "hasDiagnosedInjury"),
      willingBaselineLabs: boolFromForm(formData, "willingBaselineLabs"),
      willingTrackOutcomes: boolFromForm(formData, "willingTrackOutcomes")
    }
  };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record: AssessmentRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    status: input.redFlags.pregnancy || input.redFlags.mtcMen2 ? "Needs provider review" : "New",
    notes: "",
    ...input,
    results: runMatchingEngine(input)
  };

  await saveAssessment(record);
  redirect(`/assessment/${id}/results`);
}

export async function setAssessmentStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as AssessmentStatus;
  await updateAssessmentStatus(id, status);
}
