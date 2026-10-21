from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.core.security import decode_access_token


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict[str, Any]:
    """
    Validate the bearer token and return its decoded payload.
    """

    authentication_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    # Reject requests without an Authorization header.
    if credentials is None:
        raise authentication_error

    # Confirm that the request uses the Bearer scheme.
    if credentials.scheme.lower() != "bearer":
        raise authentication_error

    # Decode and validate the JWT.
    token_payload = decode_access_token(
        credentials.credentials
    )

    # Reject invalid, corrupted, or expired tokens.
    if token_payload is None:
        raise authentication_error

    # The login endpoint stores the user ID in "sub".
    user_id = token_payload.get("sub")

    if not user_id:
        raise authentication_error

    return token_payload