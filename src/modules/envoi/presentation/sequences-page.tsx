import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterEtape, creerSequence } from "@/modules/envoi/presentation/sequence-actions";
import { changerStatutVariante, genererVariantesPourEtape } from "@/modules/envoi/presentation/variante-actions";
import { STRUCTURE_LABELS, TONE_LABELS } from "@/modules/envoi/domain/personnalisation/entities";
import { lintCorps, lintSujet } from "@/modules/envoi/domain/personnalisation/copywriting-rules";

export default function SequencesPage() {
  const { envoi } = getContainer();
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Sequences</h1>

      <form action={creerSequence} className="mt-6 flex gap-2 rounded border border-slate-200 bg-white p-4">
        <input name="nom" placeholder="Nom de la sequence" required className="flex-1 rounded border border-slate-300 px-2 py-1" />
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
          Creer
        </button>
      </form>

      <div className="mt-6 space-y-6">
        {sequences.map((sequence) => {
          const etapes = envoi.sequences.listEtapes(sequence.id);
          return (
            <div key={sequence.id} className="rounded border border-slate-200 bg-white p-4">
              <h2 className="font-medium">{sequence.nom}</h2>
              <p className="text-xs text-slate-500">{sequence.statut}</p>

              <div className="mt-3 space-y-4">
                {etapes.map((etape) => {
                  const variantes = envoi.sequenceEtapeVariantes.listBySequenceEtape(etape.id);
                  return (
                    <div key={etape.id} className="rounded bg-slate-50 p-3 text-sm">
                      <p className="font-medium">
                        Etape {etape.ordre + 1} — J+{etape.delaiJours}
                      </p>
                      <p className="text-slate-600">{etape.sujet}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Contenu par defaut envoye si aucune variante active (cf. SPEC.md section 9).
                      </p>

                      {variantes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {variantes.map((variante) => {
                            const issues = [...lintSujet(variante.sujet), ...lintCorps(variante.corps)];
                            return (
                              <div key={variante.id} className="rounded border border-slate-200 bg-white p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold">
                                    Variante {variante.nom} — {STRUCTURE_LABELS[variante.structure]} · {variante.longueur} · {TONE_LABELS[variante.tone]}
                                  </p>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      variante.statut === "gagnante"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : variante.statut === "perdante"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {variante.statut}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-700">Objet : {variante.sujet}</p>
                                <p className="text-xs text-slate-600 whitespace-pre-wrap">{variante.corps}</p>
                                {issues.length > 0 && (
                                  <ul className="mt-1 list-inside list-disc text-[11px] text-amber-700">
                                    {issues.map((issue) => (
                                      <li key={issue.code}>{issue.message}</li>
                                    ))}
                                  </ul>
                                )}
                                <div className="mt-2 flex gap-2">
                                  <form action={changerStatutVariante}>
                                    <input type="hidden" name="varianteId" value={variante.id} />
                                    <input type="hidden" name="statut" value="gagnante" />
                                    <button type="submit" className="text-[11px] text-emerald-700 underline">
                                      marquer gagnante
                                    </button>
                                  </form>
                                  <form action={changerStatutVariante}>
                                    <input type="hidden" name="varianteId" value={variante.id} />
                                    <input type="hidden" name="statut" value="perdante" />
                                    <button type="submit" className="text-[11px] text-red-700 underline">
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
                        <input
                          name="sujetReference"
                          placeholder="Objet de reference"
                          required
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                        <textarea
                          name="corpsReference"
                          placeholder="Corps de reference — utilisez {prenom}, {entreprise}, {poste} ou toute colonne de votre CSV"
                          required
                          rows={3}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                        <button type="submit" className="rounded bg-slate-700 px-2 py-1 text-xs text-white">
                          Generer 5 variantes
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <form action={ajouterEtape} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <input type="hidden" name="sequenceId" value={sequence.id} />
                <div className="flex gap-2">
                  <input name="sujet" placeholder="Sujet" required className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
                  <input
                    name="delaiJours"
                    type="number"
                    defaultValue={0}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <textarea name="corps" placeholder="Corps du message" required rows={3} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <button type="submit" className="rounded bg-slate-700 px-2 py-1 text-xs text-white">
                  Ajouter l&apos;etape
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
