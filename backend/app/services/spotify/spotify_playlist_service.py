import spotipy


def search_tracks(client: spotipy.Spotify, query: str, limit: int = 20) -> list[dict]:
    results = client.search(q=query, type="track", limit=limit)
    return results["tracks"]["items"]


def list_user_playlists(client: spotipy.Spotify) -> list[dict]:
    results = client.current_user_playlists(limit=50)
    return results["items"]


def get_playlist(client: spotipy.Spotify, playlist_id: str) -> dict:
    return client.playlist(playlist_id)


def get_playlist_items(client: spotipy.Spotify, playlist_id: str) -> list[dict]:
    results = client.playlist_items(playlist_id, additional_types=("track",))
    return [item["track"] for item in results["items"] if item.get("track")]


def update_playlist_details(
    client: spotipy.Spotify,
    playlist_id: str,
    name: str | None = None,
    description: str | None = None,
) -> None:
    client.playlist_change_details(playlist_id, name=name, description=description)


def add_tracks(client: spotipy.Spotify, playlist_id: str, track_ids: list[str]) -> None:
    client.playlist_add_items(playlist_id, track_ids)


def remove_tracks(client: spotipy.Spotify, playlist_id: str, track_ids: list[str]) -> None:
    client.playlist_remove_all_occurrences_of_items(playlist_id, track_ids)


def reorder_tracks(client: spotipy.Spotify, playlist_id: str, range_start: int, insert_before: int) -> None:
    client.playlist_reorder_items(playlist_id, range_start=range_start, insert_before=insert_before)


def upload_cover_image(client: spotipy.Spotify, playlist_id: str, image_b64: str) -> None:
    client.playlist_upload_cover_image(playlist_id, image_b64)
