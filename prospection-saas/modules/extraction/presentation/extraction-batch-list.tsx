"use client";

import { useEffect, useState } from "react";

interface BatchRow {
  id: string;
  status: string;
  provider: string;
  contactCount: number;
  startedAt: string;
  completedAt: string | null;
}

export function ExtractionBatchList({ refreshKey }: { refreshKey: number }) {
  const [batches, setBatches] = useState<BatchRow[]>([]);

  useEffect(() => {
    fetch("/api/extraction/batches")
      .then((r) => r.json())
      .then(setBatches)
      .catch(() => setBatches([]));
  }, [refreshKey]);

  if (batches.length === 0) {
    return <p className="text-sm text-neutral-500">Aucune extraction lancée pour l&apos;instant.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-neutral-500">
          <th className="py-2">Statut</th>
          <th className="py-2">Fournisseur</th>
          <th className="py-2">Contacts</th>
          <th className="py-2">Lancée le</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((batch) => (
          <tr key={batch.id} className="border-b border-neutral-100">
            <td className="py-2">{batch.status}</td>
            <td className="py-2">{batch.provider}</td>
            <td className="py-2">{batch.contactCount}</td>
            <td className="py-2">{new Date(batch.startedAt).toLocaleString("fr-FR")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
