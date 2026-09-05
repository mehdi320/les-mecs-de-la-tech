"use client";

import { useState } from "react";

interface Props {
  onLaunched?: () => void;
}

export function ExtractionBatchForm({ onLaunched }: Props) {
  const [domains, setDomains] = useState("");
  const [titles, setTitles] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/extraction/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationDomains: domains.split(",").map((d) => d.trim()).filter(Boolean),
          personTitles: titles.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setDomains("");
      setTitles("");
      onLaunched?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'extraction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700">Domaines d&apos;entreprises (séparés par des virgules)</label>
        <input
          type="text"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="acme.com, example.com"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Intitulés de poste ciblés</label>
        <input
          type="text"
          value={titles}
          onChange={(e) => setTitles(e.target.value)}
          placeholder="VP Sales, Head of Growth"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Extraction en cours…" : "Lancer l'extraction"}
      </button>
    </form>
  );
}
