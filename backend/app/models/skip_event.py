import datetime
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SkipEvent(Base):
    __tablename__ = "skip_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    track_id: Mapped[str] = mapped_column(ForeignKey("tracks.id"))
    occurred_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    played_ms: Mapped[int] = mapped_column(Integer)
    track_duration_ms: Mapped[int] = mapped_column(Integer)
    skipped: Mapped[bool] = mapped_column(Boolean)
