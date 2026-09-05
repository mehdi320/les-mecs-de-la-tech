import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterEtape, creerSequence } from "@/modules/envoi/presentation/sequence-actions";

export default function SequencesPage() {
  const { envoi } = getContainer();
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
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

              <ol className="mt-3 space-y-2">
                {etapes.map((etape) => (
                  <li key={etape.id} className="rounded bg-slate-50 p-2 text-sm">
                    <p className="font-medium">
                      Etape {etape.ordre + 1} — J+{etape.delaiJours}
                    </p>
                    <p className="text-slate-600">{etape.sujet}</p>
                  </li>
                ))}
              </ol>

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
