from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterTenantRequest, UserMe
from app.schemas.common import Token
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_super_admin_caches
from app.services.permissions import get_effective_permissions

router = APIRouter()


@router.post("/register-tenant", response_model=Token)
def register_tenant(payload: RegisterTenantRequest, db: Session = Depends(get_db)):
    exists = db.scalar(select(Tenant).where(Tenant.email == payload.company_email))
    if exists:
        raise HTTPException(status_code=400, detail="Empresa já cadastrada com este email")

    user_exists = db.scalar(select(User).where(User.email == payload.admin_email))
    if user_exists:
        raise HTTPException(status_code=400, detail="Utilizador já existe com este email")

    now = datetime.utcnow()
    tenant = Tenant(
        code=f"T-{now.strftime('%y%m%d%H%M%S')}",
        name=payload.company_name,
        nif=payload.company_nif,
        owner=payload.admin_name,
        email=payload.company_email,
        phone=payload.company_phone,
        address=payload.company_address,
        city=payload.company_city,
        status="trial",
        plan="Essencial",
        users=1,
        monthly_revenue=0,
        created_at=now,
        last_access=now,
        next_billing=now + timedelta(days=30),
    )
    db.add(tenant)
    db.flush()

    admin = User(
        tenant_id=tenant.id,
        full_name=payload.admin_name,
        email=payload.admin_email,
        phone=payload.admin_phone,
        password_hash=hash_password(payload.admin_password),
        role="admin",
    )
    db.add(admin)
    log_tenant_action(
        db,
        tenant_id=tenant.id,
        user_name=payload.admin_name,
        area="Configurações",
        event_type="create",
        action="Cadastrou a empresa no sistema",
        target=payload.company_name,
    )
    db.commit()
    db.refresh(admin)
    invalidate_super_admin_caches()

    token = create_access_token(subject=admin.id, tenant_id=tenant.id, role=admin.role)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Utilizador inativo")

    if user.tenant_id:
        log_tenant_action(
            db,
            tenant_id=user.tenant_id,
            user_name=user.full_name,
            area="Sistema",
            event_type="update",
            action="Iniciou sessão",
            target=user.email,
        )

    token = create_access_token(subject=user.id, tenant_id=user.tenant_id, role=user.role)
    db.commit()
    return Token(access_token=token)


@router.get("/me", response_model=UserMe)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return UserMe(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        tenant_id=current_user.tenant_id,
        permissions=get_effective_permissions(db, current_user),
    )
