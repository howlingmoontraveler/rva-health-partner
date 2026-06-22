"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { goalLabels, goalOptions } from "@/lib/data/options";
import type { AssessmentRecord } from "@/lib/types/assessment";

export function AdminTable({ assessments }: { assessments: AssessmentRecord[] }) {
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("");
  const [redFlag, setRedFlag] = useState("");
  const [therapy, setTherapy] = useState("");

  const filtered = useMemo(() => {
    return assessments.filter((assessment) => {
      const text = `${assessment.user.firstName} ${assessment.user.email}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesGoal = !goal || assessment.goals.primary === goal;
      const hasRedFlag = assessment.results.keyRisks.length > 0;
      const matchesRedFlag = !redFlag || (redFlag === "yes" ? hasRedFlag : !hasRedFlag);
      const therapyNames = Object.values(assessment.results.therapyBuckets).flat().map((item) => item.therapyName.toLowerCase());
      const matchesTherapy = !therapy || therapyNames.some((name) => name.includes(therapy.toLowerCase()));
      return matchesQuery && matchesGoal && matchesRedFlag && matchesTherapy;
    });
  }, [assessments, goal, query, redFlag, therapy]);

  return (
    <div className="stack">
      <div className="grid">
        <div className="field">
          <label htmlFor="query">Search name/email</label>
          <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="goal">Primary goal</label>
          <select id="goal" value={goal} onChange={(event) => setGoal(event.target.value)}>
            <option value="">All goals</option>
            {goalOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="redFlag">Red flag status</label>
          <select id="redFlag" value={redFlag} onChange={(event) => setRedFlag(event.target.value)}>
            <option value="">All</option>
            <option value="yes">Red flag present</option>
            <option value="no">No red flag selected</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="therapy">Therapy category</label>
          <input id="therapy" placeholder="Semaglutide, NAD+, BPC..." value={therapy} onChange={(event) => setTherapy(event.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Goal</th>
              <th>Status</th>
              <th>Red flags</th>
              <th>Provider discussion</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((assessment) => (
              <tr key={assessment.id}>
                <td>
                  <Link href={`/admin/assessments/${assessment.id}`}>
                    <strong>{assessment.user.firstName}</strong>
                    <br />
                    <span className="muted small">{assessment.user.email}</span>
                  </Link>
                </td>
                <td>{goalLabels[assessment.goals.primary]}</td>
                <td><span className="tag">{assessment.status}</span></td>
                <td>{assessment.results.keyRisks.length ? assessment.results.keyRisks.length : "None selected"}</td>
                <td>{assessment.results.therapyBuckets.providerDiscussion.map((item) => item.therapyName).join(", ") || "None"}</td>
                <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
