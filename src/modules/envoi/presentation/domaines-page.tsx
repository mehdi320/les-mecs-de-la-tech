import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterDomaine, reverifierDomaine } from "@/modules/envoi/presentation/domaine-actions";
import { PageHeader } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { GlobeIcon } from "@/shared/ui/icons";

export default function DomainesPage() {
  const { envoi } = getContainer();
  const domaines = envoi.domaines.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Domaines"
        description={'Verification SPF/DMARC par requete DNS reelle. DKIM reste "inconnu" (necessite le selecteur du client, non collecte pour l\'instant).'}
      />

      <Card>
        <form action={ajouterDomaine} className="flex gap-2">
          <Input name="nomDomaine" placeholder="exemple.com" required />
          <SubmitButton pendingText="Verification…" className="shrink-0">
            Ajouter et verifier
          </SubmitButton>
        </form>
      </Card>

      <div className="mt-6">
        {domaines.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon className="h-8 w-8" />}
            title="Aucun domaine ajoute"
            description="Ajoutez le domaine d'envoi de vos mailboxes pour verifier sa configuration SPF/DMARC."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-2">Domaine</th>
                <th>SPF</th>
                <th>DKIM</th>
                <th>DMARC</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {domaines.map((domaine) => (
                <tr key={domaine.id} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium text-slate-900">{domaine.nomDomaine}</td>
                  <td>
                    <Badge>{domaine.spfStatut}</Badge>
                  </td>
                  <td>
                    <Badge>{domaine.dkimStatut}</Badge>
                  </td>
                  <td>
                    <Badge>{domaine.dmarcStatut}</Badge>
                  </td>
                  <td className="text-right">
                    <form action={reverifierDomaine}>
                      <input type="hidden" name="domaineId" value={domaine.id} />
                      <input type="hidden" name="nomDomaine" value={domaine.nomDomaine} />
                      <Button type="submit" variant="ghost" size="sm">
                        revalider
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
