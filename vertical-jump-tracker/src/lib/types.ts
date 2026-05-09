export type PhaseId = "phase-1" | "phase-2" | "phase-3" | "phase-4";

export type ProgramPhase = {
  id: PhaseId;
  name: string;
  weeks: string;
  dates: string;
  goal: string;
  transcriptMethod: string;
  athleteAdaptation: string;
};

export type ProgramSession = {
  id: string;
  week: number;
  day: number;
  startDate: string;
  phaseId: PhaseId;
  phaseName: string;
  cycleEmphasis: string;
  wave: string;
  session: string;
  prep: string;
  power: string;
  strength: string;
  accessory: string;
  rationale: string;
};

export type SessionLog = {
  sessionId: string;
  completed: boolean;
  actualLoadOrTouch: string;
  rpe: number | null;
  knee24h: number | null;
  notes: string;
  updatedAt: string;
};

export type ReadinessLog = {
  id: string;
  date: string;
  bodyweight: number | null;
  sleepQuality: number | null;
  kneeAmPain: number | null;
  knee24hPain: number | null;
  achillesStiffness: number | null;
  bjjIntensity: number | null;
  sessionRpe: number | null;
  jumpContacts: number | null;
  sprintReps: number | null;
  notes: string;
  createdAt: string;
};

export type TestEntry = {
  id: string;
  date: string;
  week: number;
  standingReach: number;
  maxTouch: number | null;
  bestHoopHeight: number | null;
  ballType: string;
  makes: number | null;
  attempts: number | null;
  knee24h: number | null;
  notes: string;
  createdAt: string;
};

export type TrackerState = {
  sessionLogs: Record<string, SessionLog>;
  readinessLogs: ReadinessLog[];
  testEntries: TestEntry[];
};

export type DashboardMetrics = {
  currentWeek: number;
  currentPhase: ProgramPhase;
  bestMaxTouch: number | null;
  bestVertical: number | null;
  inchesToRim: number | null;
  bestHoopHeight: number | null;
  sevenDayKneeAvg: number | null;
  sevenDayRpeAvg: number | null;
};
