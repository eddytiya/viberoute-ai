import spotipy


def saved_tracks_contains(client: spotipy.Spotify, track_ids: list[str]) -> list[bool]:
    return client.current_user_saved_tracks_contains(track_ids)


def save_tracks(client: spotipy.Spotify, track_ids: list[str]) -> None:
    client.current_user_saved_tracks_add(track_ids)


def unsave_tracks(client: spotipy.Spotify, track_ids: list[str]) -> None:
    client.current_user_saved_tracks_delete(track_ids)


def following_artists_contains(client: spotipy.Spotify, artist_ids: list[str]) -> list[bool]:
    return client.current_user_following_artists(artist_ids)


def follow_artists(client: spotipy.Spotify, artist_ids: list[str]) -> None:
    client.user_follow_artists(artist_ids)


def unfollow_artists(client: spotipy.Spotify, artist_ids: list[str]) -> None:
    client.user_unfollow_artists(artist_ids)
