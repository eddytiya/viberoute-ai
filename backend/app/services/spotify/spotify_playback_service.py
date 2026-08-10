import spotipy


def get_now_playing(client: spotipy.Spotify) -> dict | None:
    playback = client.current_playback()
    if not playback or not playback.get("item"):
        return None
    return {
        "is_playing": playback["is_playing"],
        "progress_ms": playback.get("progress_ms", 0),
        "device_id": (playback.get("device") or {}).get("id"),
        "device_name": (playback.get("device") or {}).get("name"),
        "volume_percent": (playback.get("device") or {}).get("volume_percent"),
        "shuffle_state": playback.get("shuffle_state", False),
        "repeat_state": playback.get("repeat_state", "off"),
        "track": playback["item"],
    }


def list_devices(client: spotipy.Spotify) -> list[dict]:
    return client.devices().get("devices", [])


def play(client: spotipy.Spotify, device_id: str | None, uris: list[str] | None, context_uri: str | None) -> None:
    client.start_playback(device_id=device_id, uris=uris, context_uri=context_uri)


def pause(client: spotipy.Spotify, device_id: str | None) -> None:
    client.pause_playback(device_id=device_id)


def next_track(client: spotipy.Spotify, device_id: str | None) -> None:
    client.next_track(device_id=device_id)


def previous_track(client: spotipy.Spotify, device_id: str | None) -> None:
    client.previous_track(device_id=device_id)


def seek(client: spotipy.Spotify, position_ms: int, device_id: str | None) -> None:
    client.seek_track(position_ms, device_id=device_id)


def set_volume(client: spotipy.Spotify, volume_percent: int, device_id: str | None) -> None:
    client.volume(volume_percent, device_id=device_id)


def transfer(client: spotipy.Spotify, device_id: str, play: bool) -> None:
    client.transfer_playback(device_id, force_play=play)


def queue(client: spotipy.Spotify, uri: str, device_id: str | None) -> None:
    client.add_to_queue(uri, device_id=device_id)
