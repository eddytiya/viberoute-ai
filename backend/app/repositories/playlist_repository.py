from sqlalchemy.orm import Session, joinedload

from app.models.playlist import Playlist
from app.models.playlist_track import PlaylistTrack
from app.models.user import User

DISCOVERY_PLAYLIST_SOURCE = "discover_quicksave"


def get_playlists_by_source(db: Session, user: User, source: str, limit: int = 20) -> list[Playlist]:
    return (
        db.query(Playlist)
        .options(joinedload(Playlist.tracks).joinedload(PlaylistTrack.track))
        .filter(Playlist.user_id == user.id, Playlist.source == source)
        .order_by(Playlist.created_at.desc())
        .limit(limit)
        .all()
    )


def get_discovery_playlist(db: Session, user: User) -> Playlist | None:
    return (
        db.query(Playlist)
        .filter(Playlist.user_id == user.id, Playlist.source == DISCOVERY_PLAYLIST_SOURCE)
        .first()
    )


def add_track_to_playlist(db: Session, playlist: Playlist, track_id: str) -> None:
    next_position = len(playlist.tracks)
    db.add(PlaylistTrack(playlist_id=playlist.id, track_id=track_id, position=next_position))
    db.commit()


def create_playlist(
    db: Session,
    user: User,
    name: str,
    description: str,
    track_ids: list[str],
    spotify_playlist_id: str | None,
    source: str,
) -> Playlist:
    playlist = Playlist(
        user_id=user.id,
        name=name,
        description=description,
        spotify_playlist_id=spotify_playlist_id,
        source=source,
    )
    db.add(playlist)
    db.flush()

    for position, track_id in enumerate(track_ids):
        db.add(PlaylistTrack(playlist_id=playlist.id, track_id=track_id, position=position))

    db.commit()
    db.refresh(playlist)
    return playlist
