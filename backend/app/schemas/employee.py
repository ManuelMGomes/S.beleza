from pydantic import BaseModel, EmailStr


class EmployeeBase(BaseModel):
    name: str
    role: str
    type: str = "servico"
    phone: str = ""
    commission: int = 0
    salary: int = 0
    status: str = "active"
    email: EmailStr | None = None
    password: str | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeOut(BaseModel):
    id: str
    name: str
    role: str
    type: str
    phone: str
    commission: int
    salary: int
    status: str
    email: str
