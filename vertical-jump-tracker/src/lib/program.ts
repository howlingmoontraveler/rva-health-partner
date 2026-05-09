import type { DashboardMetrics, PhaseId, ProgramPhase, ProgramSession, TrackerState } from "@/lib/types";

export const athleteProfile = {
  name: "John",
  age: 42,
  height: "5'9\"",
  bodyweight: 155,
  standingReach: 89,
  estimatedCurrentTouch: 116,
  estimatedCurrentVertical: 27,
  rimHeight: 120,
  target: "Tennis-ball dunk by Nov 1, 2026",
  startDate: "2026-05-11",
};

export const phases: ProgramPhase[] = [
  {
    id: "phase-1",
    name: "Capacity + Joint Armor",
    weeks: "1-12",
    dates: "May 11-Aug 2, 2026",
    goal: "Build force base, tendon capacity, clean landings, and repeatable approach mechanics.",
    transcriptMethod: "General prep, progressive overload, deloads, and low specificity early.",
    athleteAdaptation: "Replace GVT leg fatigue with recoverable strength work because hard leg days currently cost about 72 hours.",
  },
  {
    id: "phase-2",
    name: "Strength-Speed + Birthday Peak",
    weeks: "13-25",
    dates: "Aug 3-Nov 1, 2026",
    goal: "Convert strength into approach-jump power and peak tennis-ball dunk attempts.",
    transcriptMethod: "Heavy strength, bar speed, sprinting, low-volume plyos, max jumping, then taper.",
    athleteAdaptation: "Use short accelerations, adjustable hoops, and strict contact caps to respect the repaired meniscus.",
  },
  {
    id: "phase-3",
    name: "Rebuild + Second Macrocycle",
    weeks: "26-38",
    dates: "Nov 2-Jan 31, 2027",
    goal: "Rebuild force capacity after the birthday peak while preserving jump skill.",
    transcriptMethod: "Return to general work after a peak to stack the next macrocycle.",
    athleteAdaptation: "Drive squat and single-leg strength without using risky supramaximal eccentric overloads.",
  },
  {
    id: "phase-4",
    name: "Specific Peak + Regulation Push",
    weeks: "39-52",
    dates: "Feb 1-May 9, 2027",
    goal: "Peak sprint, plyo, and max-jump outputs for the next dunk progression.",
    transcriptMethod: "Highest specificity, sprints, plyos, max jumps, and volume taper.",
    athleteAdaptation: "Keep intensity high and junk contacts low so knee and Achilles stay quiet.",
  },
];

const start = new Date(`${athleteProfile.startDate}T00:00:00`);
const dayMs = 24 * 60 * 60 * 1000;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeek(date = new Date()) {
  const elapsed = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start.getTime()) / dayMs);
  return Math.min(52, Math.max(1, Math.floor(elapsed / 7) + 1));
}

export function phaseForWeek(week: number): ProgramPhase {
  if (week <= 12) return phases[0];
  if (week <= 25) return phases[1];
  if (week <= 38) return phases[2];
  return phases[3];
}

export function waveForWeek(week: number) {
  if ([12, 25, 38, 52].includes(week)) return "Test/deload: cut lifting volume 50%, test max touch late week.";
  if (week === 24) return "Taper: reduce lifting volume 40-50%, keep short max-jump exposures.";
  const n = ((week - 1) % 4) + 1;
  if (n === 1) return "Build 1: conservative load, crisp reps, RPE 6-7.";
  if (n === 2) return "Build 2: add 2.5-5 lb or 1 set on main lift if knee is quiet.";
  if (n === 3) return "Build 3: highest week of block, RPE 7.5-8.5, no grinders.";
  return "Deload: reduce sets 35-50%, keep movement quality high.";
}

function cycleEmphasis(phaseId: PhaseId) {
  if (phaseId === "phase-1") return "General prep to intensification";
  if (phaseId === "phase-2") return "Specific strength, acceleration, dunk skill";
  if (phaseId === "phase-3") return "Strength rebuild with maintained jump exposure";
  return "Speed-strength, sprint, plyo, max-jump peak";
}

