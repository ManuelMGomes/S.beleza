from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.redis_client import close_redis, init_redis
from app.db.base import Base
from app.db.init_db import seed_initial_data
from app.db.session import SessionLocal, engine
from app import models  # noqa: F401

settings = get_settings()

app = FastAPI(title=settings.project_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    try:
        init_redis()
    except Exception:
        # Redis is optional at startup; API can still run without cache.
        pass
    with SessionLocal() as db:
        seed_initial_data(db)


@app.on_event("shutdown")
def shutdown() -> None:
    close_redis()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.project_name}


app.include_router(api_router, prefix=settings.api_v1_prefix)
