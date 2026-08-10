import { useMutation } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { criticApi } from "../api/criticApi";
import { CriticModeSelector } from "../components/critic/CriticModeSelector";
import { CriticResult } from "../components/critic/CriticResult";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import type { CriticMode } from "../types/critic";

export function MusicCriticPage() {
  const [mode, setMode] = useState<CriticMode | null>(null);

  const critiqueMutation = useMutation({
    mutationFn: (m: CriticMode) => criticApi.critique(m),
  });

  const handleSelect = (m: CriticMode) => {
    setMode(m);
    critiqueMutation.mutate(m);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <p>Pick a tone, and Gemini will critique your actual top tracks and artists.</p>

      <CriticModeSelector selected={mode} onSelect={handleSelect} disabled={critiqueMutation.isPending} />

      {critiqueMutation.isPending && <Loader label="Reading your top tracks and forming an opinion..." />}
      {critiqueMutation.isError && (
        <ErrorMessage
          message={
            (critiqueMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Could not generate a critique. Try again."
          }
        />
      )}

      <AnimatePresence mode="wait">
        {critiqueMutation.data && <CriticResult key={mode} critique={critiqueMutation.data} />}
      </AnimatePresence>
    </div>
  );
}
