from datetime import datetime

from pydantic import BaseModel


class Message(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class IdResponse(BaseModel):
    id: str


class Timestamps(BaseModel):
    created_at: datetime
