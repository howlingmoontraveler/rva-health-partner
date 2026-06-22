import { AdminTable } from "@/components/admin/AdminTable";
import { listAssessments } from "@/server/db";

export default async function AdminPage() {
  const assessments = await listAssessments();

  return (
    <main className="page stack">
      <div className="stack">
        <p className="eyebrow">Admin</p>
        <h1>Assessment Dashboard</h1>
        <p className="lead">Review submitted intakes, filter by goal or risk status, and open generated reports for provider handoff.</p>
      </div>
      <AdminTable assessments={assessments} />
    </main>
  );
}
