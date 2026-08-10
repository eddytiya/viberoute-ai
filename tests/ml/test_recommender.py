"""Tests for the recommendation-scoring logic that actually exists in this codebase
(app/services/recommendations/). The top-level ml/ package referenced by this test's
original name is unimplemented scaffolding (every file in it is 0 bytes) — there is
nothing there to test yet. This covers content_filter's diversity/novelty scoring and
hybrid_recommender's candidate-ranking centroid math instead."""

from app.services.recommendations.content_filter import score_diversity, score_novelty
from app.services.recommendations.hybrid_recommender import _centroid


def test_score_diversity_is_zero_for_identical_embeddings():
    embeddings = [[1.0, 0.0], [1.0, 0.0], [1.0, 0.0]]
    assert score_diversity(embeddings) == 0.0


def test_score_diversity_is_high_for_orthogonal_embeddings():
    embeddings = [[1.0, 0.0], [0.0, 1.0]]
    assert score_diversity(embeddings) == 100.0


def test_score_diversity_returns_zero_for_fewer_than_two_tracks():
    assert score_diversity([[1.0, 0.0]]) == 0.0
    assert score_diversity([]) == 0.0


def test_score_novelty_is_full_when_no_listening_history():
    assert score_novelty([1.0, 0.0], []) == 100.0


def test_score_novelty_is_zero_for_a_track_identical_to_history():
    assert score_novelty([1.0, 0.0], [[1.0, 0.0]]) == 0.0


def test_score_novelty_uses_the_closest_historical_match():
    track = [1.0, 0.0]
    history = [[0.0, 1.0], [0.99, 0.14]]  # second vector is nearly identical to the track
    assert score_novelty(track, history) < 10.0


def test_centroid_is_the_mean_of_input_vectors():
    vectors = [[1.0, 1.0], [3.0, 3.0]]
    assert _centroid(vectors) == [2.0, 2.0]
