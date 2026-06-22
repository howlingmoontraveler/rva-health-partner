import Link from "next/link";
import { globalDisclaimer } from "@/lib/data/disclaimers";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="stack">
          <p className="eyebrow">Clinical Optimization Intake</p>
          <h1>Therapy Fit Assessment</h1>
          <p className="lead">
            A structured decision-support tool for adults considering peptide or peptide-adjacent therapies. It organizes goals,
            risk factors, medications, lab gaps, and provider handoff notes without prescribing or giving dosing advice.
          </p>
          <div className="notice">{globalDisclaimer}</div>
          <div>
            <Link className="button" href="/assessment/start">
              Start Assessment
            </Link>
          </div>
        </div>
        <div className="panel stack">
          <span className="tag">Provider-collaborative</span>
          <h2>Built to slow down random peptide interest.</h2>
          <p className="muted">
            The report separates FDA-approved prescription categories from wellness adjuncts and limited-evidence provider-only
            discussions, then turns interest into lab checkpoints and measurable outcomes.
          </p>
        </div>
      </section>
    </main>
  );
}
