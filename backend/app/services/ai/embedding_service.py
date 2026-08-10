from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def track_to_text(track: dict) -> str:
    artist_names = ", ".join(a["name"] for a in track.get("artists", []))
    album = track.get("album_name") or track.get("album", {}).get("name", "")
    return f"{track['name']} by {artist_names}. Album: {album}"


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_track(track: dict) -> list[float]:
    return embed_text(track_to_text(track))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr, b_arr = np.array(a), np.array(b)
    return float(np.dot(a_arr, b_arr))
