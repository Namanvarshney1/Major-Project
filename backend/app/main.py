"""
PrepPulse FastAPI Main Application
Entrypoint for the REST API server, lifecycle connection hooks, CORS, and route registrations.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.mongodb import db_manager
from app.db.indexes import create_db_indexes
from app.db.seed import seed_default_accounts
from app.db.health import is_atlas_uri

# Route imports
from app.api.v1.auth import router as auth_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.coach import router as coach_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.gamification import router as gamification_router
from app.api.v1.history import router as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown lifecycle events."""
    setup_logging()
    logger.info("Initializing PrepPulse API Services...")
    settings.validate_startup()
    await db_manager.connect_to_database()
    active_db = db_manager.get_database()
    if active_db is not None:
        await create_db_indexes(active_db)
        await seed_default_accounts(active_db)
    yield
    logger.info("Shutting down PrepPulse API Services...")
    await db_manager.close_database_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PrepPulse — Intelligent AI-Powered Interview Preparation & Calibration System",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 API routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(evaluations_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(coach_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(gamification_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    """Health check status endpoint returning real MongoDB and AI provider readiness."""
    is_real_db = db_manager.is_connected_to_real_db()
    return {
        "status": "healthy" if is_real_db else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if is_real_db else "mock_in_memory",
        "database_name": settings.MONGODB_DATABASE,
        "database_type": "MongoDB Atlas" if is_atlas_uri(settings.MONGODB_URI) else "Local/Mock",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "model": settings.GROQ_MODEL
    }


@app.get("/health/db", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health/db", tags=["Health"])
async def database_health_check():
    """Performs an active, live MongoDB ping test and returns diagnostics without leaking secrets."""
    from app.db.health import check_mongodb_connection
    return await check_mongodb_connection()
