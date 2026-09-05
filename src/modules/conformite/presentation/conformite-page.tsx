import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterSuppression, genererAuditExport } from "@/modules/conformite/presentation/conformite-actions";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ShieldCheckIcon } from "@/shared/ui/icons";

export default function ConformitePage() {
  const { conformite } = getContainer();
  const suppressions = conformite.suppressions.listByClient(CLIENT_ID_COURANT);
  const audits = conformite.auditExports.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Conformite"
        description="Registre de suppression unifie a travers toutes les campagnes et listes du client (cf. SPEC.md section 3.3)."
      />

      <Card>
        <CardTitle>Registre de suppression</CardTitle>
        <form action={ajouterSuppression} className="mt-3 flex gap-2">
          <Input name="email" type="email" placeholder="email@exemple.com" required />
          <SubmitButton className="shrink-0">Ajouter</SubmitButton>
        </form>
        <div className="mt-4">
          {suppressions.length === 0 ? (
            <EmptyState icon={<ShieldCheckIcon className="h-7 w-7" />} title="Aucune entree de suppression" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2">Email</th>
                  <th>Origine</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {suppressions.map((entree) => (
                  <tr key={entree.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{entree.email}</td>
                    <td className="text-slate-500">{entree.origine}</td>
                    <td className="text-slate-400">{entree.horodatage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardTitle>Export d&apos;audit par contact</CardTitle>
        <form action={genererAuditExport} className="mt-3 flex gap-2">
          <Input name="email" type="email" placeholder="email@exemple.com" required />
          <SubmitButton className="shrink-0" pendingText="Generation…">
            Generer
          </SubmitButton>
        </form>
        <div className="mt-4 space-y-3">
          {audits.length === 0 ? (
            <EmptyState title="Aucun export d'audit genere" />
          ) : (
            audits.map((audit) => (
              <div key={audit.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-slate-500">{audit.contactEmailHash.slice(0, 16)}…</p>
                  <Badge tone={audit.statutOpposition === "opposee" ? "danger" : "success"}>
                    {audit.statutOpposition}
                  </Badge>
                </div>
                <p className="mt-1.5 text-slate-500">
                  {audit.campagnes.length} evenement(s) de campagne
                  {audit.campagnes.length > 0 && ` — dernier le ${audit.campagnes[audit.campagnes.length - 1]?.horodatage}`}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
