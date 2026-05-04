from app.core.redis_client import cache_delete_pattern


def invalidate_tenant_caches(tenant_id: str) -> None:
    cache_delete_pattern(f"dashboard:overview:{tenant_id}")
    cache_delete_pattern(f"financial:summary:{tenant_id}")


def invalidate_super_admin_caches() -> None:
    cache_delete_pattern("superadmin:stats")
