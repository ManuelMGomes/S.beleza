from datetime import datetime

from pydantic import BaseModel


class SupportTicketCreate(BaseModel):
    subject: str
    priority: str = "medium"


class SupportTicketUpdate(BaseModel):
    status: str
    agent: str = "—"


class SupportReplyCreate(BaseModel):
    author: str
    message: str


class SupportTicketOut(BaseModel):
    id: str
    tenant_id: str
    tenant: str
    subject: str
    priority: str
    status: str
    opened_at: datetime
    agent: str


class SupportReplyOut(BaseModel):
    id: str
    ticket_id: str
    author: str
    message: str
    created_at: datetime


class PlatformStats(BaseModel):
    total_tenants: int
    active_tenants: int
    trial_tenants: int
    monthly_recurring_revenue: int
    open_tickets: int
    growth_by_month: list[dict]
    tenants_by_plan: list[dict]


class AuditLogOut(BaseModel):
    id: str
    tenant: str
    user: str
    action: str
    ip: str
    timestamp: str
