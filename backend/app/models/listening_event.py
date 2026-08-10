import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ListeningEvent(Base):
    __tablename__ = "listening_events"
    __table_args__ = (UniqueConstraint("user_id", "track_id", "played_at", name="uq_listening_event"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    track_id: Mapped[str] = mapped_column(ForeignKey("tracks.id"))
    played_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    context_type: Mapped[str | None] = mapped_column(String, nullable=True)
