import { AssessmentForm } from "@/components/assessment/AssessmentForm";

export default function StartAssessmentPage() {
  return (
    <main className="page stack">
      <div className="stack">
        <p className="eyebrow">Assessment</p>
        <h1>Clinical Optimization Intake</h1>
        <p className="lead">
          Complete the form once. The output will classify therapy categories into provider discussion, adjunct-only, caution,
          and labs-needed-first buckets.
        </p>
      </div>
      <AssessmentForm />
    </main>
  );
}
