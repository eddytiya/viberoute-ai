from sqlalchemy.orm import Session

from app.models.track import Track


def upsert_tracks(db: Session, spotify_tracks: list[dict]) -> None:
    deduped = {item["id"]: item for item in spotify_tracks}

    for item in deduped.values():
        track = db.get(Track, item["id"])
        if track is None:
            track = Track(id=item["id"])
            db.add(track)

        track.name = item["name"]
        track.artists = [{"id": a["id"], "name": a["name"]} for a in item["artists"]]
        track.album_name = item.get("album", {}).get("name")
        images = item.get("album", {}).get("images") or []
        track.album_image_url = images[-1]["url"] if images else None
        track.duration_ms = item.get("duration_ms")

    db.commit()
