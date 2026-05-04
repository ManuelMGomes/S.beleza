from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("services"))])


@router.get("", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Service).where(Service.tenant_id == tenant_id).order_by(Service.name)).scalars().all()
    return [ServiceOut.model_validate(s, from_attributes=True) for s in rows]


@router.post("", response_model=ServiceOut)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    service = Service(tenant_id=tenant_id, **payload.model_dump())
    db.add(service)
    log_tenant_action(db, tenant_id, current_user.full_name, "Serviços", "create", "Cadastrou serviço", service.name)
    db.commit()
    db.refresh(service)
    invalidate_tenant_caches(tenant_id)
    return ServiceOut.model_validate(service, from_attributes=True)


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: str,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    service = db.scalar(select(Service).where(and_(Service.id == service_id, Service.tenant_id == tenant_id)))
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    for field, value in payload.model_dump().items():
        setattr(service, field, value)
    log_tenant_action(db, tenant_id, current_user.full_name, "Serviços", "update", "Atualizou serviço", service.name)
    db.commit()
    db.refresh(service)
    invalidate_tenant_caches(tenant_id)
    return ServiceOut.model_validate(service, from_attributes=True)


@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    service = db.scalar(select(Service).where(and_(Service.id == service_id, Service.tenant_id == tenant_id)))
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Serviços", "delete", "Removeu serviço", service.name)
    db.delete(service)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Serviço removido"}
