from datetime import datetime

from pydantic import BaseModel


class AppointmentBase(BaseModel):
    client_id: str
    service_id: str
    employee_id: str
    start_at: datetime
    status: str = "pending"
    price: int = 0


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(AppointmentBase):
    pass


class AppointmentOut(BaseModel):
    id: str
    client_id: str
    service_id: str
    employee_id: str
    client: str
    service: str
    employee: str
    date: str
    time: str
    start_at: datetime
    status: str
    price: int
