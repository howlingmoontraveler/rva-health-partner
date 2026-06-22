export type EvidenceGrade = "A" | "B" | "C" | "D";

export type RegulatoryGroup = "group_1" | "group_2" | "group_3";

export type LabSet = {
  essential: string[];
  optional: string[];
  safety: string[];
  outcomeTracking: string[];
  clinicalMetrics: string[];
};

export type Therapy = {
  id: string;
  name: string;
  category: string;
  regulatoryGroup: RegulatoryGroup;
  evidenceGrade: EvidenceGrade;
  evidenceDescription: string;
  regulatoryStatus: string;
  providerOversightLevel: "Moderate" | "High";
  primaryUseCases: string[];
  secondaryUseCases: string[];
  weakUnsupportedUseCases: string[];
  mainRisks: string[];
  bestFitClient: string;
  poorFitClient: string;
  baselineLabs: LabSet;
  followUpLabs: string[];
  monitoringTimeline: string[];
  redFlags: string[];
  medicationInteractions: string[];
  stopReassessTriggers: string[];
  claimsToAvoid: string[];
};

export const regulatoryGroupLabels: Record<RegulatoryGroup, string> = {
  group_1: "FDA-approved prescription medication for specific indications",
  group_2: "Adjunctive wellness, nutrient, or redox support",
  group_3: "Off-label, compounded, limited-evidence, provider-only discussion"
};
