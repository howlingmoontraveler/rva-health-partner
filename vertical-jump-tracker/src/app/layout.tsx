import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Misogi Vertical",
  description: "A personal vertical jump and dunk training tracker",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
