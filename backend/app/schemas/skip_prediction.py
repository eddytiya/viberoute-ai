from pydantic import BaseModel


class SkipPollResponse(BaseModel):
    recorded: bool
    track_id: str | None = None
    skipped: bool | None = None


class SkipStatusResponse(BaseModel):
    listening_events: int
    skip_events: int
    ready_to_train: bool
    min_events_needed: int
