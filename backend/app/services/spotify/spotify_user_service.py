import spotipy


def get_current_user_profile(client: spotipy.Spotify) -> dict:
    return client.current_user()


def get_top_tracks(client: spotipy.Spotify, limit: int = 20, time_range: str = "medium_term") -> list[dict]:
    result = client.current_user_top_tracks(limit=limit, time_range=time_range)
    return result.get("items", [])


def get_top_artists(client: spotipy.Spotify, limit: int = 20, time_range: str = "medium_term") -> list[dict]:
    result = client.current_user_top_artists(limit=limit, time_range=time_range)
    return result.get("items", [])
