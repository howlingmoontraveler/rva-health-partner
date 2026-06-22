import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/assessment/ReportView";
import { setAssessmentStatus } from "@/server/actions";
import { getAssessment } from "@/server/db";
import type { AssessmentStatus } from "@/lib/types/assessment";

const statuses: AssessmentStatus[] = ["New", "Needs labs", "Needs provider review", "Consult booked", "Not eligible", "Closed"];

export default async function AdminAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  return (
    <main className="page stack">
      <Link className="button secondary" href="/admin">Back to Admin</Link>
      <section className="panel stack">
        <p className="eyebrow">Admin review</p>
        <h1>{assessment.user.firstName}</h1>
        <p className="muted">{assessment.user.email} · {assessment.user.ageRange} · Created {new Date(assessment.createdAt).toLocaleString()}</p>
        <form action={setAssessmentStatus} className="grid">
          <input type="hidden" name="id" value={assessment.id} />
          <div className="field">
            <label htmlFor="status">Assessment status</label>
            <select id="status" name="status" defaultValue={assessment.status}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div className="field" style={{ alignSelf: "end" }}>
            <button className="button" type="submit">Update Status</button>
          </div>
        </form>
      </section>
      <ReportView assessment={assessment} />
    </main>
  );
}
