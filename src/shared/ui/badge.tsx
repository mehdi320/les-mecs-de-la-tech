type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

// Vocabulaire de statuts partage par les modules (Mailbox, Domaine,
// Enrollment, Variante...) : un seul endroit pour la couleur de
// chaque mot, plutot qu'une correspondance recopiee page par page.
const STATUT_TONES: Record<string, Tone> = {
  connecte: "success",
  valide: "success",
  gagnante: "success",
  envoye: "success",
  terminee: "success",
  active: "success",
  repondu: "success",
  erreur: "danger",
  invalide: "danger",
  perdante: "danger",
  stoppe_suppression: "danger",
  stoppe_reponse: "danger",
  catch_all: "warning",
  en_cours: "warning",
  en_test: "warning",
  en_attente: "neutral",
  inconnu: "neutral",
  brouillon: "neutral",
  aucune: "neutral",
  opposee: "danger",
};

interface BadgeProps {
  children: string;
  tone?: Tone;
}

export function Badge({ children, tone }: BadgeProps) {
  const resolved = tone ?? STATUT_TONES[children] ?? "neutral";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[resolved]}`}>
      {children}
    </span>
  );
}
