from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.db.base import Base
from app.db.database import engine
from app.api.v1.api import api_router

# Setup application logging
setup_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Initializing Cognitive Assistance Platform Backend...")
    # Create tables automatically for development / local SQLite if needed
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        if "caregivers" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("caregivers")]
            with engine.begin() as conn:
                if "preferred_language" not in columns:
                    conn.execute(text("ALTER TABLE caregivers ADD COLUMN preferred_language VARCHAR(16) DEFAULT 'en' NOT NULL"))
                if "font_size" not in columns:
                    conn.execute(text("ALTER TABLE caregivers ADD COLUMN font_size VARCHAR(16) DEFAULT 'normal' NOT NULL"))
    except Exception as e:
        logger.warning(f"Caregiver preference column migration note: {e}")
    logger.info("Database schema initialized.")
    yield
    # Shutdown logic
    logger.info("Shutting down backend services.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## AI-Powered Cognitive Assistance & Elderly-Care Backend API
    
    Modular, explainable, offline-first compatible, and secure backend platform designed for elderly users (including remote/low-connectivity regions) and caregivers.
    
    ### Key Features:
    * **Adaptive Cognitive Loop**: Telemetry ingestion, metrics, patient-specific baselines, sliding-window trends, explainable difficulty engine, intelligent recommendations, and caregiver insights.
    * **Non-Diagnostic**: Produces activity-performance insights only; no clinical/medical diagnoses.
    * **Offline-First Synchronization**: Batch push/pull with idempotency and conflict resolution for Flutter SQLite clients.
    * **Security & Tenancy**: JWT auth, Argon2/Bcrypt hashing, and strict caregiver-patient RBAC.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred. Please contact support."},
    )


# Health Check
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint for container orchestrators and load balancers."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
def root():
    """Root redirect / index landing."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for OpenAPI documentation.",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


# Mount API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
