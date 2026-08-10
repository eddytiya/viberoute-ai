from itertools import combinations

from app.services.ai.embedding_service import cosine_similarity


def _clamp_pct(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def score_diversity(embeddings: list[list[float]]) -> float:
    if len(embeddings) < 2:
        return 0.0
    sims = [cosine_similarity(a, b) for a, b in combinations(embeddings, 2)]
    avg_similarity = sum(sims) / len(sims)
    return _clamp_pct((1 - avg_similarity) * 100)


def score_novelty(track_embedding: list[float], history_embeddings: list[list[float]]) -> float:
    if not history_embeddings:
        return 100.0
    max_similarity = max(cosine_similarity(track_embedding, h) for h in history_embeddings)
    return _clamp_pct((1 - max_similarity) * 100)
