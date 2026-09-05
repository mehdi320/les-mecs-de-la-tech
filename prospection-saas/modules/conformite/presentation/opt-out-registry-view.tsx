"use client";

import { useEffect, useState } from "react";

interface OptOutRow {
  id: string;
  emailOrDomain: string;
  optedOutAt: string;
  optOutSource: string;
  scope: string;
}

export function OptOutRegistryView({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<OptOutRow[]>([]);
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<"contact_only" | "domain_wide">("contact_only");

  function load() {
    fetch("/api/conformite/opt-out")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  useEffect(load, [refreshKey]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    await fetch("/api/conformite/opt-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrDomain: value.trim(), scope, optOutSource: "manual_entry" }),
    });
    setValue("");
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Email ou domaine</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="jane@acme.com"
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Portée</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="contact_only">Contact seul</option>
            <option value="domain_wide">Domaine entier</option>
          </select>
        </div>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Ajouter à la liste de suppression
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Email / domaine</th>
            <th className="py-2">Portée</th>
            <th className="py-2">Source</th>
            <th className="py-2">Depuis le</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-neutral-100">
              <td className="py-2">{entry.emailOrDomain}</td>
              <td className="py-2">{entry.scope}</td>
              <td className="py-2">{entry.optOutSource}</td>
              <td className="py-2">{new Date(entry.optedOutAt).toLocaleString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
