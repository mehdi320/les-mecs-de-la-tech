import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { connecterMailboxSmtp } from "@/modules/envoi/presentation/mailbox-actions";
import { PageHeader } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/field";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { MailboxIcon } from "@/shared/ui/icons";

export default function MailboxesPage() {
  const { envoi } = getContainer();
  const mailboxes = envoi.mailboxes.listByClient(CLIENT_ID_COURANT);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Mailboxes"
        description="OAuth Google Workspace / Microsoft 365 necessitent des identifiants applicatifs non configures dans cet environnement (cf. PASSATION.md). Connexion SMTP generique fonctionnelle ci-dessous."
      />

      <Card>
        <form action={connecterMailboxSmtp} className="space-y-3">
          <Field label="Email">
            <Input name="email" type="email" required placeholder="envoi@votredomaine.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hote SMTP">
              <Input name="host" required placeholder="smtp.votredomaine.com" />
            </Field>
            <Field label="Port">
              <Input name="port" type="number" defaultValue={587} />
            </Field>
          </div>
          <Field label="Utilisateur">
            <Input name="user" required />
          </Field>
          <Field label="Mot de passe / cle applicative">
            <Input name="pass" type="password" required />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input name="secure" type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Connexion TLS directe (port 465)
          </label>
          <SubmitButton pendingText="Connexion en cours…">Connecter</SubmitButton>
        </form>
      </Card>

      <div className="mt-6">
        {mailboxes.length === 0 ? (
          <EmptyState
            icon={<MailboxIcon className="h-8 w-8" />}
            title="Aucune mailbox connectee"
            description="Connectez une mailbox SMTP ci-dessus pour pouvoir creer une campagne."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-2">Email</th>
                <th>Fournisseur</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {mailboxes.map((mailbox) => (
                <tr key={mailbox.id} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium text-slate-900">{mailbox.email}</td>
                  <td className="text-slate-500">{mailbox.provider}</td>
                  <td>
                    <Badge>{mailbox.statutConnexion}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
