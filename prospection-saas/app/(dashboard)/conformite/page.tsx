"use client";

import { useState } from "react";
import { OptOutRegistryView } from "@/modules/conformite/presentation/opt-out-registry-view";
import { AuditLogExport } from "@/modules/conformite/presentation/audit-log-export";

export default function ConformitePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-semibold">Liste de suppression (opt-out)</h1>
        <OptOutRegistryView refreshKey={refreshKey} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Journal d&apos;audit</h2>
        <AuditLogExport />
      </section>
      <button
        onClick={() => setRefreshKey((k) => k + 1)}
        className="text-xs text-neutral-500 underline"
      >
        Rafraîchir
      </button>
    </div>
  );
}
