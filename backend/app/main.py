from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router


app = FastAPI(
    title="NEXORA API",
    description=(
        "REST API for the NEXORA AI-powered ERP and "
        "Quality Engineering platform."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/", tags=["System"])
async def root() -> dict[str, str]:
    """Return basic API information."""

    return {
        "application": "NEXORA",
        "message": "NEXORA API is running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """Return the application health status."""

    return {
        "status": "healthy",
        "service": "nexora-api",
    }