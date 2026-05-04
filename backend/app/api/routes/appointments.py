from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.client import Client
from app.models.employee import Employee
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("agenda"))])


def _to_out(a: Appointment, client_name: str, service_name: str, employee_name: str) -> AppointmentOut:
    return AppointmentOut(
        id=a.id,
        client_id=a.client_id,
        service_id=a.service_id,
        employee_id=a.employee_id,
        client=client_name,
        service=service_name,
        employee=employee_name,
        date=a.start_at.strftime("%Y-%m-%d"),
        time=a.start_at.strftime("%H:%M"),
        start_at=a.start_at,
        status=a.status,
        price=a.price,
    )


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    date: str | None = Query(default=None),
):
    stmt = (
        select(Appointment, Client.name, Service.name, Employee.name)
        .join(Client, Client.id == Appointment.client_id)
        .join(Service, Service.id == Appointment.service_id)
        .join(Employee, Employee.id == Appointment.employee_id)
        .where(Appointment.tenant_id == tenant_id)
        .order_by(Appointment.start_at.asc())
    )

    rows = db.execute(stmt).all()
    outs = [_to_out(a, c, s, e) for a, c, s, e in rows]
    if date:
        outs = [o for o in outs if o.date == date]
    return outs


@router.post("", response_model=AppointmentOut)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    client = db.scalar(select(Client).where(and_(Client.id == payload.client_id, Client.tenant_id == tenant_id)))
    service = db.scalar(select(Service).where(and_(Service.id == payload.service_id, Service.tenant_id == tenant_id)))
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not client or not service or not employee:
        raise HTTPException(status_code=400, detail="Relacionamentos inválidos")

    appointment = Appointment(tenant_id=tenant_id, **payload.model_dump())
    db.add(appointment)

    client.total_visits += 1
    client.last_visit = payload.start_at.date()
    log_tenant_action(
        db,
        tenant_id,
        current_user.full_name,
        "Agenda",
        "create",
        "Criou agendamento",
        f"{client.name} - {service.name}",
    )

    db.commit()
    db.refresh(appointment)
    invalidate_tenant_caches(tenant_id)
    return _to_out(appointment, client.name, service.name, employee.name)


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    appointment = db.scalar(select(Appointment).where(and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)))
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    client = db.scalar(select(Client).where(and_(Client.id == payload.client_id, Client.tenant_id == tenant_id)))
    service = db.scalar(select(Service).where(and_(Service.id == payload.service_id, Service.tenant_id == tenant_id)))
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not client or not service or not employee:
        raise HTTPException(status_code=400, detail="Relacionamentos inválidos")

    for field, value in payload.model_dump().items():
        setattr(appointment, field, value)
    log_tenant_action(
        db,
        tenant_id,
        current_user.full_name,
        "Agenda",
        "update",
        "Atualizou agendamento",
        f"{client.name} - {service.name}",
    )
    db.commit()
    db.refresh(appointment)
    invalidate_tenant_caches(tenant_id)

    return _to_out(appointment, client.name, service.name, employee.name)


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    appointment = db.scalar(select(Appointment).where(and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)))
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Agenda", "delete", "Removeu agendamento", appointment.id)
    db.delete(appointment)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Agendamento removido"}
