import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { spotifyApi } from "../api/spotifyApi";

export function useArtistFollow(artistId: string) {
  const queryClient = useQueryClient();

  const followingQuery = useQuery({
    queryKey: ["following-artist", artistId],
    queryFn: async () => (await spotifyApi.followingArtistsContains([artistId]))[artistId] ?? false,
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      followingQuery.data ? spotifyApi.unfollowArtists([artistId]) : spotifyApi.followArtists([artistId]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["following-artist", artistId] }),
  });

  return {
    isFollowing: followingQuery.data ?? false,
    isLoading: followingQuery.isLoading,
    isPending: toggleMutation.isPending,
    toggle: () => toggleMutation.mutate(),
  };
}
