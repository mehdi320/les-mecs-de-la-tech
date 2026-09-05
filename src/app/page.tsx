import Link from "next/link";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { Card, CardDescription, CardTitle } from "@/shared/ui/card";
import { CampaignIcon, GlobeIcon, ListImportIcon, MailboxIcon, SequenceIcon, ShieldCheckIcon } from "@/shared/ui/icons";

export const dynamic = "force-dynamic";

export default function AccueilPage() {
  const { clients, envoi, verification, conformite } = getContainer();
  const client = clients.findById(CLIENT_ID_COURANT);

  if (!client) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Tableau de bord" />
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">
            Client de demonstration introuvable. Lancez <code className="rounded bg-red-100 px-1 py-0.5">npm run db:migrate && npm run db:seed</code>.
          </p>
        </Card>
      </div>
    );
  }

  const mailboxes = envoi.mailboxes.listByClient(client.id);
  const domaines = envoi.domaines.listByClient(client.id);
  const sequences = envoi.sequences.listByClient(client.id);
  const listes = verification.listesImportees.listByClient(client.id);
  const campagnes = envoi.campagnes.listByClient(client.id);
  const suppressions = conformite.suppressions.listByClient(client.id);

  const mailboxesConnectees = mailboxes.filter((m) => m.statutConnexion === "connecte").length;
  const totalContacts = listes.reduce((somme, liste) => somme + liste.nbContacts, 0);
  const enrollmentsEnAttente = campagnes.reduce(
    (somme, campagne) => somme + envoi.enrollments.listByCampagne(campagne.id).filter((e) => e.statut === "en_attente").length,
    0,
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Tableau de bord"
        description="Perimetre MVP : Envoi + Verification + Conformite basique (cf. SPEC.md section 6)."
      />

      {!client.dpaSignedAt && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">DPA non signe — l'envoi de campagnes est bloque.</p>
          <p className="mt-1 text-xs text-red-600">
            Cf. SPEC.md section 4, etape 1 : le contrat de sous-traitance doit etre signe avant toute activation.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link href="/mailboxes">
          <StatCard
            label="Mailboxes"
            value={mailboxes.length}
            detail={`${mailboxesConnectees} connectee(s)`}
            icon={<MailboxIcon className="h-4 w-4" />}
          />
        </Link>
        <Link href="/domaines">
          <StatCard label="Domaines" value={domaines.length} icon={<GlobeIcon className="h-4 w-4" />} />
        </Link>
        <Link href="/sequences">
          <StatCard label="Sequences" value={sequences.length} icon={<SequenceIcon className="h-4 w-4" />} />
        </Link>
        <Link href="/listes">
          <StatCard
            label="Contacts importes"
            value={totalContacts}
            detail={`${listes.length} liste(s)`}
            icon={<ListImportIcon className="h-4 w-4" />}
          />
        </Link>
        <Link href="/campagnes">
          <StatCard
            label="Campagnes"
            value={campagnes.length}
            detail={`${enrollmentsEnAttente} envoi(s) en attente`}
            icon={<CampaignIcon className="h-4 w-4" />}
          />
        </Link>
        <Link href="/conformite">
          <StatCard label="Registre de suppression" value={suppressions.length} icon={<ShieldCheckIcon className="h-4 w-4" />} />
        </Link>
      </div>

      {mailboxes.length === 0 && (
        <Card className="mt-6">
          <CardTitle>Premiers pas</CardTitle>
          <CardDescription>
            Connectez une mailbox, ajoutez un domaine, puis importez votre premiere liste de contacts pour lancer une
            campagne.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
