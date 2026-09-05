import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Cold Email SaaS — MVP",
  description: "Envoi, verification et conformite pour campagnes de cold email B2B.",
};

const LIENS_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/mailboxes", label: "Mailboxes" },
  { href: "/domaines", label: "Domaines" },
  { href: "/sequences", label: "Sequences" },
  { href: "/listes", label: "Listes" },
  { href: "/campagnes", label: "Campagnes" },
  { href: "/conformite", label: "Conformite" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <nav className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
            <p className="mb-4 text-sm font-semibold text-slate-500">Cold Email SaaS</p>
            <ul className="space-y-1">
              {LIENS_NAV.map((lien) => (
                <li key={lien.href}>
                  <a href={lien.href} className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                    {lien.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
