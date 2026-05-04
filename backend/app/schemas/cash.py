from datetime import datetime

from pydantic import BaseModel


class CashMovementCreate(BaseModel):
    description: str
    type: str
    method: str
    value: int


class CashMovementOut(BaseModel):
    id: str
    description: str
    type: str
    method: str
    value: int
    created_at: datetime


class CashSummary(BaseModel):
    entradas: int
    saidas: int
    saldo: int
