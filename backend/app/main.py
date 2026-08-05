from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
