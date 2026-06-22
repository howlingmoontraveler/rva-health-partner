export default function PrivacyPage() {
  return (
    <main className="page stack">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy Policy Placeholder</h1>
      <div className="panel stack">
        <p>
          This MVP collects health-adjacent intake information for education and care coordination. Production use should add a
          reviewed privacy policy, secure database storage, authenticated admin access, data deletion workflows, and vendor review.
        </p>
        <p className="muted">
          Do not send detailed medical answers to third-party analytics tools. If this will be used in a covered-entity or
          HIPAA-regulated workflow, use HIPAA-appropriate vendors and legal/compliance review before claiming compliance.
        </p>
      </div>
    </main>
  );
}
