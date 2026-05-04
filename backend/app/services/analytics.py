from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.client import Client
from app.models.employee import Employee
from app.models.product import Product
from app.models.service import Service


def month_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime(day.year, day.month, 1)
    if day.month == 12:
        end = datetime(day.year + 1, 1, 1)
    else:
        end = datetime(day.year, day.month + 1, 1)
    return start, end


def build_dashboard_overview(db: Session, tenant_id: str) -> dict:
    now = datetime.now()
    start_today = datetime(now.year, now.month, now.day)
    end_today = start_today + timedelta(days=1)
    start_month, end_month = month_bounds(now.date())

    today_appointments = db.scalar(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.start_at >= start_today,
                Appointment.start_at < end_today,
            )
        )
    ) or 0

    today_revenue = db.scalar(
        select(func.coalesce(func.sum(Appointment.price), 0)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.status == "completed",
                Appointment.start_at >= start_today,
                Appointment.start_at < end_today,
            )
        )
    ) or 0

    month_revenue = db.scalar(
        select(func.coalesce(func.sum(Appointment.price), 0)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.status == "completed",
                Appointment.start_at >= start_month,
                Appointment.start_at < end_month,
            )
        )
    ) or 0

    total_clients = db.scalar(select(func.count(Client.id)).where(Client.tenant_id == tenant_id)) or 0

    new_clients_month = db.scalar(
        select(func.count(Client.id)).where(
            and_(Client.tenant_id == tenant_id, Client.created_at >= start_month, Client.created_at < end_month)
        )
    ) or 0

    appointments_by_hour_query = db.execute(
        select(func.extract("hour", Appointment.start_at), func.count(Appointment.id))
        .where(and_(Appointment.tenant_id == tenant_id, Appointment.start_at >= start_today, Appointment.start_at < end_today))
        .group_by(func.extract("hour", Appointment.start_at))
    ).all()

    by_hour = {int(h): int(c) for h, c in appointments_by_hour_query}
    appointments_by_hour = [{"hour": f"{h:02d}:00", "count": by_hour.get(h, 0)} for h in range(8, 18)]

    low_stock = db.execute(
        select(Product).where(and_(Product.tenant_id == tenant_id, Product.stock <= Product.min_stock))
    ).scalars().all()

    upcoming = db.execute(
        select(Appointment, Client.name, Service.name, Employee.name)
        .join(Client, Client.id == Appointment.client_id)
        .join(Service, Service.id == Appointment.service_id)
        .join(Employee, Employee.id == Appointment.employee_id)
        .where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.start_at >= start_today,
                Appointment.start_at < end_today + timedelta(days=1),
                Appointment.status.in_(["pending", "confirmed"]),
            )
        )
        .order_by(Appointment.start_at.asc())
        .limit(10)
    ).all()

    return {
        "today_appointments": int(today_appointments),
        "today_revenue": int(today_revenue),
        "month_revenue": int(month_revenue),
        "total_clients": int(total_clients),
        "new_clients_month": int(new_clients_month),
        "appointments_by_hour": appointments_by_hour,
        "low_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "stock": p.stock,
                "min_stock": p.min_stock,
            }
            for p in low_stock
        ],
        "upcoming_appointments": [
            {
                "id": a.id,
                "client": client_name,
                "service": service_name,
                "employee": employee_name,
                "date": a.start_at.strftime("%Y-%m-%d"),
                "time": a.start_at.strftime("%H:%M"),
                "status": a.status,
                "price": a.price,
            }
            for a, client_name, service_name, employee_name in upcoming
        ],
    }


def build_financial_summary(db: Session, tenant_id: str) -> dict:
    now = datetime.now()
    start_today = datetime(now.year, now.month, now.day)
    end_today = start_today + timedelta(days=1)
    start_month, end_month = month_bounds(now.date())

    daily_revenue = db.scalar(
        select(func.coalesce(func.sum(Appointment.price), 0)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.status == "completed",
                Appointment.start_at >= start_today,
                Appointment.start_at < end_today,
            )
        )
    ) or 0

    monthly_revenue = db.scalar(
        select(func.coalesce(func.sum(Appointment.price), 0)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.status == "completed",
                Appointment.start_at >= start_month,
                Appointment.start_at < end_month,
            )
        )
    ) or 0

    pending_payments = db.scalar(
        select(func.coalesce(func.sum(Appointment.price), 0)).where(
            and_(
                Appointment.tenant_id == tenant_id,
                Appointment.status.in_(["pending", "confirmed"]),
                Appointment.start_at >= start_month,
                Appointment.start_at < end_month,
            )
        )
    ) or 0

    monthly_rows = db.execute(
        select(
            func.to_char(Appointment.start_at, "Mon"),
            func.coalesce(func.sum(Appointment.price), 0),
        )
        .where(and_(Appointment.tenant_id == tenant_id, Appointment.status == "completed"))
        .group_by(func.to_char(Appointment.start_at, "Mon"))
    ).all()

    revenue_by_month = [{"month": m.strip().capitalize(), "revenue": int(v), "expenses": int(v * 0.3)} for m, v in monthly_rows]

    by_service_rows = db.execute(
        select(Service.category, func.coalesce(func.sum(Appointment.price), 0))
        .join(Service, Service.id == Appointment.service_id)
        .where(and_(Appointment.tenant_id == tenant_id, Appointment.status == "completed"))
        .group_by(Service.category)
    ).all()

    revenue_by_service = [{"name": c, "value": int(v)} for c, v in by_service_rows]

    daily = defaultdict(int)
    weekly = defaultdict(int)
    appointments = db.execute(
        select(Appointment.start_at, Appointment.price, Appointment.status).where(Appointment.tenant_id == tenant_id)
    ).all()

    for dt, price, status in appointments:
        if status != "completed":
            continue
        day_key = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"][dt.weekday()]
        daily[day_key] += int(price)
        week_key = f"Sem {((dt.day - 1) // 7) + 1}"
        weekly[week_key] += int(price)

    daily_revenues = [{"day": k, "value": daily.get(k, 0)} for k in ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]]
    weekly_revenues = [{"week": f"Sem {i}", "value": weekly.get(f"Sem {i}", 0)} for i in range(1, 5)]

    return {
        "daily_revenue": int(daily_revenue),
        "monthly_revenue": int(monthly_revenue),
        "daily_expenses": int(daily_revenue * 0.2),
        "monthly_expenses": int(monthly_revenue * 0.3),
        "pending_payments": int(pending_payments),
        "revenue_by_month": revenue_by_month,
        "revenue_by_service": revenue_by_service,
        "daily_revenues": daily_revenues,
        "weekly_revenues": weekly_revenues,
    }
