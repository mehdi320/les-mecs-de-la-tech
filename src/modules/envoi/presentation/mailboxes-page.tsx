import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { connecterMailboxSmtp } from "@/modules/envoi/presentation/mailbox-actions";

export default function MailboxesPage() {
  const { envoi } = getContainer();
  const mailboxes = envoi.mailboxes.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Mailboxes</h1>
      <p className="mt-1 text-sm text-slate-500">
        OAuth Google Workspace / Microsoft 365 necessitent des identifiants applicatifs non configures dans cet
        environnement (cf. PASSATION.md). Connexion SMTP generique fonctionnelle ci-dessous.
      </p>

      <form action={connecterMailboxSmtp} className="mt-6 space-y-3 rounded border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Hote SMTP</label>
            <input name="host" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Port</label>
            <input name="port" type="number" defaultValue={587} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Utilisateur</label>
          <input name="user" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Mot de passe / cle applicative</label>
          <input name="pass" type="password" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="secure" type="checkbox" /> Connexion TLS directe (port 465)
        </label>
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
          Connecter
        </button>
      </form>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-1">Email</th>
            <th>Fournisseur</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {mailboxes.map((mailbox) => (
            <tr key={mailbox.id} className="border-b border-slate-100">
              <td className="py-1">{mailbox.email}</td>
              <td>{mailbox.provider}</td>
              <td>{mailbox.statutConnexion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
