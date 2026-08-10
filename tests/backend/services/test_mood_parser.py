from app.services.ai.mood_parser import MoodPlan, parse_mood


def test_parse_mood_returns_the_generated_plan(monkeypatch):
    expected = MoodPlan(
        playlist_name="Night Drive",
        playlist_description="Synthy tracks for a late-night drive.",
        search_queries=["synthwave night drive", "dreamy retro synth"],
    )
    captured = {}

    def fake_generate_json(prompt, response_schema, system_instruction):
        captured["prompt"] = prompt
        captured["schema"] = response_schema
        return expected

    monkeypatch.setattr("app.services.ai.mood_parser.generate_json", fake_generate_json)

    result = parse_mood("late night synthwave drive")

    assert result == expected
    assert "late night synthwave drive" in captured["prompt"]
    assert captured["schema"] is MoodPlan
