import { notFound } from "next/navigation";
import { ReportView } from "@/components/assessment/ReportView";
import { getAssessment } from "@/server/db";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  return (
    <main className="page">
      <ReportView assessment={assessment} />
    </main>
  );
}
