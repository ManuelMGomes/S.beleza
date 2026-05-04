from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterTenantRequest(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone: str
    company_nif: str
    company_address: str = ""
    company_city: str = "Luanda"

    admin_name: str
    admin_email: EmailStr
    admin_phone: str
    admin_password: str = Field(min_length=8)


class UserMe(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: str = ""
    role: str
    tenant_id: str | None = None
    permissions: dict[str, bool] = {}
