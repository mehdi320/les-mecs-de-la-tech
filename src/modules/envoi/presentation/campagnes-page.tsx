import Link from "next/link";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { creerCampagne, marquerEnrollmentRepondu, supprimerCampagne, traiterCampagne } from "@/modules/envoi/presentation/campagne-actions";
import { statutVisuelEnrollment } from "@/modules/envoi/domain/statut-visuel";
import { StatutVisuelSmiley } from "@/modules/envoi/presentation/statut-visuel-smiley";
import { diagnostiquer, type CauseSousPerformance } from "@/modules/delivrabilite/domain/diagnostic-performance";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardTitle } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { CampaignIcon } from "@/shared/ui/icons";
import { DeleteButton } from "@/shared/ui/delete-button";

const CAUSE_LABELS: Record<CauseSousPerformance, string> = {
  delivrabilite: "Delivrabilite",
  contenu: "Contenu / copywriting",
  ciblage: "Ciblage / liste",
  aucune: "Aucun signal",
};

export default function CampagnesPage() {
  const { envoi, verification } = getContainer();
  const campagnes = envoi.campagnes.listByClient(CLIENT_ID_COURANT);
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);
  const listes = verification.listesImportees.listByClient(CLIENT_ID_COURANT);
  const mailboxes = envoi.mailboxes.listByClient(CLIENT_ID_COURANT);
  const domaines = envoi.domaines.listByClient(CLIENT_ID_COURANT);

  const prerequisManquants = [
    mailboxes.length === 0 && { label: "aucune mailbox connectee", href: "/mailboxes" },
    sequences.length === 0 && { label: "aucune sequence creee", href: "/sequences" },
    listes.length === 0 && { label: "aucune liste importee", href: "/listes" },
  ].filter((p): p is { label: string; href: string } => Boolean(p));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Campagnes" description="Association sequence + liste + mailbox, suivi des envois et diagnostic de performance." />

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
          const evenements = envoi.envoiEvenements.listByCampagne(campagne.id);

          // --- Diagnostic de sous-performance (cf. SPEC.md section 9.8) ---
          const echecs = evenements.filter((e) => e.statutSmtp.startsWith("erreur")).length;
          const ouverts = evenements.filter((e) => e.ouvertAt).length;
          const repondus = enrollments.filter((e) => e.statut === "repondu").length;

          const contactsListe = verification.contacts.listByListe(campagne.listeId);
          const scores = contactsListe
            .map((c) => verification.verificationResultats.findByContact(c.id)?.scoreRisque)
            .filter((s): s is number => s !== undefined);
          const scoreRisqueMoyenListe = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

          const mailboxCampagne = mailboxes.find((m) => m.id === campagne.mailboxIds[0]);
          const domaineCampagne = mailboxCampagne
            ? domaines.find((d) => d.nomDomaine === mailboxCampagne.email.split("@")[1])
            : undefined;
          const domaineAuthValide = domaineCampagne
            ? domaineCampagne.spfStatut === "valide" && domaineCampagne.dmarcStatut === "valide"
            : null;

          const diagnostic = diagnostiquer({
            envoyes: evenements.length,
            echecs,
            ouverts,
            repondus,
            scoreRisqueMoyenListe,
            domaineAuthValide,
          });

          return (
            <Card key={campagne.id}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{sequence?.nom ?? campagne.sequenceId}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {enrollments.length} enrollments <Badge>{campagne.statut}</Badge>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={traiterCampagne}>
                    <input type="hidden" name="campagneId" value={campagne.id} />
                    <SubmitButton size="sm" variant="secondary" pendingText="Envoi…" disabled={enAttente === 0}>
                      Traiter les envois en attente ({enAttente})
                    </SubmitButton>
                  </form>
                  <DeleteButton
                    action={supprimerCampagne}
                    fields={{ campagneId: campagne.id }}
                    confirmMessage={`Supprimer cette campagne et ses ${enrollments.length} enrollments ?`}
                  />
                </div>
              </div>

              {evenements.length > 0 && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">Diagnostic de performance</p>
                    <Badge tone={diagnostic.cause === "delivrabilite" ? "danger" : diagnostic.cause === "aucune" ? "neutral" : "warning"}>
                      {CAUSE_LABELS[diagnostic.cause]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600">{diagnostic.recommandation}</p>
                  <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
                    <span>Echec : {Math.round(diagnostic.tauxEchec * 100)}%</span>
                    <span>Ouverture : {Math.round(diagnostic.tauxOuverture * 100)}%</span>
                    <span>Reponse : {Math.round(diagnostic.tauxReponse * 100)}%</span>
                    {scoreRisqueMoyenListe !== null && <span>Score risque liste : {Math.round(scoreRisqueMoyenListe)}/100</span>}
                  </div>
                </div>
              )}

              {enrollments.length > 0 && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <th className="py-2">Contact</th>
                      <th>Etape</th>
                      <th>Statut</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const contact = verification.contacts.findById(enrollment.contactId);
                      const evenementsEnrollment = evenements.filter((e) => e.enrollmentId === enrollment.id);
                      const statutVisuel = statutVisuelEnrollment(enrollment.statut, evenementsEnrollment);
                      const peutMarquerRepondu = !["repondu", "stoppe_suppression", "stoppe_reponse"].includes(enrollment.statut) && evenementsEnrollment.length > 0;
                      return (
                        <tr key={enrollment.id} className="border-b border-slate-100">
                          <td className="py-2 font-medium text-slate-900">{contact?.email ?? enrollment.contactId}</td>
                          <td className="text-slate-500">{enrollment.etapeCourante}</td>
                          <td>
                            <Badge>{enrollment.statut}</Badge>
                          </td>
                          <td>
                            <StatutVisuelSmiley statut={statutVisuel} />
                          </td>
                          <td className="text-right">
                            {peutMarquerRepondu && (
                              <form action={marquerEnrollmentRepondu}>
                                <input type="hidden" name="enrollmentId" value={enrollment.id} />
                                <button type="submit" className="text-[11px] font-medium text-emerald-700 hover:underline">
                                  marquer repondu
                                </button>
                              </form>
                            )}
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
