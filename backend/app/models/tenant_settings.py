import uuid

from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TenantSettings(Base):
    __tablename__ = "tenant_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), unique=True, index=True)
    open_time: Mapped[str] = mapped_column(String(10), default="")
    close_time: Mapped[str] = mapped_column(String(10), default="")
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)
