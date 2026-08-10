import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../components/common/Button";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { skipPredictorApi } from "../api/skipPredictorApi";

export function SkipPredictorPage() {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ["skip-status"], queryFn: skipPredictorApi.status });

  const syncMutation = useMutation({
    mutationFn: skipPredictorApi.sync,
    onSuccess: (data) => queryClient.setQueryData(["skip-status"], data),
  });

  const pollMutation = useMutation({
    mutationFn: skipPredictorApi.poll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skip-status"] }),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 560 }}>
      <p>
        Spotify doesn't expose "skipped" data directly, so this collects it two ways: syncing your
        recently-played history, and polling what's currently playing to detect when a track changes
        before it finishes.
      </p>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {status.isLoading && <Loader label="Checking collected data..." />}
        {status.isError && <ErrorMessage message="Could not load status." />}
        {status.data && (
          <>
            <div style={{ display: "flex", gap: "var(--space-5)" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-h)" }}>
                  {status.data.listening_events}
                </div>
                <div style={{ fontSize: 12 }}>listening events</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-h)" }}>
                  {status.data.skip_events}
                </div>
                <div style={{ fontSize: 12 }}>skip-labeled events</div>
              </div>
            </div>

            <p style={{ fontSize: 13 }}>
              {status.data.ready_to_train
                ? "Enough data to train a first model."
                : `Needs ${status.data.min_events_needed - status.data.skip_events} more skip-labeled events before training makes sense.`}
            </p>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Button variant="secondary" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? "Syncing..." : "Sync history now"}
              </Button>
              <Button variant="ghost" onClick={() => pollMutation.mutate()} disabled={pollMutation.isPending}>
                {pollMutation.isPending ? "Polling..." : "Poll now playing"}
              </Button>
            </div>

            {pollMutation.data && (
              <p style={{ fontSize: 13 }}>
                {pollMutation.data.recorded
                  ? `Recorded: ${pollMutation.data.skipped ? "skipped" : "played through"}`
                  : "No track change detected yet — play something, wait, then poll again."}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
