from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tenant_settings import TenantSettings
from app.models.user import User

DEFAULT_PERMISSIONS = {
    "gerente": {
        "agenda": True,
        "clients": True,
        "employees": True,
        "services": True,
        "financial": True,
        "cashier": True,
        "commissions": True,
        "stock": True,
        "audit": True,
        "settings": True,
    },
    "recepcionista": {
        "agenda": True,
        "clients": True,
        "employees": False,
        "services": False,
        "financial": False,
        "cashier": True,
        "commissions": False,
        "stock": False,
        "audit": False,
        "settings": False,
    },
    "profissional": {
        "agenda": True,
        "clients": True,
        "employees": False,
        "services": False,
        "financial": False,
        "cashier": False,
        "commissions": True,
        "stock": False,
        "audit": False,
        "settings": False,
    },
}


def get_tenant_permissions(db: Session, tenant_id: str) -> dict[str, dict[str, bool]]:
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    if settings and settings.permissions:
        return settings.permissions
    return DEFAULT_PERMISSIONS


def get_effective_permissions(db: Session, user: User) -> dict[str, bool]:
    if user.role in {"super_admin", "admin"}:
        modules = {
            key
            for role_permissions in DEFAULT_PERMISSIONS.values()
            for key in role_permissions.keys()
        }
        return {module: True for module in modules}

    if not user.tenant_id:
        return {}

    permissions = get_tenant_permissions(db, user.tenant_id)
    return permissions.get(user.role, {})
