"use client";

import { useMemo } from "react";
import { globalDisclaimer, group3Caution, limitedEvidenceDisclaimer } from "@/lib/data/disclaimers";
import { goalLabels } from "@/lib/data/options";
import type { AssessmentRecord, BloodworkConferenceResults, BloodworkSignalStatus, LabUploadSummary, TherapyBucketItem } from "@/lib/types/assessment";

const labCheckpoints: Record<string, string> = {
  CMP: "CMP - collect creatinine, eGFR, AST/ALT, bilirubin, electrolytes; provider review if eGFR <60 or liver enzymes are >2x the lab upper limit",
  "Comprehensive metabolic panel": "Comprehensive metabolic panel - collect creatinine, eGFR, AST/ALT, bilirubin, electrolytes; provider review if eGFR <60 or liver enzymes are >2x the lab upper limit",
  "Fasting glucose": "Fasting glucose - collect mg/dL; typical metabolic checkpoint is <100 mg/dL fasting, with provider review for elevated or low values",
  "Fasting insulin": "Fasting insulin - collect uIU/mL; commonly reviewed target range is about 2-10 uIU/mL fasting, interpreted with glucose/A1c and clinical context",
  HbA1c: "HbA1c - collect %; typical checkpoint is <5.7%, with provider review for 5.7-6.4% or >=6.5%",
  "Lipid panel": "Lipid panel - collect TC, LDL-C, HDL-C, TG; common checkpoints include TG <150 mg/dL and HDL >40 men or >50 women",
  ApoB: "ApoB - collect mg/dL; cardiometabolic risk target often reviewed at <90 mg/dL, or <80/<65 for higher-risk clients per provider direction",
  CBC: "CBC - collect WBC, hemoglobin, hematocrit, platelets; abnormal high/low values need provider review before therapy decisions",
  "CBC with differential": "CBC with differential - collect WBC differential, hemoglobin, hematocrit, platelets; abnormal high/low values need provider review before therapy decisions",
  "Kidney function/eGFR": "Kidney function/eGFR - collect eGFR mL/min/1.73m2 and creatinine; provider review if eGFR <60 or trending down",
  "Liver enzymes": "Liver enzymes - collect AST, ALT, alkaline phosphatase, bilirubin; provider review for elevations or symptoms",
  "Pregnancy status when relevant": "Pregnancy status when relevant - document negative test or provider-cleared status before prescription/injectable discussions",
  "Gallbladder history": "Gallbladder history - document prior stones, surgery, right-upper-quadrant pain, nausea/vomiting, or provider evaluation",
  "Gallbladder history/symptoms": "Gallbladder history/symptoms - document prior stones, surgery, right-upper-quadrant pain, nausea/vomiting, or provider evaluation",
  "Diabetes medication review": "Diabetes medication review - document insulin/sulfonylurea use and hypoglycemia history; provider review required",
  "Blood pressure": "Blood pressure - collect seated BP; common checkpoint is <120/80, with provider review for persistent >=130/80 or symptomatic lows",
  Weight: "Weight - collect baseline and weekly trend; avoid evaluating a single reading in isolation",
  "Waist circumference": "Waist circumference - collect at navel in inches or cm; repeat every 4 weeks using the same method",
  "Body composition": "Body composition - collect lean mass, fat mass, and body-fat % if available; repeat at 8-12 weeks",
  "Body composition scan if available": "Body composition scan if available - collect lean mass, fat mass, and body-fat %; repeat at 8-12 weeks",
  "hs-CRP": "hs-CRP - collect mg/L; commonly reviewed checkpoint is <1.0 mg/L, with 1-3 moderate and >3 higher inflammatory signal",
  TSH: "TSH - collect uIU/mL; many labs reference about 0.4-4.5, interpreted with Free T4, symptoms, and medication status",
  "Free T4": "Free T4 - collect ng/dL; interpret with TSH, symptoms, and thyroid medication status",
  "Vitamin D": "Vitamin D - collect 25(OH)D ng/mL; common checkpoint is at least 30 ng/mL, with provider-directed targets",
  B12: "B12 - collect pg/mL; provider review if low, borderline, or symptoms suggest deficiency",
  Folate: "Folate - collect ng/mL; provider review if low or if anemia/neurologic symptoms are present",
  Ferritin: "Ferritin - collect ng/mL; interpret with CBC, inflammation, sex, symptoms, and provider context"
};

function checkpointLabel(item: string) {
  return labCheckpoints[item] ?? item;
}

function signalLabel(status: BloodworkSignalStatus) {
  return status.replace("-", " ");
}

function signalClass(status: BloodworkSignalStatus) {
  if (status === "optimal") return "status-badge good";
  if (status === "watch" || status === "low") return "status-badge watch";
  if (status === "concern" || status === "high-risk") return "status-badge warn";
  return "status-badge";
}

