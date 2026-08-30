from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.inventory import InventoryBalanceResponse, InventoryTransactionResponse
from app.services.inventory_service import list_inventory_balances, list_inventory_transactions

router = APIRouter(prefix='/api/v1/inventory', tags=['Inventory'])

@router.get('/balances', response_model=list[InventoryBalanceResponse])
def get_inventory_balances(db: Session = Depends(get_db)) -> list[InventoryBalanceResponse]:
    return list_inventory_balances(db)

@router.get('/transactions', response_model=list[InventoryTransactionResponse])
def get_inventory_transactions(catalogue_item_id: int | None = None, db: Session = Depends(get_db)) -> list[InventoryTransactionResponse]:
    return list_inventory_transactions(db, catalogue_item_id)
