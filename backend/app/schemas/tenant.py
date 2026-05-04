from datetime import datetime

from pydantic import BaseModel, EmailStr


class TenantOut(BaseModel):
    id: str
    code: str
    name: str
    nif: str
    owner: str
    email: EmailStr
    phone: str
    city: str
    plan: str
    status: str
    users: int
    monthly_revenue: int
    created_at: datetime
    last_access: datetime
    next_billing: datetime


class TenantStatusUpdate(BaseModel):
    status: str
