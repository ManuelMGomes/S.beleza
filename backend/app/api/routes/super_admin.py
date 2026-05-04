from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import require_super_admin
from app.core.redis_client import cache_get_json, cache_set_json
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.support import SupportReply, SupportTicket
from app.models.tenant import Tenant
from app.schemas.super_admin import (
    AuditLogOut,
    PlatformStats,
    SupportReplyCreate,
    SupportReplyOut,
    SupportTicketCreate,
    SupportTicketOut,
    SupportTicketUpdate,
)
from app.schemas.tenant import TenantOut, TenantStatusUpdate
from app.services.audit import parse_action
from app.services.cache import invalidate_super_admin_caches

router = APIRouter(dependencies=[Depends(require_super_admin)])


def _tenant_to_out(t: Tenant) -> TenantOut:
    return TenantOut(
        id=t.id,
        code=t.code,
        name=t.name,
        nif=t.nif,
        owner=t.owner,
        email=t.email,
        phone=t.phone,
        city=t.city,
        plan=t.plan,
        status=t.status,
        users=t.users,
        monthly_revenue=t.monthly_revenue,
        created_at=t.created_at,
        last_access=t.last_access,
        next_billing=t.next_billing,
    )


@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    tenants = db.execute(select(Tenant).order_by(Tenant.created_at.desc())).scalars().all()
    return [_tenant_to_out(t) for t in tenants]


@router.patch("/tenants/{tenant_id}/status", response_model=TenantOut)
def update_tenant_status(tenant_id: str, payload: TenantStatusUpdate, db: Session = Depends(get_db)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    tenant.status = payload.status
    db.add(AuditLog(tenant_id=tenant.id, user_name="Super Admin", action=f"Status do tenant alterado para {payload.status}", ip="—"))
    db.commit()
    db.refresh(tenant)
    invalidate_super_admin_caches()
    return _tenant_to_out(tenant)


@router.get("/support/tickets", response_model=list[SupportTicketOut])
def list_tickets(db: Session = Depends(get_db)):
    rows = db.execute(
        select(SupportTicket, Tenant.name).join(Tenant, Tenant.id == SupportTicket.tenant_id).order_by(SupportTicket.opened_at.desc())
    ).all()
    return [
        SupportTicketOut(
            id=t.id,
            tenant_id=t.tenant_id,
            tenant=tenant_name,
            subject=t.subject,
            priority=t.priority,
            status=t.status,
            opened_at=t.opened_at,
            agent=t.agent,
        )
        for t, tenant_name in rows
    ]


@router.post("/support/tickets/{tenant_id}", response_model=SupportTicketOut)
def create_ticket_for_tenant(tenant_id: str, payload: SupportTicketCreate, db: Session = Depends(get_db)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    ticket = SupportTicket(tenant_id=tenant.id, subject=payload.subject, priority=payload.priority, status="open")
    db.add(ticket)
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


@router.patch("/support/tickets/{ticket_id}", response_model=SupportTicketOut)
def update_ticket(ticket_id: str, payload: SupportTicketUpdate, db: Session = Depends(get_db)):
    row = db.execute(
        select(SupportTicket, Tenant.name)
        .join(Tenant, Tenant.id == SupportTicket.tenant_id)
        .where(SupportTicket.id == ticket_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    ticket, tenant_name = row
    ticket.status = payload.status
    ticket.agent = payload.agent
    db.commit()
    db.refresh(ticket)
    invalidate_super_admin_caches()
    return SupportTicketOut(
        id=ticket.id,
        tenant_id=ticket.tenant_id,
        tenant=tenant_name,
        subject=ticket.subject,
        priority=ticket.priority,
        status=ticket.status,
        opened_at=ticket.opened_at,
        agent=ticket.agent,
    )


@router.post("/support/tickets/{ticket_id}/reply", response_model=SupportReplyOut)
def reply_ticket(ticket_id: str, payload: SupportReplyCreate, db: Session = Depends(get_db)):
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    reply = SupportReply(ticket_id=ticket_id, author=payload.author, message=payload.message)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return SupportReplyOut.model_validate(reply, from_attributes=True)


@router.get("/support/tickets/{ticket_id}/replies", response_model=list[SupportReplyOut])
def list_replies(ticket_id: str, db: Session = Depends(get_db)):
    replies = db.execute(select(SupportReply).where(SupportReply.ticket_id == ticket_id).order_by(SupportReply.created_at.asc())).scalars().all()
    return [SupportReplyOut.model_validate(r, from_attributes=True) for r in replies]


@router.get("/stats", response_model=PlatformStats)
def platform_stats(db: Session = Depends(get_db)):
    settings = get_settings()
    cache_key = "superadmin:stats"
    cached = cache_get_json(cache_key)
    if cached:
        return PlatformStats(**cached)

    total_tenants = db.scalar(select(func.count(Tenant.id))) or 0
    active_tenants = db.scalar(select(func.count(Tenant.id)).where(Tenant.status == "active")) or 0
    trial_tenants = db.scalar(select(func.count(Tenant.id)).where(Tenant.status == "trial")) or 0
    mrr = db.scalar(select(func.coalesce(func.sum(Tenant.monthly_revenue), 0)).where(Tenant.status == "active")) or 0
    open_tickets = db.scalar(select(func.count(SupportTicket.id)).where(SupportTicket.status != "resolved")) or 0

    growth_rows = db.execute(
        select(func.to_char(Tenant.created_at, "Mon"), func.count(Tenant.id), func.coalesce(func.sum(Tenant.monthly_revenue), 0))
        .group_by(func.to_char(Tenant.created_at, "Mon"))
    ).all()
    growth_by_month = [{"month": m.strip().capitalize(), "tenants": int(c), "mrr": int(v)} for m, c, v in growth_rows]

    plan_rows = db.execute(select(Tenant.plan, func.count(Tenant.id)).group_by(Tenant.plan)).all()
    tenants_by_plan = [{"name": p, "value": int(c)} for p, c in plan_rows]

    result = PlatformStats(
        total_tenants=int(total_tenants),
        active_tenants=int(active_tenants),
        trial_tenants=int(trial_tenants),
        monthly_recurring_revenue=int(mrr),
        open_tickets=int(open_tickets),
        growth_by_month=growth_by_month,
        tenants_by_plan=tenants_by_plan,
    )
    cache_set_json(cache_key, result.model_dump(), ttl_seconds=settings.cache_ttl_seconds)
    return result


@router.get("/logs", response_model=list[AuditLogOut])
def list_logs(db: Session = Depends(get_db)):
    rows = db.execute(
        select(AuditLog, Tenant.name)
        .join(Tenant, Tenant.id == AuditLog.tenant_id, isouter=True)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    ).all()

    return [
        AuditLogOut(
            id=log.id,
            tenant=tenant_name or "—",
            user=log.user_name,
            action=parse_action(log.action)["action"],
            ip=log.ip,
            timestamp=log.created_at.strftime("%Y-%m-%d %H:%M"),
        )
        for log, tenant_name in rows
    ]
