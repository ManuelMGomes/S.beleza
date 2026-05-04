from pydantic import BaseModel


class DashboardOverview(BaseModel):
    today_appointments: int
    today_revenue: int
    month_revenue: int
    total_clients: int
    new_clients_month: int
    appointments_by_hour: list[dict]
    low_stock_products: list[dict]
    upcoming_appointments: list[dict]


class TenantAuditEntry(BaseModel):
    id: str
    user: str
    action: str
    target: str
    area: str
    type: str
    timestamp: str
