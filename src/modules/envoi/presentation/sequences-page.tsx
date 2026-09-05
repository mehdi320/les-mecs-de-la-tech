import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterEtape, creerSequence } from "@/modules/envoi/presentation/sequence-actions";
import { changerStatutVariante, genererVariantesPourEtape } from "@/modules/envoi/presentation/variante-actions";
import { STRUCTURE_LABELS, TONE_LABELS } from "@/modules/envoi/domain/personnalisation/entities";
import { lintCorps, lintSujet } from "@/modules/envoi/domain/personnalisation/copywriting-rules";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardTitle } from "@/shared/ui/card";
import { Field, Input, Textarea } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { AlertTriangleIcon, SequenceIcon } from "@/shared/ui/icons";

export default function SequencesPage() {
  const { envoi } = getContainer();
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Sequences" description="Gabarits de campagne reutilisables : etapes, delais, et variantes A/B." />

      <Card>
        <form action={creerSequence} className="flex gap-2">
          <Input name="nom" placeholder="Nom de la sequence" required />
          <SubmitButton className="shrink-0">Creer</SubmitButton>
        </form>
      </Card>

      <div className="mt-6 space-y-6">
        {sequences.length === 0 && (
          <EmptyState
            icon={<SequenceIcon className="h-8 w-8" />}
            title="Aucune sequence"
            description="Creez une sequence ci-dessus, puis ajoutez-y des etapes."
          />
        )}

        {sequences.map((sequence) => {
          const etapes = envoi.sequences.listEtapes(sequence.id);
          return (
            <Card key={sequence.id}>
              <div className="flex items-center justify-between">
                <CardTitle>{sequence.nom}</CardTitle>
                <Badge>{sequence.statut}</Badge>
              </div>

              <div className="mt-4 space-y-4">
                {etapes.map((etape) => {
                  const variantes = envoi.sequenceEtapeVariantes.listBySequenceEtape(etape.id);
                  return (
                    <div key={etape.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-semibold text-slate-800">
                          Etape {etape.ordre + 1} <span className="font-normal text-slate-400">— J+{etape.delaiJours}</span>
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{etape.sujet}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Contenu par defaut envoye si aucune variante active (cf. SPEC.md section 9).
                      </p>

                      {variantes.length > 0 && (
                        <div className="mt-3 space-y-2.5">
                          {variantes.map((variante) => {
                            const issues = [...lintSujet(variante.sujet), ...lintCorps(variante.corps)];
                            return (
                              <div key={variante.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-800">Variante {variante.nom}</span>
                                    <Badge tone="info">{STRUCTURE_LABELS[variante.structure]}</Badge>
                                    <Badge tone="info">{variante.longueur}</Badge>
                                    <Badge tone="info">{TONE_LABELS[variante.tone]}</Badge>
                                  </div>
                                  <Badge>{variante.statut}</Badge>
                                </div>
                                <p className="mt-2 text-xs">
                                  <span className="font-medium text-slate-500">Objet — </span>
                                  <span className="text-slate-800">{variante.sujet}</span>
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{variante.corps}</p>
                                {issues.length > 0 && (
                                  <div className="mt-2 flex gap-1.5 rounded-md bg-amber-50 p-2 text-amber-800">
                                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 translate-y-px" />
                                    <ul className="space-y-0.5 text-[11px]">
                                      {issues.map((issue) => (
                                        <li key={issue.code}>{issue.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="mt-2.5 flex gap-3">
                                  <form action={changerStatutVariante}>
                                    <input type="hidden" name="varianteId" value={variante.id} />
                                    <input type="hidden" name="statut" value="gagnante" />
                                    <button type="submit" className="text-[11px] font-medium text-emerald-700 hover:underline">
                                      marquer gagnante
                                    </button>
                                  </form>
                                  <form action={changerStatutVariante}>
                                    <input type="hidden" name="varianteId" value={variante.id} />
                                    <input type="hidden" name="statut" value="perdante" />
                                    <button type="submit" className="text-[11px] font-medium text-red-700 hover:underline">
                                      exclure de la rotation
                                    </button>
                                  </form>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <form action={genererVariantesPourEtape} className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                        <input type="hidden" name="sequenceEtapeId" value={etape.id} />
                        <p className="text-xs font-medium text-slate-600">
                          Generer des variantes A/B (objet + corps de reference)
                        </p>
                        <Input name="sujetReference" placeholder="Objet de reference" required className="text-xs" />
                        <Textarea
                          name="corpsReference"
                          placeholder="Corps de reference — utilisez {prenom}, {entreprise}, {poste} ou toute colonne de votre CSV"
                          required
                          rows={3}
                          className="text-xs"
                        />
                        <SubmitButton variant="secondary" size="sm" pendingText="Generation…">
                          Generer 5 variantes
                        </SubmitButton>
                      </form>
                    </div>
                  );
                })}
              </div>

              <form action={ajouterEtape} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <input type="hidden" name="sequenceId" value={sequence.id} />
                <div className="flex gap-2">
                  <Field label="Sujet" className="flex-1">
                    <Input name="sujet" required />
                  </Field>
                  <Field label="Delai (jours)" className="w-28">
                    <Input name="delaiJours" type="number" defaultValue={0} />
                  </Field>
                </div>
                <Field label="Corps du message">
                  <Textarea name="corps" required rows={3} />
                </Field>
                <SubmitButton variant="secondary" size="sm">
                  Ajouter l&apos;etape
                </SubmitButton>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
