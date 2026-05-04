import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    nif: Mapped[str] = mapped_column(String(30), unique=True)
    owner: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    phone: Mapped[str] = mapped_column(String(40))
    address: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(String(80), default="Luanda")
    plan: Mapped[str] = mapped_column(String(30), default="Essencial")
    status: Mapped[str] = mapped_column(String(20), default="trial")
    users: Mapped[int] = mapped_column(Integer, default=1)
    monthly_revenue: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_access: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    next_billing: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users_rel = relationship("User", back_populates="tenant")
