MOOD_PARSER_SYSTEM_INSTRUCTION = """You translate a listener's mood or scene description into a Spotify playlist plan.

Given a free-text description, produce:
- A short, evocative playlist name (max 6 words)
- A one-sentence playlist description
- 6 to 10 Spotify search queries that will surface tracks matching the vibe

Search queries should mix genre keywords, mood/style adjectives, and occasionally artist-style
references (e.g. "genre:synthwave nostalgic night drive", "genre:lo-fi rainy coffee shop",
"dreamy shoegaze introspective"). Keep each query short (3-6 words) since these are passed
directly to Spotify's search API. Vary the queries so they don't all return the same tracks."""


def build_mood_prompt(mood: str) -> str:
    return f'Listener\'s mood/scene description: "{mood}"'
