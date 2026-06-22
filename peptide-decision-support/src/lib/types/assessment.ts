export type GoalKey =
  | "fat_loss_metabolic"
  | "muscle_preservation"
  | "recovery_injury"
  | "hormone_gh_axis"
  | "energy_mitochondrial"
  | "cognition_mood_focus"
  | "inflammation_oxidative"
  | "skin_hair_connective"
  | "general_longevity";

export type AssessmentStatus =
  | "New"
  | "Needs labs"
  | "Needs provider review"
  | "Consult booked"
  | "Not eligible"
  | "Closed";

export type RedFlags = {
  pregnancy: boolean;
  mtcMen2: boolean;
  pancreatitis: boolean;
  gallbladderDisease: boolean;
  cancerHistory: boolean;
  uncontrolledDiabetesHypoglycemia: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  activeInfection: boolean;
  autoimmuneCondition: boolean;
  activeEatingDisorder: boolean;
  psychiatricInstability: boolean;
  researchPeptideUse: boolean;
};

export type Medications = {
  insulin: boolean;
  sulfonylureas: boolean;
  metformin: boolean;
  sglt2: boolean;
  glp1Gip: boolean;
  antihypertensives: boolean;
  anticoagulants: boolean;
  immunosuppressants: boolean;
  corticosteroids: boolean;
  thyroidMedication: boolean;
  hormoneTherapy: boolean;
  stimulantsAdhd: boolean;
  ssriSnri: boolean;
  benzodiazepines: boolean;
  moodStabilizersAntipsychotics: boolean;
  other: string;
};

export type LabStatus = {
  hasRecentLabs: "yes_upload" | "yes_manual" | "no" | "unsure";
  availableLabs: string[];
  missingLabs: string[];
  bloodwork: Record<string, number>;
  uploadedReport?: LabUploadSummary | null;
};

export type Lifestyle = {
  resistanceTrainingDays: number;
  proteinGrams: number | null;
  sleepHours: number;
  tracksBodyMetrics: boolean;
  hasNutritionPlan: boolean;
  hasDiagnosedInjury: boolean;
  willingBaselineLabs: boolean;
  willingTrackOutcomes: boolean;
};

export type UserInfo = {
  firstName: string;
  email: string;
  ageRange: string;
  sexAtBirth?: string;
};

export type ExtractedLabValue = {
  key: string;
  label: string;
  value: number;
  unit: string;
  rawLabel: string;
  confidence: "low" | "moderate" | "high";
};

export type LabUploadSummary = {
  fileName: string;
  fileType: string;
  fileSize: number;
  parsedAt: string;
  extractionMethod: "text" | "csv" | "html" | "pdf-text" | "unsupported" | "empty";
  extractedValues: ExtractedLabValue[];
  warnings: string[];
};

export type AssessmentInput = {
  user: UserInfo;
  goals: {
    primary: GoalKey;
    secondary: GoalKey[];
  };
  redFlags: RedFlags;
  medications: Medications;
  labs: LabStatus;
  lifestyle: Lifestyle;
};

export type TherapyBucketItem = {
  therapyId: string;
  therapyName: string;
  evidenceGrade: string;
  evidenceDescription: string;
  regulatoryStatus: string;
  regulatoryGroup: string;
  oversightLevel: string;
  reasons: string[];
  cautions: string[];
  labs: string[];
  metrics: string[];
  stopTriggers: string[];
};

export type EvidenceSourceType =
  | "RCT/guideline"
  | "Epidemiology/observational"
  | "Mechanistic/physiology"
  | "Functional medicine clinical practice";

export type BloodworkSignalStatus =
  | "missing"
  | "low"
  | "optimal"
  | "watch"
  | "concern"
  | "high-risk";

export type BloodworkConfidence = "low" | "moderate" | "high";

export type BiomarkerInterpretation = {
  key: string;
  label: string;
  value: number;
  unit: string;
  standardRange: string;
  functionalRange: string;
  standardStatus: "below" | "within" | "above" | "critical" | "not-established";
  functionalStatus: BloodworkSignalStatus;
  direction: "low" | "high" | "mixed" | "none";
  summary: string;
  evidenceTiers: EvidenceSourceType[];
  sourceNotes: string[];
};

export type AgentConferenceFinding = {
  agentId: string;
  agentName: string;
  domain: string;
  lens: string;
  confidenceScore: number;
  confidenceLabel: BloodworkConfidence;
  summary: string;
  supportingSignals: string[];
  concerns: string[];
  counterChecks: string[];
  evidenceTiers: EvidenceSourceType[];
};

export type ConferenceConsensusItem = {
  theme: string;
  agreement: string;
  strength: BloodworkConfidence;
  agents: string[];
  followUp: string;
};

export type ConferenceDisagreement = {
  theme: string;
  positions: string[];
  resolution: string;
};

export type BloodworkConferenceResults = {
  version: string;
  seed: string;
  hasNumericBloodwork: boolean;
  valuesEntered: number;
  moderatorSummary: string;
  functionalPatterns: string[];
  safetyEscalations: string[];
  missingData: string[];
  biomarkerInterpretations: BiomarkerInterpretation[];
  agentFindings: AgentConferenceFinding[];
  consensus: ConferenceConsensusItem[];
  disagreements: ConferenceDisagreement[];
  evidenceBalance: Record<EvidenceSourceType, number>;
};

export type MatchingResults = {
  requiresProviderClearance: boolean;
  severeProviderGate: boolean;
  keyRisks: string[];
  medicationConflicts: string[];
  therapyBuckets: {
    providerDiscussion: TherapyBucketItem[];
    adjunctOnly: TherapyBucketItem[];
    poorFitOrCaution: TherapyBucketItem[];
    labsNeededFirst: TherapyBucketItem[];
  };
  labRecommendations: {
    essential: string[];
    optional: string[];
    safety: string[];
    outcomeTracking: string[];
    clinicalMetrics: string[];
  };
  monitoringPlan: string[];
  coachingPriorities: string[];
  nextStep: string;
  providerHandoff: string;
  bloodworkConference?: BloodworkConferenceResults;
};

export type AssessmentRecord = AssessmentInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: AssessmentStatus;
  notes: string;
  results: MatchingResults;
};
