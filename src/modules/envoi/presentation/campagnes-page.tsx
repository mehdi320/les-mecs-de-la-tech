import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { creerCampagne, traiterCampagne } from "@/modules/envoi/presentation/campagne-actions";

export default function CampagnesPage() {
  const { envoi, verification } = getContainer();
  const campagnes = envoi.campagnes.listByClient(CLIENT_ID_COURANT);
  const sequences = envoi.sequences.listByClient(CLIENT_ID_COURANT);
  const listes = verification.listesImportees.listByClient(CLIENT_ID_COURANT);
  const mailboxes = envoi.mailboxes.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Campagnes</h1>

      <form action={creerCampagne} className="mt-6 space-y-3 rounded border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <select name="sequenceId" required className="rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="">Sequence</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
          <select name="listeId" required className="rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="">Liste</option>
            {listes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.nbContacts})
              </option>
            ))}
          </select>
          <select name="mailboxId" required className="rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="">Mailbox</option>
            {mailboxes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>
          <input
            name="seuilScoreRisqueMin"
            type="number"
            placeholder="Seuil score risque max (optionnel)"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
          Creer la campagne
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {campagnes.map((campagne) => {
          const enrollments = envoi.enrollments.listByCampagne(campagne.id);
          const sequence = sequences.find((s) => s.id === campagne.sequenceId);
          return (
            <div key={campagne.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium">{sequence?.nom ?? campagne.sequenceId}</h2>
                  <p className="text-xs text-slate-500">
                    {enrollments.length} enrollments — statut campagne : {campagne.statut}
                  </p>
                </div>
                <form action={traiterCampagne}>
                  <input type="hidden" name="campagneId" value={campagne.id} />
                  <button type="submit" className="rounded bg-slate-700 px-2 py-1 text-xs text-white">
                    Traiter les envois en attente
                  </button>
                </form>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-1">Contact</th>
                    <th>Etape</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const contact = verification.contacts.findById(enrollment.contactId);
                    return (
                      <tr key={enrollment.id} className="border-b border-slate-100">
                        <td className="py-1">{contact?.email ?? enrollment.contactId}</td>
                        <td>{enrollment.etapeCourante}</td>
                        <td>{enrollment.statut}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
