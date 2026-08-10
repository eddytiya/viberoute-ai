def select_tracks_for_duration(tracks: list[dict], target_ms: int, tolerance_ms: int = 60_000) -> list[dict]:
    """Greedy nearest-fit: repeatedly pick whichever remaining track brings the running
    total closest to the target, stopping once within tolerance or nothing fits."""
    remaining = list(tracks)
    selected: list[dict] = []
    total = 0

    while remaining and total < target_ms - tolerance_ms:
        best = min(remaining, key=lambda t: abs((total + t["duration_ms"]) - target_ms))
        if total + best["duration_ms"] > target_ms + tolerance_ms:
            break
        selected.append(best)
        total += best["duration_ms"]
        remaining.remove(best)

    return selected
