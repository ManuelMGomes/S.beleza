from sqlalchemy.orm import Session

from app.models.audit import AuditLog

DELIMITER = "||"


def _clean(value: str) -> str:
    return (value or "").replace(DELIMITER, " ").strip()


def encode_action(area: str, event_type: str, action: str, target: str = "") -> str:
    return DELIMITER.join([
        _clean(area),
        _clean(event_type),
        _clean(action),
        _clean(target),
    ])


def infer_area(action: str) -> str:
    lowered = action.lower()
    if any(term in lowered for term in ["agendamento", "agenda"]):
        return "Agenda"
    if any(term in lowered for term in ["cliente"]):
        return "Clientes"
    if any(term in lowered for term in ["funcionário", "funcionario", "equipe"]):
        return "Funcionários"
    if any(term in lowered for term in ["serviço", "servico"]):
        return "Serviços"
    if any(term in lowered for term in ["produto", "estoque", "stock"]):
        return "Estoque"
    if any(term in lowered for term in ["caixa", "movimentação", "movimentacao"]):
        return "Caixa"
    if any(term in lowered for term in ["configuração", "configuracao", "empresa", "suporte"]):
        return "Configurações"
    return "Sistema"


def infer_type(action: str) -> str:
    lowered = action.lower()
    if any(term in lowered for term in ["removeu", "removido", "apagou", "eliminou"]):
        return "delete"
    if any(term in lowered for term in ["criou", "cadastrou", "registrou", "abriu"]):
        return "create"
    return "update"


def parse_action(raw_action: str) -> dict[str, str]:
    parts = raw_action.split(DELIMITER)
    if len(parts) == 4:
        area, event_type, action, target = parts
        return {
            "area": area or "Sistema",
            "type": event_type or "update",
            "action": action or raw_action,
            "target": target or "",
        }

    return {
        "area": infer_area(raw_action),
        "type": infer_type(raw_action),
        "action": raw_action,
        "target": "",
    }


def log_tenant_action(
    db: Session,
    tenant_id: str,
    user_name: str,
    area: str,
    event_type: str,
    action: str,
    target: str = "",
    ip: str = "—",
) -> None:
    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_name=_clean(user_name) or "Sistema",
            action=encode_action(area, event_type, action, target),
            ip=ip,
        )
    )
