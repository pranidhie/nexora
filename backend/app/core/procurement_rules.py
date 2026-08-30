from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Iterable

from fastapi import HTTPException, status


# ============================================================
# NEXORA PROCUREMENT — PHASE 1 BUSINESS RULES
# ============================================================

PO_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "DRAFT": {
        "PENDING_APPROVAL",
        "CANCELLED",
    },
    "PENDING_APPROVAL": {
        "APPROVED",
        "REJECTED",
        "DRAFT",
        "CANCELLED",
    },
    "APPROVED": {
        "PENDING_APPROVAL",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
    },
    "REJECTED": {
        "DRAFT",
        "CANCELLED",
    },
    "PARTIALLY_RECEIVED": {
        "RECEIVED",
    },
    "RECEIVED": set(),
    "CANCELLED": set(),
}


RECEIVABLE_PO_STATUSES = {
    "APPROVED",
    "PARTIALLY_RECEIVED",
}


LOCKED_PO_STATUSES = {
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
}


VALID_PR_PRIORITIES = {
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
}


def bad_request(
    detail: str,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    )


def conflict(
    detail: str,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail,
    )


def require_non_blank(
    value: str | None,
    field_name: str,
) -> str:
    cleaned = (
        value.strip()
        if value is not None
        else ""
    )

    if not cleaned:
        raise bad_request(
            f"{field_name} is required.",
        )

    return cleaned


def require_positive(
    value: Decimal | float | int,
    field_name: str,
) -> Decimal:
    decimal_value = Decimal(
        str(value),
    )

    if decimal_value <= 0:
        raise bad_request(
            f"{field_name} must be greater than zero.",
        )

    return decimal_value


def require_non_negative(
    value: Decimal | float | int,
    field_name: str,
) -> Decimal:
    decimal_value = Decimal(
        str(value),
    )

    if decimal_value < 0:
        raise bad_request(
            f"{field_name} cannot be negative.",
        )

    return decimal_value


def validate_effective_dates(
    effective_from: date,
    effective_to: date | None,
) -> None:
    if (
        effective_to is not None
        and effective_to < effective_from
    ):
        raise bad_request(
            "Effective To date cannot be earlier than Effective From date.",
        )


def validate_po_status_transition(
    current_status: str,
    new_status: str,
) -> None:
    current = current_status.strip().upper()
    target = new_status.strip().upper()

    if current == target:
        return

    allowed = PO_STATUS_TRANSITIONS.get(
        current,
    )

    if allowed is None:
        raise bad_request(
            f"Unknown purchase order status: {current}.",
        )

    if target not in allowed:
        raise conflict(
            f"Purchase order status cannot change from "
            f"{current} to {target}.",
        )


def require_rejection_comment(
    decision: str,
    comments: str | None,
) -> None:
    if (
        decision.strip().upper()
        == "REJECTED"
        and not (
            comments
            and comments.strip()
        )
    ):
        raise bad_request(
            "A rejection comment is required.",
        )


def validate_received_quantities(
    ordered_quantity: Decimal | float | int,
    received_quantity: Decimal | float | int,
    rejected_quantity: Decimal | float | int,
) -> None:
    ordered = require_positive(
        ordered_quantity,
        "Ordered quantity",
    )

    received = require_non_negative(
        received_quantity,
        "Received quantity",
    )

    rejected = require_non_negative(
        rejected_quantity,
        "Rejected quantity",
    )

    if (
        received + rejected
        > ordered
    ):
        raise bad_request(
            "Received quantity plus rejected quantity "
            "cannot exceed ordered quantity.",
        )


def ensure_allowed_value(
    value: str,
    allowed: Iterable[str],
    field_name: str,
) -> str:
    normalized = value.strip().upper()
    allowed_set = {
        item.upper()
        for item in allowed
    }

    if normalized not in allowed_set:
        raise bad_request(
            f"Invalid {field_name}: {value}.",
        )

    return normalized
