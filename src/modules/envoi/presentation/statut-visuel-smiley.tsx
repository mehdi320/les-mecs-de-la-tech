import type { StatutVisuel } from "@/modules/envoi/domain/statut-visuel";
import { SmileyEchecIcon, SmileyEnvoyeIcon, SmileyOuvertIcon, SmileyReponduIcon } from "@/shared/ui/icons";

const CONFIG: Record<StatutVisuel, { Icon: typeof SmileyEnvoyeIcon; classe: string; titre: string }> = {
  envoye: { Icon: SmileyEnvoyeIcon, classe: "text-emerald-600", titre: "Envoye" },
  repondu: { Icon: SmileyReponduIcon, classe: "text-emerald-700", titre: "Repondu" },
  ouvert: { Icon: SmileyOuvertIcon, classe: "text-slate-500", titre: "Ouvert" },
  echec: { Icon: SmileyEchecIcon, classe: "text-red-600", titre: "Echec d'envoi" },
};

export function StatutVisuelSmiley({ statut }: { statut: StatutVisuel | null }) {
  if (!statut) return <span className="text-xs text-slate-300">—</span>;
  const { Icon, classe, titre } = CONFIG[statut];
  return (
    <span className={`inline-flex items-center gap-1 ${classe}`} title={titre}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