function prescriptions(week: number, day: number) {
  const phase = phaseForWeek(week);
  const wave = waveForWeek(week);
  const deload = wave.startsWith("Deload") || wave.startsWith("Test") || wave.startsWith("Taper");
  const s = deload ? "2-3" : "3-5";
  if (phase.id === "phase-1") {
    return [
      ["Lower A - Squat Base", "Pogo 2x20, snap-down 3x3, approach pop-ups 4x2 @70%", "Med-ball scoop toss 4x3; box jump 4x2", `Safety-bar or back squat ${s}x5-8 @RPE 6-8; reverse lunge 3x8/leg; hamstring curl 3x10`, "Heavy slow calf raise 3x8; tibialis raise 2x15; Copenhagen plank 2x20s", "Transcript general-prep volume plus progressive overload and tissue-capacity principles."],
      ["Jump Skill + Upper", "Dynamic court warm-up, ankle hops 2x15", "Adjustable hoop: 8-12 low-intensity approach jumps; tennis-ball makes on easy rim height", "Bench or DB press 3x6-10; row 4x8-12; pull-up or pulldown 3x6-10", "Spanish squat iso 3x30-45s; shoulder/elbow prehab 8-10 min", "Specificity with low cost, motor learning, and pain-monitoring model."],
      ["Lower B - Hinge + Single Leg", "A-skip 3x20m; marching wall drill 3x5/side", "Broad jump 5x2, stick landings", `Trap bar deadlift ${s}x3-5 @RPE 6-8; RDL 3x6-8; walking lunge 2-3x8/leg`, "Soleus raise 3x10; side plank 2x30s; hip airplane 2x5/side", "Transcript general-to-specific hinge work: force capacity before shock loading."],
      ["Strides + Recovery", "Mobility circuit 8 min; sprint drills", `${deload ? "4-6" : "6-8"} x 20m buildups @70-85%, walk-back rest`, "Upper back/arms optional 20-25 min, no leg fatigue", "Zone 2 walk 20-30 min or easy bike; knee range-of-motion flush", "Adds sprint runway carefully without turning it into conditioning."],
      ["Approach Jump Practice", "Court warm-up; low rim ball-handling takeoffs", `${deload ? "8-10" : "12-18"} total approach jumps; cap max-effort at ${deload ? "4" : "6"} attempts`, "Goblet squat 2x8 easy; RDL 2x8 easy only if fresh", "Calf iso 3x30s; quad/hip mobility", "Transcript jump-window idea adapted to low contacts because of meniscus history."],
    ][day - 1];
  }
  if (phase.id === "phase-2") {
    return [
      ["Heavy Lower + Acceleration", "Sprint drills; 4x10m buildups", `${deload ? "4-5" : "6-8"} x 10-20m accelerations @90-95%, full rest`, `Squat ${deload ? "2-3" : "4-6"}x2-4 @RPE 7-8; trap bar jump 4x3 @20-30% trap DL; split squat 2x6/leg`, "Calf raise 3x6 heavy; hamstring curl 3x6-8", "Transcript heavy strength to speed bridge; high-rate force; full recovery sprint principle."],
      ["BJJ-Compatible Upper + Tissue", "Shoulder/elbow prep; hip mobility", "Low pogo 2x20 if knee quiet", "Incline DB press 3x8; chest-supported row 4x8; carries 4x30m", "Spanish squat iso 3x45s; soleus 3x10; adductor plank 2x20s", "General day becomes easier as specific stress rises, per transcript."],
      ["Speed-Strength Lower", "A-skips, ankling, med-ball warm-up", "Med-ball overhead back throw 5x2; clean pull or high pull 5x3; box jump 5x2", `Fast squat ${deload ? "2" : "3-4"}x5 @50-65%; RDL 3x5; step-up 2x6/leg`, "Tibialis 2x15; trunk anti-rotation 3x8/side", "Transcript bar-speed month; Olympic derivatives optional for technical safety."],
      ["Recovery / BJJ Buffer", "Mobility and easy footwork", "Optional 4x10m relaxed starts only if legs feel springy", "Upper pull/push pump 20 min or rest", "Easy bike/walk 20-30 min; soft tissue calves/quads", "Fatigue-fitness model: keep adaptation without flattening jumps."],
      ["Dunk Skill + Adjustable Hoop", "Full court warm-up; ball pickup rhythm; 3-step and 5-step approaches", `${deload ? "10-14" : "16-24"} total jumps; tennis-ball dunks at makeable height; finish with ${deload ? "3" : "5"} max touches`, "No heavy lower lifting after this session", "Calf iso 2x45s; knee cooldown; record best hoop height", "Specificity principle; transcript max-effort jump time capped to protect the next lower session."],
    ][day - 1];
  }
  if (phase.id === "phase-3") {
    return [
      ["Lower A - Strength Rebuild", "Pogo 2x15; landing mechanics 3x3", "Box jump 4x2, low box", `Safety-bar/back squat ${s}x4-6 @RPE 6.5-8; reverse lunge 3x6-8/leg`, "Heavy slow calf 4x6-8; hamstring curl 3x8", "Second macrocycle general rebuild, progressive overload, arthritis load management."],
      ["Upper + Tissue", "Mobility, shoulders, elbows", "None unless very fresh: 2x15 pogos", "Press 3x6-10; row 4x8-12; pull-up 3 sets; carries", "Spanish squat iso 3x45s; soleus 3x10; hip mobility", "General work supports recovery while retaining tissue capacity."],
      ["Lower B - Hinge Strength", "Sprint drills; A-skip 3x20m", `${deload ? "4" : "4-6"} x 10-20m @80-90%, full rest`, `Trap bar deadlift ${s}x3-5; RDL 3x6; walking lunge 2x8/leg`, "Tibialis 2x15; Copenhagen 2x20s; trunk 8 min", "Maintains sprint qualities without peak-phase fatigue."],
      ["Recovery / BJJ Buffer", "Mobility circuit 10 min", "None", "Optional upper accessory pump only", "Walk 30-45 min; knee range-of-motion; easy calves", "Fatigue management and joint-capacity bias."],
      ["Maintenance Jump Session", "Court warm-up; low rim rhythm", `${deload ? "8-10" : "10-16"} approach jumps; 4-6 moderate tennis-ball attempts`, "Goblet squat 2x8 easy if no BJJ soreness", "Calf iso 2x45s; record touch only if fresh", "Skill retention with low contact volume."],
    ][day - 1];
  }
  return [
    ["Speed-Strength + Acceleration", "Sprint drills; 4x10m buildups", `${deload ? "4-5" : "6-8"} x 10-20m accelerations @90-97%, full rest`, `Trap bar jump 5x2-3; squat ${deload ? "2" : "3"}x2-3 @75-85%; split squat 2x5/leg`, "Calf raise 2x6; hamstring curl 2x6", "Transcript high-specificity phase; strength maintained while power is prioritized."],
    ["Upper + Tissue", "Shoulder/elbow prep; hip mobility", "Low pogos 2x15 only if springy", "Press 3x5-8; row 4x6-10; pull-up 3 sets; carries", "Spanish squat iso 3x45s; soleus 3x8; adductor work", "General work supports recovery as specific stress rises."],
    ["Plyo + Approach Speed", "A-skip, dribbles, ankle stiffness drills", `${deload ? "8-12" : "14-22"} contacts: bounds, hurdle hops, low drop jump only if knee quiet; 4 curved approaches`, `Fast squat 2-3x3 @50-60% or clean pull 4x2; RDL 2x5`, "Tibialis 2x12; trunk 6 min", "Transcript shock-loading month adapted to low contacts and strict pain rules."],
    ["Recovery / BJJ Buffer", "Mobility and easy court walk-through", "Optional 4 relaxed starts, no max jumps", "Upper accessory or full rest", "Walk/bike 20-30 min; calf/quad flush", "Load management before max jump day."],
    ["Max Jump / Dunk Progression", "Full warm-up; low rim makes; ball approach rhythm", `${deload ? "10-14" : "16-24"} total jumps; max touches/dunks after warm-up; cap misses at 8`, "No lower lift after; optional med-ball 3x2 if flat", "Cooldown calves/quads; log best touch, make height, pain", "Specificity and taper: high intent, low junk volume."],
  ][day - 1];
}

