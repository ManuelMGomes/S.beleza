from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("employees"))])


def _requires_account(employee_type: str) -> bool:
    return employee_type in {"gerente", "recepcionista"}


def _user_role(employee_type: str) -> str:
    return employee_type if employee_type in {"gerente", "recepcionista"} else "admin"


@router.get("", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Employee).where(Employee.tenant_id == tenant_id).order_by(Employee.name)).scalars().all()
    return [
        EmployeeOut(
            id=e.id,
            name=e.name,
            role=e.role,
            type=e.type,
            phone=e.phone,
            commission=e.commission,
            salary=e.salary,
            status=e.status,
            email=e.email,
        )
        for e in rows
    ]


@router.post("", response_model=EmployeeOut)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    if _requires_account(payload.type):
        if not payload.email:
            raise HTTPException(status_code=400, detail="E-mail é obrigatório para este tipo de funcionário")
        if not payload.password or len(payload.password) < 6:
            raise HTTPException(status_code=400, detail="Senha com pelo menos 6 caracteres é obrigatória para este tipo de funcionário")

        user_exists = db.scalar(select(User).where(User.email == payload.email))
        if user_exists:
            raise HTTPException(status_code=400, detail="Já existe um utilizador com este e-mail")

    employee = Employee(
        tenant_id=tenant_id,
        name=payload.name,
        role=payload.role,
        type=payload.type,
        phone=payload.phone,
        commission=payload.commission,
        salary=payload.salary,
        status=payload.status,
        email=payload.email or "",
    )
    db.add(employee)

    if _requires_account(payload.type):
        db.add(
            User(
                tenant_id=tenant_id,
                full_name=payload.name,
                email=payload.email or "",
                phone=payload.phone,
                password_hash=hash_password(payload.password or ""),
                role=_user_role(payload.type),
                status=payload.status,
            )
        )

    log_tenant_action(db, tenant_id, current_user.full_name, "Funcionários", "create", "Cadastrou funcionário", employee.name)
    db.commit()
    db.refresh(employee)
    invalidate_tenant_caches(tenant_id)
    return EmployeeOut(**{
        "id": employee.id,
        "name": employee.name,
        "role": employee.role,
        "type": employee.type,
        "phone": employee.phone,
        "commission": employee.commission,
        "salary": employee.salary,
        "status": employee.status,
        "email": employee.email,
    })


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    employee = db.scalar(select(Employee).where(and_(Employee.id == employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    existing_user = None
    if employee.email:
        existing_user = db.scalar(select(User).where(and_(User.tenant_id == tenant_id, User.email == employee.email)))

    if _requires_account(payload.type):
        if not payload.email:
            raise HTTPException(status_code=400, detail="E-mail é obrigatório para este tipo de funcionário")

        conflicting_user = db.scalar(select(User).where(User.email == payload.email))
        if conflicting_user and (not existing_user or conflicting_user.id != existing_user.id):
            raise HTTPException(status_code=400, detail="Já existe um utilizador com este e-mail")

        if not existing_user and (not payload.password or len(payload.password) < 6):
            raise HTTPException(status_code=400, detail="Defina uma senha com pelo menos 6 caracteres para criar a conta de acesso")

        if existing_user:
            existing_user.full_name = payload.name
            existing_user.email = payload.email or ""
            existing_user.phone = payload.phone
            existing_user.role = _user_role(payload.type)
            existing_user.status = payload.status
            if payload.password:
                existing_user.password_hash = hash_password(payload.password)
        else:
            db.add(
                User(
                    tenant_id=tenant_id,
                    full_name=payload.name,
                    email=payload.email or "",
                    phone=payload.phone,
                    password_hash=hash_password(payload.password or ""),
                    role=_user_role(payload.type),
                    status=payload.status,
                )
            )
    elif existing_user:
        db.delete(existing_user)
        payload.email = None

    for field, value in payload.model_dump().items():
        setattr(employee, field, value if value is not None else "")

    log_tenant_action(db, tenant_id, current_user.full_name, "Funcionários", "update", "Atualizou funcionário", employee.name)
    db.commit()
    db.refresh(employee)
    invalidate_tenant_caches(tenant_id)
    return EmployeeOut(
        id=employee.id,
        name=employee.name,
        role=employee.role,
        type=employee.type,
        phone=employee.phone,
        commission=employee.commission,
        salary=employee.salary,
        status=employee.status,
        email=employee.email,
    )


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    employee = db.scalar(select(Employee).where(and_(Employee.id == employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    if employee.email:
        linked_user = db.scalar(select(User).where(and_(User.tenant_id == tenant_id, User.email == employee.email)))
        if linked_user:
            db.delete(linked_user)

    log_tenant_action(db, tenant_id, current_user.full_name, "Funcionários", "delete", "Removeu funcionário", employee.name)
    db.delete(employee)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Funcionário removido"}
