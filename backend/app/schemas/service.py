from pydantic import BaseModel


class ServiceBase(BaseModel):
    name: str
    price: int
    duration: int
    commission: int = 0
    category: str = "Outros"
    active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    pass


class ServiceOut(BaseModel):
    id: str
    name: str
    price: int
    duration: int
    commission: int
    category: str
    active: bool
