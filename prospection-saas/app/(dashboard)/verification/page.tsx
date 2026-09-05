"use client";

import { useEffect, useState } from "react";
import { RiskScoreBadge } from "@/modules/verification/presentation/risk-score-badge";
import { VerificationExplanationPanel } from "@/modules/verification/presentation/verification-explanation-panel";

interface ContactRow {
  id: string;
  fullName: string;
  emailGuessed: string | null;
}

interface VerificationRow {
  contactId: string;
  riskScore: number;
  verdictLabel: "valide" | "risque" | "catch_all_incertain" | "invalide";
  explanationText: string;
}

export default function VerificationPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [results, setResults] = useState<Record<string, VerificationRow>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  function load() {
    fetch("/api/extraction/contacts")
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => setContacts([]));

    fetch("/api/verification/results")
      .then((r) => r.json())
      .then((rows: VerificationRow[]) => {
        const byContact: Record<string, VerificationRow> = {};
        for (const row of rows) byContact[row.contactId] = row;
        setResults(byContact);
      })
      .catch(() => setResults({}));
  }

  useEffect(load, []);

  async function handleVerify(contactId: string) {
    setPendingId(contactId);
    try {
      await fetch("/api/verification/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      load();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vérification</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Contact</th>
            <th className="py-2">Email</th>
            <th className="py-2">Score</th>
            <th className="py-2">Explication</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const result = results[contact.id];
            return (
              <tr key={contact.id} className="border-b border-neutral-100 align-top">
                <td className="py-2">{contact.fullName}</td>
                <td className="py-2">{contact.emailGuessed ?? "—"}</td>
                <td className="py-2">
                  {result ? <RiskScoreBadge riskScore={result.riskScore} verdictLabel={result.verdictLabel} /> : "—"}
                </td>
                <td className="py-2">{result ? <VerificationExplanationPanel explanationText={result.explanationText} /> : null}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleVerify(contact.id)}
                    disabled={!contact.emailGuessed || pendingId === contact.id}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {pendingId === contact.id ? "…" : "Vérifier"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
