from sqlalchemy.orm import Session

from app.models.track import Track
from app.repositories.track_repository import upsert_tracks
from app.services.ai.embedding_service import cosine_similarity, embed_track


def ensure_embeddings(db: Session, tracks: list[dict]) -> dict[str, list[float]]:
    upsert_tracks(db, tracks)
    ids = [t["id"] for t in tracks]
    rows = db.query(Track).filter(Track.id.in_(ids)).all()

    changed = False
    for row in rows:
        if row.embedding is None:
            row.embedding = embed_track({"name": row.name, "artists": row.artists, "album_name": row.album_name})
            changed = True
    if changed:
        db.commit()

    return {row.id: row.embedding for row in rows}


def find_similar_tracks(db: Session, track_id: str, limit: int = 8) -> list[dict]:
    target = db.get(Track, track_id)
    if target is None or target.embedding is None:
        return []

    candidates = db.query(Track).filter(Track.id != track_id, Track.embedding.isnot(None)).all()

    scored = [
        {
            "id": c.id,
            "name": c.name,
            "artists": c.artists,
            "album_name": c.album_name,
            "album_image_url": c.album_image_url,
            "duration_ms": c.duration_ms,
            "similarity_pct": round(max(0.0, min(1.0, cosine_similarity(target.embedding, c.embedding))) * 100, 1),
        }
        for c in candidates
    ]
    scored.sort(key=lambda t: t["similarity_pct"], reverse=True)
    return scored[:limit]
