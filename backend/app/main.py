from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.suppliers import router as suppliers_router
from app.api.purchase_requests import router as purchase_requests_router
from app.api.purchase_orders import router as purchase_orders_router
from app.api.approvals import router as approvals_router
from app.api.document_status_history import (
    router as status_history_router,
)
from app.api.inventory import router as inventory_router


from app.api.goods_receipts import router as goods_receipts_router
from app.api.catalogue import router as catalogue_router
from app.api.warehouses import router as warehouses_router
from app.api.tax_currency import (
    router as tax_currency_router,
)


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

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5175",
    "http://127.0.0.1:5175",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(suppliers_router)
app.include_router(purchase_requests_router)
app.include_router(purchase_orders_router)
app.include_router(approvals_router)
app.include_router(status_history_router)
app.include_router(goods_receipts_router)
app.include_router(catalogue_router)
app.include_router(inventory_router)
app.include_router(warehouses_router)
app.include_router(
    tax_currency_router
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