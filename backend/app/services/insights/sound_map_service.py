from collections import Counter

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sqlalchemy.orm import Session

from app.models.track import Track


def build_sound_map(db: Session, max_clusters: int = 8) -> dict:
    tracks = db.query(Track).filter(Track.embedding.isnot(None)).all()
    if len(tracks) < 3:
        return {"points": [], "cluster_count": 0}

    embeddings = np.array([t.embedding for t in tracks])
    n_clusters = max(2, min(max_clusters, len(tracks) // 15))

    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(embeddings)

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)

    points = [
        {
            "track_id": track.id,
            "name": track.name,
            "artists": [a["name"] for a in track.artists],
            "x": float(x),
            "y": float(y),
            "cluster": int(cluster),
        }
        for track, (x, y), cluster in zip(tracks, coords, labels)
    ]

    return {"points": points, "cluster_count": n_clusters}


def get_cluster_summary(points: list[dict]) -> list[dict]:
    clusters: dict[int, list[dict]] = {}
    for point in points:
        clusters.setdefault(point["cluster"], []).append(point)

    summaries = []
    for cluster_id, cluster_points in sorted(clusters.items()):
        artist_counts = Counter(a for p in cluster_points for a in p["artists"])
        top_artists = [a for a, _ in artist_counts.most_common(2)]
        label = " / ".join(top_artists) if top_artists else f"Cluster {cluster_id + 1}"

        summaries.append(
            {
                "cluster": cluster_id,
                "label": label,
                "track_count": len(cluster_points),
                "track_ids": [p["track_id"] for p in cluster_points],
            }
        )

    return summaries
