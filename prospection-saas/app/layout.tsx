import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospection SaaS",
  description: "Extraction, vérification et conformité pour la prospection B2B.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
