from datetime import date

from pydantic import BaseModel, EmailStr


class ClientBase(BaseModel):
    name: str
    phone: str = ""
    email: EmailStr | None = None
    birth_date: date | None = None
    notes: str = ""


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientOut(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    birth_date: date | None
    notes: str
    last_visit: date | None
    total_visits: int
