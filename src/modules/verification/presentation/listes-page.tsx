import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { importerListe, lancerVerification } from "@/modules/verification/presentation/liste-actions";

export default function ListesPage() {
  const { verification } = getContainer();
  const listes = verification.listesImportees.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Listes importees</h1>
      <p className="mt-1 text-sm text-slate-500">
        Une adresse par ligne (ex: <code>prenom@exemple.com, Prenom, Entreprise</code>). Dedoublonnage intra-liste et
        exclusion des contacts deja dans le registre de suppression au moment de l&apos;import (cf. SPEC.md section 4).
      </p>

      <form action={importerListe} className="mt-6 space-y-3 rounded border border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <input name="nom" placeholder="Nom de la liste" required className="flex-1 rounded border border-slate-300 px-2 py-1" />
          <input name="sourceDeclaree" placeholder="Source declaree (optionnel)" className="flex-1 rounded border border-slate-300 px-2 py-1" />
        </div>
        <textarea
          name="contacts"
          placeholder="prenom@exemple.com&#10;autre@exemple.com, Prenom, Entreprise"
          required
          rows={6}
          className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
        />
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
          Importer
        </button>
      </form>

      <div className="mt-6 space-y-6">
        {listes.map((liste) => {
          const contacts = verification.contacts.listByListe(liste.id);
          return (
            <div key={liste.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium">{liste.nom}</h2>
                  <p className="text-xs text-slate-500">
                    {liste.nbContacts} contacts — statut : {liste.statutVerification}
                  </p>
                </div>
                {liste.statutVerification !== "terminee" && (
                  <form action={lancerVerification}>
                    <input type="hidden" name="listeId" value={liste.id} />
                    <button type="submit" className="rounded bg-slate-700 px-2 py-1 text-xs text-white">
                      Lancer la verification
                    </button>
                  </form>
                )}
              </div>

              {liste.statutVerification === "terminee" && (
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-1">Email</th>
                      <th>Score de risque</th>
                      <th>Explication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => {
                      const resultat = verification.verificationResultats.findByContact(contact.id);
                      return (
                        <tr key={contact.id} className="border-b border-slate-100 align-top">
                          <td className="py-1">{contact.email}</td>
                          <td>{resultat?.scoreRisque ?? "—"}</td>
                          <td className="text-xs text-slate-600">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
