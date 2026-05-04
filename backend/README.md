# GenOmni Salon Backend (FastAPI + PostgreSQL)

API completa para integração com o frontend do sistema de salão.

## Stack
- FastAPI
- SQLAlchemy 2
- PostgreSQL
- JWT (auth)

## Subir com Docker
Na raiz do projeto:

```bash
docker compose up --build -d backend db redis nginx
```

## Health
- `GET /health`
- `GET /api/v1/auth/me` (com token)

## Credenciais seed
- Admin de tenant: `admin@genomni.ao` / `admin12345`
- Super admin: `superadmin@genomni.ao` / `superadmin123`

## Principais endpoints
- `POST /api/v1/auth/register-tenant`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

- `GET/POST/PUT/DELETE /api/v1/clients`
- `GET/POST/PUT/DELETE /api/v1/employees`
- `GET/POST/PUT/DELETE /api/v1/services`
- `GET/POST/PUT/DELETE /api/v1/products`
- `GET/POST/PUT/DELETE /api/v1/appointments`
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/financial/summary`
- `GET /api/v1/financial/commissions`
- `GET/POST /api/v1/cashier/movements`
- `GET /api/v1/cashier/summary`

Super admin (token super admin):
- `GET /api/v1/super-admin/tenants`
- `PATCH /api/v1/super-admin/tenants/{tenant_id}/status`
- `GET /api/v1/super-admin/stats`
- `GET /api/v1/super-admin/logs`
- `GET /api/v1/super-admin/support/tickets`
- `POST /api/v1/super-admin/support/tickets/{tenant_id}`
- `PATCH /api/v1/super-admin/support/tickets/{ticket_id}`
- `POST /api/v1/super-admin/support/tickets/{ticket_id}/reply`
- `GET /api/v1/super-admin/support/tickets/{ticket_id}/replies`