export function buildProgram(): ProgramSession[] {
  const sessions: ProgramSession[] = [];
  for (let week = 1; week <= 52; week++) {
    const phase = phaseForWeek(week);
    const weekStart = new Date(start.getTime() + (week - 1) * 7 * dayMs);
    for (let day = 1; day <= 5; day++) {
      const [session, prep, power, strength, accessory, rationale] = prescriptions(week, day);
      sessions.push({
        id: `w${week}-d${day}`,
        week,
        day,
        startDate: isoDate(weekStart),
        phaseId: phase.id,
        phaseName: phase.name,
        cycleEmphasis: cycleEmphasis(phase.id),
        wave: waveForWeek(week),
        session,
        prep,
        power,
        strength,
        accessory,
        rationale,
      });
    }
  }
  return sessions;
}

export function getDashboardMetrics(state: TrackerState, date = new Date()): DashboardMetrics {
  const currentWeek = getCurrentWeek(date);
  const bestMaxTouch = Math.max(0, ...state.testEntries.map((entry) => entry.maxTouch ?? 0)) || athleteProfile.estimatedCurrentTouch;
  const bestHoopHeight = Math.max(0, ...state.testEntries.map((entry) => entry.bestHoopHeight ?? 0)) || null;
  const since = new Date(date.getTime() - 7 * dayMs).toISOString().slice(0, 10);
  const lastSeven = state.readinessLogs.filter((log) => log.date >= since);
  const avg = (values: Array<number | null>) => {
    const nums = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : null;
  };
  return {
    currentWeek,
    currentPhase: phaseForWeek(currentWeek),
    bestMaxTouch,
    bestVertical: bestMaxTouch ? bestMaxTouch - athleteProfile.standingReach : null,
    inchesToRim: bestMaxTouch ? Math.max(0, athleteProfile.rimHeight - bestMaxTouch) : null,
    bestHoopHeight,
    sevenDayKneeAvg: avg(lastSeven.map((log) => log.kneeAmPain)),
    sevenDayRpeAvg: avg(lastSeven.map((log) => log.sessionRpe)),
  };
}
