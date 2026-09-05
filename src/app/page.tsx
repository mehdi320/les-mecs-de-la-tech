import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";

export const dynamic = "force-dynamic";

export default function AccueilPage() {
  const container = getContainer();
  const client = container.clients.findById(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      {!client ? (
        <p className="mt-4 text-red-600">
          Client de demonstration introuvable. Lancez <code>npm run db:migrate && npm run db:seed</code>.
        </p>
      ) : (
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>Client : {client.nom}</p>
          <p>Palier : {client.planId}</p>
          <p>
            DPA signe :{" "}
            {client.dpaSignedAt ? (
              <span className="text-emerald-600">le {client.dpaSignedAt}</span>
            ) : (
              <span className="text-red-600">non signe — envoi bloque</span>
            )}
          </p>
        </div>
      )}
      <p className="mt-6 text-sm text-slate-500">
        Perimetre MVP : Envoi + Verification + Conformite basique (cf. SPEC.md section 6).
      </p>
    </div>
  );
}
