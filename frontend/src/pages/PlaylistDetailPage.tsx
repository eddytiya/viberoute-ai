import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Search } from "lucide-react";
import { useParams } from "react-router-dom";

import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { TrackList } from "../components/music/TrackList";
import { playlistApi } from "../api/playlistApi";
import type { SpotifyTrack } from "../types/spotify";

function fileToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PlaylistDetailPage() {
  const { playlistId = "" } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playlistsQuery = useQuery({ queryKey: ["my-playlists"], queryFn: playlistApi.mine });
  const playlist = playlistsQuery.data?.find((p) => p.id === playlistId);

  const itemsQuery = useQuery({
    queryKey: ["playlist-items", playlistId],
    queryFn: () => playlistApi.items(playlistId),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description);
    }
  }, [playlist]);

  const detailsMutation = useMutation({
    mutationFn: () => playlistApi.updateDetails(playlistId, name, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-playlists"] }),
  });

  const coverMutation = useMutation({
    mutationFn: async (file: File) => playlistApi.uploadCoverImage(playlistId, await fileToJpegBase64(file)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-playlists"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (track: SpotifyTrack) => playlistApi.removeItems(playlistId, [track.id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlist-items", playlistId] }),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useQuery({
    queryKey: ["playlist-search", searchQuery],
    queryFn: () => playlistApi.search(searchQuery),
    enabled: searchQuery.trim().length > 1,
  });

  const addMutation = useMutation({
    mutationFn: (track: SpotifyTrack) => playlistApi.addItems(playlistId, [track.id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlist-items", playlistId] }),
  });

  if (playlistsQuery.isLoading) return <Loader label="Loading playlist..." />;
  if (!playlist) return <ErrorMessage message="Playlist not found." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 760 }}>
      <div style={{ display: "flex", gap: "var(--space-4)" }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={coverMutation.isPending}
          title="Change cover image"
          style={{
            width: 120,
            height: 120,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            background: "var(--surface-hover)",
            border: "none",
            padding: 0,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {playlist.images[0] && (
            <img src={playlist.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              color: "white",
            }}
          >
            <Camera size={20} />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) coverMutation.mutate(file);
          }}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => detailsMutation.mutate()}
            style={{
              font: "inherit",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text-h)",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-2)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => detailsMutation.mutate()}
            rows={2}
            style={{
              font: "inherit",
              fontSize: 13,
              color: "var(--text)",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-2)",
              resize: "vertical",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      <div>
        <div style={{ position: "relative", marginBottom: "var(--space-3)" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Spotify to add tracks..."
            style={{
              width: "100%",
              padding: "var(--space-3) var(--space-3) var(--space-3) 34px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-h)",
              font: "inherit",
            }}
          />
        </div>
        {searchResults.isFetching && <Loader label="Searching..." />}
        {searchResults.data && searchResults.data.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-4)",
            }}
          >
            <TrackList tracks={searchResults.data} onAdd={(t) => addMutation.mutate(t)} />
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: "var(--space-2)" }}>{itemsQuery.data?.length ?? 0} tracks</h3>
        {itemsQuery.isLoading && <Loader label="Loading tracks..." />}
        {itemsQuery.isError && <ErrorMessage message="Could not load tracks." />}
        {itemsQuery.data && <TrackList tracks={itemsQuery.data} onRemove={(t) => removeMutation.mutate(t)} />}
      </div>
    </div>
  );
}
