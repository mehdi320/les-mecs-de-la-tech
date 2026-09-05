function tonePourScore(score: number): "success" | "warning" | "danger" {
  if (score >= 60) return "danger";
  if (score >= 25) return "warning";
  return "success";
}

const TONE_CLASSES = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

/** Score de risque (0-100) : jamais un chiffre nu, toujours colore par palier (cf. SPEC.md section 3.2). */
export function RiskScore({ score }: { score: number }) {
  const tone = tonePourScore(score);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {score}
    </span>
  );
}
