import { globalDisclaimer } from "@/lib/data/disclaimers";

export default function TermsPage() {
  return (
    <main className="page stack">
      <p className="eyebrow">Terms</p>
      <h1>Terms and Medical Disclaimer Placeholder</h1>
      <div className="panel stack">
        <p>{globalDisclaimer}</p>
        <p className="muted">
          This tool must not be used for emergency medical needs, diagnosis, prescription, dosing, sourcing, compounding, or
          treatment decisions. A licensed medical provider must make final decisions about medications, peptides, labs,
          contraindications, and monitoring.
        </p>
      </div>
    </main>
  );
}
