"use client";

import { useState } from "react";
import { ExtractionBatchForm } from "@/modules/extraction/presentation/extraction-batch-form";
import { ExtractionBatchList } from "@/modules/extraction/presentation/extraction-batch-list";

export default function ExtractionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Extraction</h1>
      <ExtractionBatchForm onLaunched={() => setRefreshKey((k) => k + 1)} />
      <ExtractionBatchList refreshKey={refreshKey} />
    </div>
  );
}
