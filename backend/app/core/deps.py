from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.services.permissions import get_effective_permissions
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id)
    if not user:
        raise credentials_exception
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilizador inativo",
        )
    return user


def require_super_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Apenas super admin")
    return current_user


def get_tenant_id(current_user: Annotated[User, Depends(get_current_user)]) -> str:
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Utilizador sem tenant associado")
    return current_user.tenant_id


def require_tenant_permission(permission: str):
    def dependency(
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> User:
        if current_user.role in {"super_admin", "admin"}:
            return current_user

        permissions = get_effective_permissions(db, current_user)
        if not permissions.get(permission, False):
            raise HTTPException(status_code=403, detail="Sem permissão para aceder a este módulo")
        return current_user

    return dependency
