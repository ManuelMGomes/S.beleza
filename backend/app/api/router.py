from fastapi import APIRouter

from app.api.routes import (
    appointments,
    auth,
    cashier,
    clients,
    dashboard,
    employees,
    financial,
    products,
    services,
    settings,
    super_admin,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(financial.router, prefix="/financial", tags=["financial"])
api_router.include_router(cashier.router, prefix="/cashier", tags=["cashier"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])
