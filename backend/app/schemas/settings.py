from pydantic import BaseModel, EmailStr


class CompanySettings(BaseModel):
    name: str
    nif: str
    phone: str
    email: EmailStr
    address: str
    city: str


class BusinessHours(BaseModel):
    open: str = ""
    close: str = ""


class TenantSettingsOut(BaseModel):
    company: CompanySettings
    hours: BusinessHours
    roles: dict[str, dict[str, bool]]


class TenantSettingsUpdate(BaseModel):
    company: CompanySettings
    hours: BusinessHours
    roles: dict[str, dict[str, bool]]


class SupportRequestCreate(BaseModel):
    subject: str
    message: str
    priority: str = "normal"
