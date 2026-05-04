from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.support import SupportReply, SupportTicket
from app.models.tenant import Tenant
from app.models.tenant_settings import TenantSettings
from app.models.user import User
from app.schemas.settings import SupportRequestCreate, TenantSettingsOut, TenantSettingsUpdate
from app.schemas.super_admin import SupportTicketOut
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_super_admin_caches, invalidate_tenant_caches
from app.services.permissions import DEFAULT_PERMISSIONS

router = APIRouter(dependencies=[Depends(require_tenant_permission("settings"))])


def _get_or_create_settings(db: Session, tenant_id: str) -> TenantSettings:
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    if settings:
        return settings

    settings = TenantSettings(
        tenant_id=tenant_id,
        open_time="08:00",
        close_time="18:00",
        permissions=DEFAULT_PERMISSIONS,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _to_out(tenant: Tenant, settings: TenantSettings) -> TenantSettingsOut:
    return TenantSettingsOut(
        company={
            "name": tenant.name,
            "nif": tenant.nif,
            "phone": tenant.phone,
            "email": tenant.email,
            "address": tenant.address or "",
            "city": tenant.city or "",
        },
        hours={"open": settings.open_time or "", "close": settings.close_time or ""},
        roles=settings.permissions or DEFAULT_PERMISSIONS,
    )


@router.get("", response_model=TenantSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    settings = _get_or_create_settings(db, tenant_id)
    return _to_out(tenant, settings)


@router.put("", response_model=TenantSettingsOut)
def update_settings(
    payload: TenantSettingsUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    duplicate_email = db.scalar(
        select(Tenant).where(and_(Tenant.email == payload.company.email, Tenant.id != tenant_id))
    )
    if duplicate_email:
        raise HTTPException(status_code=400, detail="Já existe outra empresa com este e-mail")

    duplicate_nif = db.scalar(
        select(Tenant).where(and_(Tenant.nif == payload.company.nif, Tenant.id != tenant_id))
    )
    if duplicate_nif:
        raise HTTPException(status_code=400, detail="Já existe outra empresa com este NIF")

    settings = _get_or_create_settings(db, tenant_id)

    tenant.name = payload.company.name
    tenant.nif = payload.company.nif
    tenant.phone = payload.company.phone
    tenant.email = payload.company.email
    tenant.address = payload.company.address
    tenant.city = payload.company.city

    settings.open_time = payload.hours.open
    settings.close_time = payload.hours.close
    settings.permissions = payload.roles

    log_tenant_action(
        db,
        tenant_id=tenant_id,
        user_name=current_user.full_name,
        area="Configurações",
        event_type="update",
        action="Atualizou as configurações da empresa",
        target=tenant.name,
    )

    db.commit()
    db.refresh(tenant)
    db.refresh(settings)
    invalidate_tenant_caches(tenant_id)
    invalidate_super_admin_caches()
    return _to_out(tenant, settings)


@router.post("/support", response_model=SupportTicketOut)
def create_support_request(
    payload: SupportRequestCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    ticket = SupportTicket(
        tenant_id=tenant_id,
        subject=payload.subject,
        priority=payload.priority,
        status="open",
    )
    db.add(ticket)
    db.flush()
    db.add(SupportReply(ticket_id=ticket.id, author=current_user.full_name, message=payload.message))

    log_tenant_action(
        db,
        tenant_id=tenant_id,
        user_name=current_user.full_name,
        area="Configurações",
        event_type="create",
        action="Abriu um pedido de suporte",
        target=payload.subject,
    )

    db.commit()
    db.refresh(ticket)
    invalidate_super_admin_caches()
    return SupportTicketOut(
        id=ticket.id,
        tenant_id=ticket.tenant_id,
        tenant=tenant.name,
        subject=ticket.subject,
        priority=ticket.priority,
        status=ticket.status,
        opened_at=ticket.opened_at,
        agent=ticket.agent,
    )
