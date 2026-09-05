"use client";

import { useEffect, useState } from "react";

interface AuditRow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  timestamp: string;
}

export function AuditLogExport() {
  const [entries, setEntries] = useState<AuditRow[]>([]);

  useEffect(() => {
    fetch("/api/conformite/audit-log")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Horodatage</th>
            <th className="py-2">Action</th>
            <th className="py-2">Entité</th>
            <th className="py-2">Acteur</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-neutral-100">
              <td className="py-2">{new Date(entry.timestamp).toLocaleString("fr-FR")}</td>
              <td className="py-2">{entry.action}</td>
              <td className="py-2">
                {entry.entityType}:{entry.entityId}
              </td>
              <td className="py-2">{entry.actor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
