from pydantic import BaseModel, Field

from app.services.ai.llm_client import generate_json
from app.services.ai.prompt_templates import MOOD_PARSER_SYSTEM_INSTRUCTION, build_mood_prompt


class MoodPlan(BaseModel):
    playlist_name: str = Field(description="Short, evocative playlist name, max 6 words")
    playlist_description: str = Field(description="One-sentence description of the playlist's vibe")
    search_queries: list[str] = Field(description="6 to 10 short Spotify search queries matching the mood")


def parse_mood(mood: str) -> MoodPlan:
    result = generate_json(
        prompt=build_mood_prompt(mood),
        response_schema=MoodPlan,
        system_instruction=MOOD_PARSER_SYSTEM_INSTRUCTION,
    )
    return result
