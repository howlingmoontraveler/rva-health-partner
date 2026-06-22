import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Therapy Fit Assessment",
  description: "Clinical peptide decision-support intake and provider discussion planner"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              RVA <span>Health Partner</span>
            </Link>
            <nav className="nav" aria-label="Primary">
              <Link href="/assessment/start">Assessment</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
