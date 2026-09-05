import Link from "next/link";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { creerCampagne, traiterCampagne } from "@/modules/envoi/presentation/campagne-actions";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardTitle } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { CampaignIcon } from "@/shared/ui/icons";

export default function CampagnesPage() {
  const { envoi, verification } = getContainer();
  const campagnes = envoi.campagnes.listByClient(CLIENT_ID_COURANT);
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);
  const listes = verification.listesImportees.listByClient(CLIENT_ID_COURANT);
  const mailboxes = envoi.mailboxes.listByClient(CLIENT_ID_COURANT);

  const prerequisManquants = [
    mailboxes.length === 0 && { label: "aucune mailbox connectee", href: "/mailboxes" },
    sequences.length === 0 && { label: "aucune sequence creee", href: "/sequences" },
    listes.length === 0 && { label: "aucune liste importee", href: "/listes" },
  ].filter((p): p is { label: string; href: string } => Boolean(p));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Campagnes" description="Association sequence + liste + mailbox, et suivi des envois." />

      {prerequisManquants.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">Prerequis manquants avant de creer une campagne :</p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-amber-700">
            {prerequisManquants.map((p) => (
              <li key={p.href}>
                {p.label} —{" "}
                <Link href={p.href} className="font-medium underline">
                  y aller
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <form action={creerCampagne} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sequence">
                <Select name="sequenceId" required>
                  <option value="">Choisir…</option>
                  {sequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Liste">
                <Select name="listeId" required>
                  <option value="">Choisir…</option>
                  {listes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nom} ({l.nbContacts})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mailbox">
                <Select name="mailboxId" required>
                  <option value="">Choisir…</option>
                  {mailboxes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.email}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Seuil score risque max" hint="Optionnel — exclut les contacts au-dela de ce score">
                <Input name="seuilScoreRisqueMin" type="number" placeholder="ex: 50" />
              </Field>
            </div>
            <SubmitButton pendingText="Creation…">Creer la campagne</SubmitButton>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        {campagnes.length === 0 && prerequisManquants.length === 0 && (
          <EmptyState icon={<CampaignIcon className="h-8 w-8" />} title="Aucune campagne creee" />
        )}

        {campagnes.map((campagne) => {
          const enrollments = envoi.enrollments.listByCampagne(campagne.id);
          const sequence = sequences.find((s) => s.id === campagne.sequenceId);
          const enAttente = enrollments.filter((e) => e.statut === "en_attente").length;
          return (
            <Card key={campagne.id}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{sequence?.nom ?? campagne.sequenceId}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {enrollments.length} enrollments <Badge>{campagne.statut}</Badge>
                  </p>
                </div>
                <form action={traiterCampagne}>
                  <input type="hidden" name="campagneId" value={campagne.id} />
                  <SubmitButton size="sm" variant="secondary" pendingText="Envoi…" disabled={enAttente === 0}>
                    Traiter les envois en attente ({enAttente})
                  </SubmitButton>
                </form>
              </div>
              {enrollments.length > 0 && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <th className="py-2">Contact</th>
                      <th>Etape</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const contact = verification.contacts.findById(enrollment.contactId);
                      return (
                        <tr key={enrollment.id} className="border-b border-slate-100">
                          <td className="py-2 font-medium text-slate-900">{contact?.email ?? enrollment.contactId}</td>
                          <td className="text-slate-500">{enrollment.etapeCourante}</td>
                          <td>
                            <Badge>{enrollment.statut}</Badge>
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
