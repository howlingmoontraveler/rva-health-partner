import { athleteProfile, buildProgram, getCurrentWeek, getDashboardMetrics, phases } from "@/lib/program";
import type { ProgramSession, SessionLog } from "@/lib/types";
import { createReadinessLog, createTestEntry, saveSessionLog } from "@/server/actions";
import { getTrackerState } from "@/server/store";

export const dynamic = "force-dynamic";

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "Not logged";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SessionCard({ session, log }: { session: ProgramSession; log?: SessionLog }) {
  return (
    <article className={log?.completed ? "session is-complete" : "session"}>
      <div className="session-head">
        <div>
          <p className="eyebrow">Day {session.day}</p>
          <h3>{session.session}</h3>
        </div>
        <span className="pill">{log?.completed ? "Logged" : "Planned"}</span>
      </div>
      <div className="session-grid">
        <div>
          <span>Prep</span>
          <p>{session.prep}</p>
        </div>
        <div>
          <span>Power / Sprint / Jump</span>
          <p>{session.power}</p>
        </div>
        <div>
          <span>Strength</span>
          <p>{session.strength}</p>
        </div>
        <div>
          <span>Accessory / Tissue</span>
          <p>{session.accessory}</p>
        </div>
      </div>
      <p className="rationale">{session.rationale}</p>
      <form action={saveSessionLog} className="log-form">
        <input type="hidden" name="sessionId" value={session.id} />
        <label className="check">
          <input type="checkbox" name="completed" defaultChecked={log?.completed ?? false} />
          Completed
        </label>
        <label>
          Actual load / touch
          <input name="actualLoadOrTouch" defaultValue={log?.actualLoadOrTouch ?? ""} placeholder="e.g. squat 185x5, touch 117" />
        </label>
        <label>
          RPE
          <input name="rpe" type="number" min="1" max="10" step="0.5" defaultValue={log?.rpe ?? ""} />
        </label>
        <label>
          Knee 24h
          <input name="knee24h" type="number" min="0" max="10" step="0.5" defaultValue={log?.knee24h ?? ""} />
        </label>
        <label className="wide">
          Notes
          <input name="notes" defaultValue={log?.notes ?? ""} placeholder="What moved well? Any stiffness?" />
        </label>
        <button>Save</button>
      </form>
    </article>
  );
}

function ReadinessForm() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={createReadinessLog} className="panel form-panel">
      <div>
        <p className="eyebrow">Daily Log</p>
        <h2>Readiness + Joint Response</h2>
      </div>
      <div className="form-grid">
        <label>
          Date
          <input name="date" type="date" defaultValue={today} required />
        </label>
        <label>
          Bodyweight
          <input name="bodyweight" type="number" step="0.1" placeholder="155" />
        </label>
        <label>
          Sleep 1-5
          <input name="sleepQuality" type="number" min="1" max="5" />
        </label>
        <label>
          Knee AM 0-10
          <input name="kneeAmPain" type="number" min="0" max="10" step="0.5" />
        </label>
        <label>
          Knee 24h 0-10
          <input name="knee24hPain" type="number" min="0" max="10" step="0.5" />
        </label>
        <label>
          Achilles 0-10
          <input name="achillesStiffness" type="number" min="0" max="10" step="0.5" />
        </label>
        <label>
          BJJ intensity
          <input name="bjjIntensity" type="number" min="0" max="10" step="0.5" />
        </label>
        <label>
          Session RPE
          <input name="sessionRpe" type="number" min="1" max="10" step="0.5" />
        </label>
        <label>
          Jump contacts
          <input name="jumpContacts" type="number" min="0" />
        </label>
        <label>
          Sprint reps
          <input name="sprintReps" type="number" min="0" />
        </label>
        <label className="wide">
          Notes
          <textarea name="notes" rows={3} placeholder="Morning stiffness, BJJ soreness, pop, surfaces, shoes..." />
        </label>
      </div>
      <button>Log Readiness</button>
    </form>
  );
}

function TestForm() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={createTestEntry} className="panel form-panel">
      <div>
        <p className="eyebrow">Checkpoint</p>
        <h2>Test Max Touch / Dunk Height</h2>
      </div>
      <div className="form-grid">
        <label>
          Date
          <input name="date" type="date" defaultValue={today} required />
        </label>
        <label>
          Standing reach
          <input name="standingReach" type="number" step="0.25" defaultValue={athleteProfile.standingReach} required />
        </label>
        <label>
          Max touch
          <input name="maxTouch" type="number" step="0.25" placeholder="e.g. 118" />
        </label>
        <label>
          Best hoop height
          <input name="bestHoopHeight" type="number" step="0.25" placeholder="e.g. 114" />
        </label>
        <label>
          Ball type
          <select name="ballType" defaultValue="Tennis ball">
            <option>Tennis ball</option>
            <option>Volleyball</option>
            <option>Basketball</option>
            <option>Touch only</option>
          </select>
        </label>
        <label>
          Makes
          <input name="makes" type="number" min="0" />
        </label>
        <label>
          Attempts
          <input name="attempts" type="number" min="0" />
        </label>
        <label>
          Knee 24h
          <input name="knee24h" type="number" min="0" max="10" step="0.5" />
        </label>
        <label className="wide">
          Notes
          <textarea name="notes" rows={3} placeholder="Court, hoop, shoes, approach, ball control..." />
        </label>
      </div>
      <button>Save Test</button>
    </form>
  );
}

