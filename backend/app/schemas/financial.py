from pydantic import BaseModel


class FinancialSummary(BaseModel):
    daily_revenue: int
    monthly_revenue: int
    daily_expenses: int
    monthly_expenses: int
    pending_payments: int
    revenue_by_month: list[dict]
    revenue_by_service: list[dict]
    daily_revenues: list[dict]
    weekly_revenues: list[dict]


class CommissionItem(BaseModel):
    id: str
    name: str
    role: str
    appointments: int
    total_revenue: int
    commission_rate: int
    commission_value: int


class CommissionSummary(BaseModel):
    total_commissions: int
    items: list[CommissionItem]
