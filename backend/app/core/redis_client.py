import json
from datetime import date, datetime
from typing import Any

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import get_settings

_redis: Redis | None = None


def _json_default(value: Any):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def init_redis() -> None:
    global _redis
    settings = get_settings()
    _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    _redis.ping()


def close_redis() -> None:
    global _redis
    if _redis is not None:
        _redis.close()
    _redis = None


def redis_available() -> bool:
    return _redis is not None


def cache_get_json(key: str) -> Any | None:
    if _redis is None:
        return None
    try:
        raw = _redis.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (RedisError, json.JSONDecodeError):
        return None


def cache_set_json(key: str, payload: Any, ttl_seconds: int | None = None) -> None:
    if _redis is None:
        return
    try:
        data = json.dumps(payload, default=_json_default)
        if ttl_seconds and ttl_seconds > 0:
            _redis.setex(key, ttl_seconds, data)
        else:
            _redis.set(key, data)
    except (RedisError, TypeError, ValueError):
        return


def cache_delete_pattern(pattern: str) -> None:
    if _redis is None:
        return
    try:
        keys = list(_redis.scan_iter(match=pattern))
        if keys:
            _redis.delete(*keys)
    except RedisError:
        return


def cache_delete_keys(*keys: str) -> None:
    if _redis is None:
        return
    try:
        filtered = [k for k in keys if k]
        if filtered:
            _redis.delete(*filtered)
    except RedisError:
        return