export default async function HomePage() {
  const state = await getTrackerState();
  const program = buildProgram();
  const currentWeek = getCurrentWeek();
  const weekSessions = program.filter((session) => session.week === currentWeek);
  const metrics = getDashboardMetrics(state);
  const recentReadiness = state.readinessLogs.slice(0, 6);
  const recentTests = state.testEntries.slice(0, 6);

  return (
    <main>
      <section className="dashboard-band">
        <div className="page dashboard">
          <div className="intro">
            <p className="eyebrow">Misogi Vertical</p>
            <h1>{athleteProfile.target}</h1>
            <p>
              Week {metrics.currentWeek} of 52. Current block: <strong>{metrics.currentPhase.name}</strong>. The app is biased toward
              high-output jumps, short acceleration work, measurable testing, and knee-aware load management.
            </p>
          </div>
          <div className="stat-grid">
            <StatCard label="Best Touch" value={formatNumber(metrics.bestMaxTouch, '"')} detail="Logged max touch; baseline was 116 inches." />
            <StatCard label="Best Vertical" value={formatNumber(metrics.bestVertical, '"')} detail="Max touch minus 89 inch standing reach." />
            <StatCard label="To Rim" value={formatNumber(metrics.inchesToRim, '"')} detail="Rim is 120 inches; tennis-ball dunk needs control above this." />
            <StatCard label="Knee 7-Day Avg" value={formatNumber(metrics.sevenDayKneeAvg, "/10")} detail="Primary governor for sprint and jump volume." />
          </div>
        </div>
      </section>

      <section className="page current-week">
        <div className="section-head">
          <div>
            <p className="eyebrow">This Week</p>
            <h2>Week {currentWeek}: {metrics.currentPhase.name}</h2>
          </div>
          <p>{weekSessions[0]?.wave}</p>
        </div>
        <div className="sessions">
          {weekSessions.map((session) => (
            <SessionCard key={session.id} session={session} log={state.sessionLogs[session.id]} />
          ))}
        </div>
      </section>

      <section className="page two-col">
        <ReadinessForm />
        <TestForm />
      </section>

      <section className="page two-col">
        <div className="panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Testing History</p>
              <h2>Progress Checks</h2>
            </div>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <span>Date</span><span>Week</span><span>Touch</span><span>Vertical</span><span>Hoop</span><span>Knee</span>
            </div>
            {recentTests.map((entry) => (
              <div className="table-row" key={entry.id}>
                <span>{entry.date}</span>
                <span>{entry.week}</span>
                <span>{entry.maxTouch ? `${entry.maxTouch}"` : "-"}</span>
                <span>{entry.maxTouch ? `${entry.maxTouch - entry.standingReach}"` : "-"}</span>
                <span>{entry.bestHoopHeight ? `${entry.bestHoopHeight}"` : "-"}</span>
                <span>{entry.knee24h ?? "-"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Recent Readiness</p>
              <h2>Recovery Signals</h2>
            </div>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <span>Date</span><span>Knee AM</span><span>RPE</span><span>Jumps</span><span>Sprints</span><span>BJJ</span>
            </div>
            {recentReadiness.length ? recentReadiness.map((log) => (
              <div className="table-row" key={log.id}>
                <span>{log.date}</span>
                <span>{log.kneeAmPain ?? "-"}</span>
                <span>{log.sessionRpe ?? "-"}</span>
                <span>{log.jumpContacts ?? "-"}</span>
                <span>{log.sprintReps ?? "-"}</span>
                <span>{log.bjjIntensity ?? "-"}</span>
              </div>
            )) : <p className="empty">No readiness logs yet.</p>}
          </div>
        </div>
      </section>

      <section className="page">
        <div className="section-head">
          <div>
            <p className="eyebrow">12-Month Map</p>
            <h2>Periodized Phases</h2>
          </div>
        </div>
        <div className="phase-grid">
          {phases.map((phase) => (
            <article className={phase.id === metrics.currentPhase.id ? "phase active" : "phase"} key={phase.id}>
              <span>{phase.weeks}</span>
              <h3>{phase.name}</h3>
              <p>{phase.goal}</p>
              <dl>
                <dt>Transcript method</dt>
                <dd>{phase.transcriptMethod}</dd>
                <dt>Adapted for you</dt>
                <dd>{phase.athleteAdaptation}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
