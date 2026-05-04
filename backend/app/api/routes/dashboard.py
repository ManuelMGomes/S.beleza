from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_tenant_id, require_tenant_permission
from app.core.config import get_settings
from app.core.redis_client import cache_get_json, cache_set_json
from app.db.session import get_db
from app.models.audit import AuditLog
from app.schemas.dashboard import DashboardOverview, TenantAuditEntry
from app.services.audit import parse_action
from app.services.analytics import build_dashboard_overview

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
def get_overview(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    settings = get_settings()
    cache_key = f"dashboard:overview:{tenant_id}"
    cached = cache_get_json(cache_key)
    if cached:
        return DashboardOverview(**cached)

    data = build_dashboard_overview(db, tenant_id)
    cache_set_json(cache_key, data, ttl_seconds=settings.cache_ttl_seconds)
    return DashboardOverview(**data)


@router.get("/audit", response_model=list[TenantAuditEntry])
def get_tenant_audit(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _: str = Depends(require_tenant_permission("audit")),
):
    logs = db.execute(
        select(AuditLog)
        .where(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    ).scalars().all()

    return [
        TenantAuditEntry(
            id=log.id,
            user=log.user_name,
            action=parse_action(log.action)["action"],
            target=parse_action(log.action)["target"],
            area=parse_action(log.action)["area"],
            type=parse_action(log.action)["type"],
            timestamp=log.created_at.isoformat(),
        )
        for log in logs
    ]
