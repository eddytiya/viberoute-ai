def make_track(track_id: str, name: str = "Test Track", artist_id: str = "artist-1", artist_name: str = "Test Artist", duration_ms: int = 200_000) -> dict:
    return {
        "id": track_id,
        "name": name,
        "artists": [{"id": artist_id, "name": artist_name}],
        "album": {"name": "Test Album", "images": [{"url": f"https://example.com/{track_id}.jpg"}]},
        "duration_ms": duration_ms,
        "external_urls": {"spotify": f"https://open.spotify.com/track/{track_id}"},
    }


def make_artist(artist_id: str, name: str = "Test Artist") -> dict:
    return {"id": artist_id, "name": name, "images": [], "genres": ["pop"]}
