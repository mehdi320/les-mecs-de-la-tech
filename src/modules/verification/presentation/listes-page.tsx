import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { importerListe, lancerVerification, supprimerListe } from "@/modules/verification/presentation/liste-actions";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardTitle } from "@/shared/ui/card";
import { Field, Input, Textarea } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { RiskScore } from "@/shared/ui/risk-score";
import { EmptyState } from "@/shared/ui/empty-state";
import { ListImportIcon } from "@/shared/ui/icons";
import { DeleteButton } from "@/shared/ui/delete-button";

export default function ListesPage() {
  const { verification } = getContainer();
  const listes = verification.listesImportees.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Listes importees"
        description="Dedoublonnage intra-liste et exclusion des contacts deja dans le registre de suppression au moment de l'import (cf. SPEC.md section 4)."
      />

      <Card>
        <form action={importerListe} className="space-y-3">
          <div className="flex gap-3">
            <Field label="Nom de la liste" className="flex-1">
              <Input name="nom" required />
            </Field>
            <Field label="Source declaree (optionnel)" className="flex-1">
              <Input name="sourceDeclaree" placeholder="ex: export CRM interne" />
            </Field>
          </div>
          <Field label="Contacts" hint="Une adresse par ligne — prenom@exemple.com, Prenom, Entreprise (colonnes libres apres l'email)">
            <Textarea
              name="contacts"
              placeholder={"prenom@exemple.com\nautre@exemple.com, Prenom, Entreprise"}
              required
              rows={6}
              className="font-mono"
            />
          </Field>
          <SubmitButton pendingText="Import en cours…">Importer</SubmitButton>
        </form>
      </Card>

      <div className="mt-6 space-y-6">
        {listes.length === 0 && (
          <EmptyState
            icon={<ListImportIcon className="h-8 w-8" />}
            title="Aucune liste importee"
            description="Importez votre premiere liste de contacts ci-dessus."
          />
        )}

        {listes.map((liste) => {
          const contacts = verification.contacts.listByListe(liste.id);
          return (
            <Card key={liste.id}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{liste.nom}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {liste.nbContacts} contacts <Badge>{liste.statutVerification}</Badge>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {liste.statutVerification !== "terminee" && (
                    <form action={lancerVerification}>
                      <input type="hidden" name="listeId" value={liste.id} />
                      <SubmitButton size="sm" pendingText="Verification…">
                        Lancer la verification
                      </SubmitButton>
                    </form>
                  )}
                  <DeleteButton
                    action={supprimerListe}
                    fields={{ listeId: liste.id }}
                    confirmMessage={`Supprimer la liste "${liste.nom}" et ses ${liste.nbContacts} contacts ? Les enrollments de campagne bases sur ces contacts seront aussi supprimes.`}
                  />
                </div>
              </div>

              {liste.statutVerification === "terminee" && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <th className="py-2">Email</th>
                      <th>Score de risque</th>
                      <th>Explication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => {
                      const resultat = verification.verificationResultats.findByContact(contact.id);
                      return (
                        <tr key={contact.id} className="border-b border-slate-100 align-top">
                          <td className="py-2.5 font-medium text-slate-900">{contact.email}</td>
                          <td>{resultat ? <RiskScore score={resultat.scoreRisque} /> : "—"}</td>
                          <td className="text-xs text-slate-500">
                            {resultat && resultat.scoreExplication.length > 0
                              ? resultat.scoreExplication.map((f) => f.detail).join(" / ")
                              : "Aucun facteur de risque detecte."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
