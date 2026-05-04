import argparse

from sqlalchemy import delete, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.appointment import Appointment
from app.models.audit import AuditLog
from app.models.cash import CashMovement
from app.models.client import Client
from app.models.employee import Employee
from app.models.product import Product
from app.models.service import Service
from app.models.support import SupportReply, SupportTicket
from app.models.tenant import Tenant
from app.models.tenant_settings import TenantSettings
from app.models.user import User


def cleanup_demo_data() -> None:
    db = SessionLocal()
    try:
        tenants = db.execute(select(Tenant)).scalars().all()
        targets = [
            tenant
            for tenant in tenants
            if tenant.code == "T-001"
            or tenant.name.startswith("Salon Teste ")
            or tenant.email == "contato@belissima.ao"
        ]

        if not targets:
            print("Nenhum tenant demo/teste encontrado.")
            return

        tenant_ids = [tenant.id for tenant in targets]
        ticket_ids = db.execute(
            select(SupportTicket.id).where(SupportTicket.tenant_id.in_(tenant_ids))
        ).scalars().all()

        if ticket_ids:
            db.execute(delete(SupportReply).where(SupportReply.ticket_id.in_(ticket_ids)))
        db.execute(delete(SupportTicket).where(SupportTicket.tenant_id.in_(tenant_ids)))
        db.execute(delete(Appointment).where(Appointment.tenant_id.in_(tenant_ids)))
        db.execute(delete(CashMovement).where(CashMovement.tenant_id.in_(tenant_ids)))
        db.execute(delete(Product).where(Product.tenant_id.in_(tenant_ids)))
        db.execute(delete(Service).where(Service.tenant_id.in_(tenant_ids)))
        db.execute(delete(Employee).where(Employee.tenant_id.in_(tenant_ids)))
        db.execute(delete(Client).where(Client.tenant_id.in_(tenant_ids)))
        db.execute(delete(AuditLog).where(AuditLog.tenant_id.in_(tenant_ids)))
        db.execute(delete(TenantSettings).where(TenantSettings.tenant_id.in_(tenant_ids)))
        db.execute(delete(User).where(User.tenant_id.in_(tenant_ids)))
        db.execute(delete(Tenant).where(Tenant.id.in_(tenant_ids)))
        db.commit()

        print("Tenants removidos:")
        for tenant in targets:
            print(f"- {tenant.name} <{tenant.email}>")
    finally:
        db.close()


def create_super_admin(email: str, password: str, name: str) -> None:
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.full_name = name
            user.password_hash = hash_password(password)
            user.role = "super_admin"
            user.tenant_id = None
            user.status = "active"
            action = "atualizada"
        else:
            user = User(
                tenant_id=None,
                full_name=name,
                email=email,
                phone="",
                password_hash=hash_password(password),
                role="super_admin",
                status="active",
            )
            db.add(user)
            action = "criada"

        db.execute(delete(User).where(User.email == "superadmin@genomni.ao", User.email != email))
        db.commit()
        print(f"Conta super admin {action}: {email}")
    finally:
        db.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Utilitários administrativos do backend.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    cleanup_parser = subparsers.add_parser("cleanup-demo-data", help="Remove dados demo/teste do banco atual.")
    cleanup_parser.set_defaults(handler=lambda args: cleanup_demo_data())

    create_parser = subparsers.add_parser("create-super-admin", help="Cria ou promove um utilizador a super admin.")
    create_parser.add_argument("--email", required=True)
    create_parser.add_argument("--password", required=True)
    create_parser.add_argument("--name", default="Manuel Gomes")
    create_parser.set_defaults(handler=lambda args: create_super_admin(args.email, args.password, args.name))

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
