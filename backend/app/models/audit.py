import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True, index=True)
    user_name: Mapped[str] = mapped_column(String(120), default="Sistema")
    action: Mapped[str] = mapped_column(String(255))
    ip: Mapped[str] = mapped_column(String(50), default="—")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
