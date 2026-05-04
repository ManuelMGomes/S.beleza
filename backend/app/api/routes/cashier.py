from fastapi import APIRouter, Depends
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.cash import CashMovement
from app.models.user import User
from app.schemas.cash import CashMovementCreate, CashMovementOut, CashSummary
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("cashier"))])


@router.get("/movements", response_model=list[CashMovementOut])
def list_movements(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(
        select(CashMovement).where(CashMovement.tenant_id == tenant_id).order_by(CashMovement.created_at.desc())
    ).scalars().all()
    return [CashMovementOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/movements", response_model=CashMovementOut)
def create_movement(
    payload: CashMovementCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    movement = CashMovement(tenant_id=tenant_id, **payload.model_dump())
    db.add(movement)
    log_tenant_action(
        db,
        tenant_id,
        current_user.full_name,
        "Caixa",
        "create",
        f"Registrou movimentação de {payload.type}",
        f"{payload.description} - {payload.value}",
    )
    db.commit()
    db.refresh(movement)
    invalidate_tenant_caches(tenant_id)
    return CashMovementOut.model_validate(movement, from_attributes=True)


@router.get("/summary", response_model=CashSummary)
def get_summary(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(CashMovement).where(CashMovement.tenant_id == tenant_id)).scalars().all()
    entradas = sum(m.value for m in rows if m.type == "entrada")
    saidas = sum(m.value for m in rows if m.type == "saida")
    return CashSummary(entradas=entradas, saidas=saidas, saldo=entradas - saidas)
