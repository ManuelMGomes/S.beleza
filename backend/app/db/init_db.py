from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User


def seed_initial_data(db: Session) -> None:
    settings = get_settings()
    email = settings.super_admin_email.strip().lower()
    password = settings.super_admin_password.strip()
    name = settings.super_admin_name.strip() or "Super Admin"

    if not email or not password:
        return None

    user = db.scalar(select(User).where(User.email == email))
    if user:
        user.full_name = name
        user.password_hash = hash_password(password)
        user.role = "super_admin"
        user.tenant_id = None
        user.status = "active"
    else:
        db.add(
            User(
                tenant_id=None,
                full_name=name,
                email=email,
                phone="",
                password_hash=hash_password(password),
                role="super_admin",
                status="active",
            )
        )

    db.commit()
    return None