function standardClass(status: string) {
  if (status === "within") return "status-badge good";
  if (status === "critical") return "status-badge warn";
  if (status === "above" || status === "below") return "status-badge watch";
  return "status-badge";
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function buildUploadText(upload?: LabUploadSummary | null) {
  if (!upload) return "Uploaded report: none.";
  return [
    `Uploaded report: ${upload.fileName} (${formatBytes(upload.fileSize)}, ${upload.extractionMethod})`,
    upload.extractedValues.length
      ? `Auto-detected values: ${upload.extractedValues.map((value) => `${value.label} ${value.value} ${value.unit}`).join("; ")}`
      : "Auto-detected values: none.",
    upload.warnings.length ? `Upload warnings: ${upload.warnings.join("; ")}` : "Upload warnings: none."
  ].join("\n");
}

function buildConferenceText(conference?: BloodworkConferenceResults, upload?: LabUploadSummary | null) {
  if (!conference) return "";
  return [
    "Functional Blood-Work Agent Conference",
    buildUploadText(upload),
    `Moderator: ${conference.moderatorSummary}`,
    `Values entered: ${conference.valuesEntered}`,
    conference.functionalPatterns.length ? `Functional patterns: ${conference.functionalPatterns.join("; ")}` : "Functional patterns: no dominant pattern.",
    conference.safetyEscalations.length ? `Safety escalations: ${conference.safetyEscalations.join("; ")}` : "Safety escalations: none from entered values.",
    "",
    "Consensus:",
    conference.consensus.map((item) => `${item.theme}: ${item.agreement} Follow-up: ${item.followUp}`).join("\n"),
    "",
    "Agent checks:",
    conference.agentFindings.map((finding) => `${finding.agentName} (${finding.confidenceLabel}): ${finding.summary}`).join("\n"),
    "",
    "Disagreements:",
    conference.disagreements.map((item) => `${item.theme}: ${item.resolution}`).join("\n") || "No material agent disagreements."
  ].join("\n");
}

function BucketCard({ item }: { item: TherapyBucketItem }) {
  const isGroup3 = item.regulatoryGroup.includes("limited-evidence");
  return (
    <article className="panel stack">
      <div className="stack">
        <span className="tag">{item.therapyName}</span>
        <h3>{item.evidenceDescription}</h3>
        <p className="muted">{item.regulatoryStatus}</p>
      </div>
      {isGroup3 ? <div className="notice warn">{group3Caution}</div> : null}
      <div>
        <strong>Why it appeared</strong>
        <ul className="list">{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      </div>
      {item.cautions.length ? (
        <div>
          <strong>Cautions</strong>
          <ul className="list">{item.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
        </div>
      ) : null}
      <div>
        <strong>Required labs/checkpoints</strong>
        <ul className="list">{item.labs.slice(0, 8).map((lab) => <li key={lab}>{checkpointLabel(lab)}</li>)}</ul>
      </div>
      <div>
        <strong>Outcome markers</strong>
        <ul className="list">{item.metrics.slice(0, 8).map((metric) => <li key={metric}>{metric}</li>)}</ul>
      </div>
    </article>
  );
}

function UploadSummaryView({ upload }: { upload?: LabUploadSummary | null }) {
  if (!upload) return null;

  return (
    <div className={upload.warnings.length ? "notice warn" : "notice"}>
      <strong>Uploaded lab report</strong>
      <p>{upload.fileName} · {formatBytes(upload.fileSize)} · {upload.extractionMethod}</p>
      {upload.extractedValues.length ? (
        <div className="tag-row">
          {upload.extractedValues.map((value) => (
            <span className="tag" key={value.key}>{value.label}: {value.value} {value.unit}</span>
          ))}
        </div>
      ) : null}
      {upload.warnings.length ? <ul className="list">{upload.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
    </div>
  );
}

function BloodworkConferenceView({ conference, upload }: { conference?: BloodworkConferenceResults; upload?: LabUploadSummary | null }) {
  if (!conference) return null;

  return (
    <section className="section stack">
      <div className="stack">
        <p className="eyebrow">Agent conference</p>
        <h2>Functional Blood-Work Review</h2>
        <div className={conference.safetyEscalations.length ? "notice warn" : "notice"}>{conference.moderatorSummary}</div>
      </div>

      <UploadSummaryView upload={upload} />

      <div className="grid">
        <div className="panel stack">
          <span className="tag">Conference seed</span>
          <h3>{conference.valuesEntered} values entered</h3>
          <p className="muted small">Reproducible stochastic run: {conference.seed}</p>
        </div>
        <div className="panel stack">
          <span className="tag">Evidence mix</span>
          <ul className="list">
            {Object.entries(conference.evidenceBalance).map(([tier, count]) => <li key={tier}>{tier}: {count}</li>)}
          </ul>
        </div>
      </div>

      {conference.safetyEscalations.length ? (
        <div className="notice warn">
          <strong>Provider-review checkpoints</strong>
          <ul className="list">{conference.safetyEscalations.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}

      <div className="grid">
        <div className="panel stack">
          <h3>Consensus</h3>
          <ul className="list">
            {conference.consensus.map((item) => (
              <li key={item.theme}>
                <strong>{item.theme}</strong>: {item.agreement} <span className={signalClass(item.strength === "high" ? "optimal" : item.strength === "moderate" ? "watch" : "missing")}>{item.strength}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel stack">
          <h3>Missing Data</h3>
          <ul className="list">
            {conference.missingData.length ? conference.missingData.map((item) => <li key={item}>{item}</li>) : <li>No major data gaps from entered values.</li>}
          </ul>
        </div>
      </div>

      {conference.functionalPatterns.length ? (
        <div className="panel stack">
          <h3>Functional Patterns</h3>
          <div className="tag-row">{conference.functionalPatterns.map((pattern) => <span className="tag" key={pattern}>{pattern}</span>)}</div>
        </div>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Marker</th>
              <th>Value</th>
              <th>Conventional</th>
              <th>Functional</th>
              <th>Conference note</th>
            </tr>
          </thead>
          <tbody>
            {conference.biomarkerInterpretations.length ? conference.biomarkerInterpretations.map((item) => (
              <tr key={item.key}>
                <td><strong>{item.label}</strong></td>
                <td>{item.value} {item.unit}</td>
                <td>
                  <span className={standardClass(item.standardStatus)}>{item.standardStatus}</span>
                  <p className="muted small">{item.standardRange}</p>
                </td>
                <td>
                  <span className={signalClass(item.functionalStatus)}>{signalLabel(item.functionalStatus)}</span>
                  <p className="muted small">{item.functionalRange}</p>
                </td>
                <td>
                  {item.summary}
                  <p className="muted small">{item.evidenceTiers.join(" / ")}</p>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5}>No numeric blood-work values were entered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="agent-grid">
        {conference.agentFindings.map((finding) => (
          <article className="panel stack" key={finding.agentId}>
            <div className="stack">
              <span className="tag">{finding.confidenceLabel} confidence</span>
              <h3>{finding.agentName}</h3>
              <p className="muted small">{finding.lens}</p>
              <p>{finding.summary}</p>
            </div>
            <div>
              <strong>Signals</strong>
              <ul className="list">{finding.supportingSignals.length ? finding.supportingSignals.map((item) => <li key={item}>{item}</li>) : <li>No strong signal from entered values.</li>}</ul>
            </div>
            <div>
              <strong>Cross-checks</strong>
              <ul className="list">{finding.counterChecks.length ? finding.counterChecks.map((item) => <li key={item}>{item}</li>) : <li>No major cross-check added.</li>}</ul>
            </div>
            {finding.concerns.length ? (
              <div>
                <strong>Concerns</strong>
                <ul className="list">{finding.concerns.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {conference.disagreements.length ? (
        <div className="panel stack">
          <h3>Agent Disagreements</h3>
          {conference.disagreements.map((item) => (
            <div key={item.theme}>
              <strong>{item.theme}</strong>
              <ul className="list">{item.positions.map((position) => <li key={position}>{position}</li>)}</ul>
              <p className="muted">{item.resolution}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BucketSection({ title, items, empty }: { title: string; items: TherapyBucketItem[]; empty: string }) {
  return (
    <section className="section stack">
      <h2>{title}</h2>
      {items.length ? <div className="bucket">{items.map((item) => <BucketCard item={item} key={item.therapyId} />)}</div> : <p className="muted">{empty}</p>}
    </section>
  );
}

export function ReportView({ assessment }: { assessment: AssessmentRecord }) {
  const reportText = useMemo(() => {
    const results = assessment.results;
    const conferenceText = buildConferenceText(results.bloodworkConference, assessment.labs.uploadedReport);
    const lines = [
      "Therapy Fit Assessment Report",
      "",
      `Client: ${assessment.user.firstName}`,
      `Primary goal: ${goalLabels[assessment.goals.primary]}`,
      `Secondary goals: ${assessment.goals.secondary.map((goal) => goalLabels[goal]).join(", ") || "None selected"}`,
      `Provider review required: ${results.requiresProviderClearance ? "Yes" : "Provider review is still required before therapy decisions"}`,
      "",
      "Key risks:",
      results.keyRisks.join("\n") || "No red flags selected.",
      "",
      "Medication review:",
      results.medicationConflicts.join("\n") || "No listed medication categories selected.",
      "",
      "Potential provider discussion categories:",
      results.therapyBuckets.providerDiscussion.map((item) => `${item.therapyName}: ${item.reasons.join("; ")}`).join("\n") || "None based on current answers.",
      "",
      "Adjunct-only categories:",
      results.therapyBuckets.adjunctOnly.map((item) => `${item.therapyName}: ${item.reasons.join("; ")}`).join("\n") || "None based on current answers.",
      "",
      "Poor fit or caution categories:",
      results.therapyBuckets.poorFitOrCaution.map((item) => `${item.therapyName}: ${[...item.reasons, ...item.cautions].join("; ")}`).join("\n") || "None based on current answers.",
      "",
      "Labs to review:",
      results.labRecommendations.essential.map(checkpointLabel).join("\n"),
      "",
      conferenceText,
      "",
      "Provider handoff:",
      results.providerHandoff,
      "",
      globalDisclaimer
    ];
    return lines.join("\n");
  }, [assessment]);

  return (
    <div className="report-grid">
      <div>
        <section className="section stack" style={{ borderTop: 0, paddingTop: 0 }}>
          <p className="eyebrow">Report</p>
          <h1>Your Therapy Fit Assessment</h1>
          <p className="lead">
            Based on your answers, this report organizes provider discussion categories, poor-fit categories, lab gaps, and
            monitoring checkpoints. It does not prescribe or recommend a therapy.
          </p>
          {assessment.results.severeProviderGate ? (
            <div className="notice warn">Licensed medical review required before therapy matching.</div>
          ) : null}
          <div className="notice">{globalDisclaimer}</div>
        </section>

        <section className="section grid">
          <div className="panel stack">
            <span className="tag">Primary goal</span>
            <h3>{goalLabels[assessment.goals.primary]}</h3>
            <p className="muted">Secondary: {assessment.goals.secondary.map((goal) => goalLabels[goal]).join(", ") || "None selected"}</p>
          </div>
          <div className="panel stack">
            <span className="tag">Provider checkpoint</span>
            <h3>{assessment.results.requiresProviderClearance ? "Review required before considering therapy" : "Provider review still required before decisions"}</h3>
            <p className="muted">{assessment.results.nextStep}</p>
          </div>
        </section>

        <BloodworkConferenceView conference={assessment.results.bloodworkConference} upload={assessment.labs.uploadedReport} />

        <BucketSection
          title="May Be Worth Provider Discussion"
          items={assessment.results.therapyBuckets.providerDiscussion}
          empty="No therapy category was placed in this bucket based on current answers."
        />
        <BucketSection
          title="Possible Adjunct, Not Primary Solution"
          items={assessment.results.therapyBuckets.adjunctOnly}
          empty="No adjunct categories appeared based on current answers."
        />
        <BucketSection
          title="Poor Fit Or Caution"
          items={assessment.results.therapyBuckets.poorFitOrCaution}
          empty="No caution categories appeared based on current answers."
        />
        <BucketSection
          title="Labs Or Review Needed First"
          items={assessment.results.therapyBuckets.labsNeededFirst}
          empty="No categories were held for labs-first review."
        />

        <section className="section stack">
          <h2>Baseline Lab Checklist</h2>
          <div className="grid">
            <div className="panel">
              <h3>Essential</h3>
              <ul className="list">{assessment.results.labRecommendations.essential.map((item) => <li key={item}>{checkpointLabel(item)}</li>)}</ul>
            </div>
            <div className="panel">
              <h3>Useful optional</h3>
              <ul className="list">{assessment.results.labRecommendations.optional.map((item) => <li key={item}>{checkpointLabel(item)}</li>)}</ul>
            </div>
            <div className="panel">
              <h3>Safety and outcome markers</h3>
              <ul className="list">{assessment.results.labRecommendations.clinicalMetrics.map((item) => <li key={item}>{checkpointLabel(item)}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="section grid">
          <div className="panel stack">
            <h2>Monitoring Timeline</h2>
            <ul className="list">{assessment.results.monitoringPlan.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="panel stack">
            <h2>Coaching Priorities</h2>
            <ul className="list">{assessment.results.coachingPriorities.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="section stack">
          <h2>Provider Handoff Summary</h2>
          <textarea className="copybox" readOnly value={assessment.results.providerHandoff} />
          <div className="notice warn">{limitedEvidenceDisclaimer}</div>
        </section>
      </div>

      <aside className="panel stack">
        <span className="tag">Copyable report</span>
        <textarea className="copybox" readOnly value={reportText} />
        <button className="button" type="button" onClick={() => navigator.clipboard.writeText(reportText)}>
          Copy Report
        </button>
        <button className="button secondary" type="button" onClick={() => window.print()}>
          Export / Print PDF
        </button>
      </aside>
    </div>
  );
}
