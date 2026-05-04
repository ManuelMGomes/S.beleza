from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("stock"))])


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name)).scalars().all()
    return [ProductOut.model_validate(p, from_attributes=True) for p in rows]


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = Product(tenant_id=tenant_id, **payload.model_dump())
    db.add(product)
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "create", "Cadastrou produto", product.name)
    db.commit()
    db.refresh(product)
    invalidate_tenant_caches(tenant_id)
    return ProductOut.model_validate(product, from_attributes=True)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = db.scalar(select(Product).where(and_(Product.id == product_id, Product.tenant_id == tenant_id)))
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "update", "Atualizou produto", product.name)
    db.commit()
    db.refresh(product)
    invalidate_tenant_caches(tenant_id)
    return ProductOut.model_validate(product, from_attributes=True)


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = db.scalar(select(Product).where(and_(Product.id == product_id, Product.tenant_id == tenant_id)))
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "delete", "Removeu produto", product.name)
    db.delete(product)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Produto removido"}
