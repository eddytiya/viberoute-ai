from typing import Literal

from pydantic import BaseModel

CriticMode = Literal["humorous", "brutal", "philosophical"]


class CritiqueRequest(BaseModel):
    mode: CriticMode = "humorous"


class CritiqueResponse(BaseModel):
    title: str
    critique: str
    verdict: str
