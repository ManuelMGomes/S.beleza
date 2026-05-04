from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("clients"))])


@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Client).where(Client.tenant_id == tenant_id).order_by(Client.name)).scalars().all()
    return [
        ClientOut(
            id=c.id,
            name=c.name,
            phone=c.phone,
            email=c.email,
            birth_date=c.birth_date,
            notes=c.notes,
            last_visit=c.last_visit,
            total_visits=c.total_visits,
        )
        for c in rows
    ]


@router.post("", response_model=ClientOut)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    client = Client(
        tenant_id=tenant_id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email or "",
        birth_date=payload.birth_date,
        notes=payload.notes,
    )
    db.add(client)
    log_tenant_action(db, tenant_id, current_user.full_name, "Clientes", "create", "Cadastrou novo cliente", client.name)
    db.commit()
    db.refresh(client)
    invalidate_tenant_caches(tenant_id)
    return ClientOut(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        birth_date=client.birth_date,
        notes=client.notes,
        last_visit=client.last_visit,
        total_visits=client.total_visits,
    )


@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: str,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    client = db.scalar(select(Client).where(and_(Client.id == client_id, Client.tenant_id == tenant_id)))
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    client.name = payload.name
    client.phone = payload.phone
    client.email = payload.email or ""
    client.birth_date = payload.birth_date
    client.notes = payload.notes
    log_tenant_action(db, tenant_id, current_user.full_name, "Clientes", "update", "Atualizou cliente", client.name)
    db.commit()
    db.refresh(client)
    invalidate_tenant_caches(tenant_id)

    return ClientOut(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        birth_date=client.birth_date,
        notes=client.notes,
        last_visit=client.last_visit,
        total_visits=client.total_visits,
    )


@router.delete("/{client_id}")
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    client = db.scalar(select(Client).where(and_(Client.id == client_id, Client.tenant_id == tenant_id)))
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Clientes", "delete", "Removeu cliente", client.name)
    db.delete(client)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Cliente removido"}
