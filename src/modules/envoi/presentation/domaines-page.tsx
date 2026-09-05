import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterDomaine, reverifierDomaine } from "@/modules/envoi/presentation/domaine-actions";

export default function DomainesPage() {
  const { envoi } = getContainer();
  const domaines = envoi.domaines.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Domaines</h1>
      <p className="mt-1 text-sm text-slate-500">
        Verification SPF/DMARC par requete DNS reelle. DKIM reste "inconnu" (necessite le selecteur du client,
        non collecte pour l&apos;instant).
      </p>

      <form action={ajouterDomaine} className="mt-6 flex gap-2 rounded border border-slate-200 bg-white p-4">
        <input name="nomDomaine" placeholder="exemple.com" required className="flex-1 rounded border border-slate-300 px-2 py-1" />
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
          Ajouter et verifier
        </button>
      </form>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-1">Domaine</th>
            <th>SPF</th>
            <th>DKIM</th>
            <th>DMARC</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {domaines.map((domaine) => (
            <tr key={domaine.id} className="border-b border-slate-100">
              <td className="py-1">{domaine.nomDomaine}</td>
              <td>{domaine.spfStatut}</td>
              <td>{domaine.dkimStatut}</td>
              <td>{domaine.dmarcStatut}</td>
              <td>
                <form action={reverifierDomaine}>
                  <input type="hidden" name="domaineId" value={domaine.id} />
                  <input type="hidden" name="nomDomaine" value={domaine.nomDomaine} />
                  <button type="submit" className="text-xs text-slate-500 underline">
                    revalider
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
