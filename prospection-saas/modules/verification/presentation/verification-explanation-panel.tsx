export function VerificationExplanationPanel({ explanationText }: { explanationText: string }) {
  return (
    <p className="max-w-md text-xs text-neutral-600" title={explanationText}>
      {explanationText}
    </p>
  );
}
