import type { VerdictLabel } from "../domain/verification-result";

const LABELS: Record<VerdictLabel, { text: string; className: string }> = {
  valide: { text: "Valide", className: "bg-green-100 text-green-800" },
  risque: { text: "Risqué", className: "bg-yellow-100 text-yellow-800" },
  catch_all_incertain: { text: "Catch-all incertain", className: "bg-orange-100 text-orange-800" },
  invalide: { text: "Invalide", className: "bg-red-100 text-red-800" },
};

export function RiskScoreBadge({ riskScore, verdictLabel }: { riskScore: number; verdictLabel: VerdictLabel }) {
  const { text, className } = LABELS[verdictLabel];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {text} · {riskScore}/100
    </span>
  );
}
