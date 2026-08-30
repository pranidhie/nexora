from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class InventoryBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    inventory_balance_id: int
    catalogue_item_id: int
    unit_of_measure: str
    on_hand_quantity: Decimal
    available_quantity: Decimal
    quarantine_quantity: Decimal
    last_transaction_at: datetime | None
    created_at: datetime
    updated_at: datetime

class InventoryTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    inventory_transaction_id: int
    catalogue_item_id: int
    transaction_type: str
    quantity: Decimal
    unit_of_measure: str
    source_document_type: str
    source_document_id: int
    source_line_id: int
    reference_number: str | None
    notes: str | None
    created_by_user_id: int
    created_at: datetime
