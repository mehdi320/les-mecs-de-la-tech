import type { Metadata } from "next";
import "@/app/globals.css";
import { Nav } from "@/shared/presentation/nav";
import { Badge } from "@/shared/ui/badge";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";

export const metadata: Metadata = {
  title: "Cold Email SaaS — MVP",
  description: "Envoi, verification et conformite pour campagnes de cold email B2B.",
};

// Le layout lit le client courant en base pour l'affichage du panneau
// lateral : sans ce flag, Next tente de prerendre statiquement des
// routes comme /_not-found au moment du build, avant meme que la
// migration de la base ait pu tourner sur l'environnement cible.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { clients } = getContainer();
  const client = clients.findById(CLIENT_ID_COURANT);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center gap-2 px-4 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                CE
              </div>
              <span className="text-sm font-semibold text-slate-900">Cold Email SaaS</span>
            </div>
            <nav className="flex-1 px-3">
              <Nav />
            </nav>
            {client && (
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="truncate text-xs font-medium text-slate-700">{client.nom}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge tone="neutral">{client.planId}</Badge>
                  <Badge tone={client.dpaSignedAt ? "success" : "danger"}>
                    {client.dpaSignedAt ? "DPA signe" : "DPA non signe"}
                  </Badge>
                </div>
              </div>
            )}
          </aside>
          <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
