import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { ajouterSuppression, genererAuditExport } from "@/modules/conformite/presentation/conformite-actions";

export default function ConformitePage() {
  const { conformite } = getContainer();
  const suppressions = conformite.suppressions.listByClient(CLIENT_ID_COURANT);
  const audits = conformite.auditExports.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Conformite</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registre de suppression unifie a travers toutes les campagnes et listes du client (cf. SPEC.md section 3.3).
      </p>

      <section className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 className="font-medium">Registre de suppression</h2>
        <form action={ajouterSuppression} className="mt-3 flex gap-2">
          <input name="email" type="email" placeholder="email@exemple.com" required className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
          <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
            Ajouter
          </button>
        </form>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-1">Email</th>
              <th>Origine</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {suppressions.map((entree) => (
              <tr key={entree.id} className="border-b border-slate-100">
                <td className="py-1">{entree.email}</td>
                <td>{entree.origine}</td>
                <td>{entree.horodatage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 className="font-medium">Export d&apos;audit par contact</h2>
        <form action={genererAuditExport} className="mt-3 flex gap-2">
          <input name="email" type="email" placeholder="email@exemple.com" required className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
          <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
            Generer
          </button>
        </form>
        <div className="mt-4 space-y-3">
          {audits.map((audit) => (
            <div key={audit.id} className="rounded bg-slate-50 p-3 text-xs">
              <p>
                Hash : {audit.contactEmailHash.slice(0, 16)}… — statut opposition :{" "}
                <span className={audit.statutOpposition === "opposee" ? "text-red-600" : "text-emerald-600"}>
                  {audit.statutOpposition}
                </span>
              </p>
              <p className="mt-1 text-slate-500">
                {audit.campagnes.length} evenement(s) de campagne{" "}
                {audit.campagnes.length > 0 && `— dernier le ${audit.campagnes[audit.campagnes.length - 1]?.horodatage}`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
