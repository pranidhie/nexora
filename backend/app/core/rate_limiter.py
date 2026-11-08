"""Small in-memory request limiter for public demo endpoints."""

from __future__ import annotations

import asyncio

from collections import deque
from collections.abc import Callable
from math import ceil
from time import monotonic


class RateLimitExceededError(RuntimeError):
    """Raised when a client exceeds the configured request limit."""

    def __init__(
        self,
        retry_after_seconds: int,
    ) -> None:
        self.retry_after_seconds = (
            retry_after_seconds
        )

        super().__init__(
            "Request limit exceeded. "
            f"Retry after {retry_after_seconds} seconds."
        )


class InMemoryRateLimiter:
    """
    Limit requests within a rolling time window.

    This implementation is suitable for the single-instance
    NEXORA public portfolio demonstration.
    """

    def __init__(
        self,
        *,
        max_requests: int,
        window_seconds: float,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if max_requests <= 0:
            raise ValueError(
                "Maximum requests must be greater than zero."
            )

        if window_seconds <= 0:
            raise ValueError(
                "Rate-limit window must be greater than zero."
            )

        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._clock = clock

        self._request_times: dict[
            str,
            deque[float],
        ] = {}

        self._lock = asyncio.Lock()

    async def check(
        self,
        client_key: str,
    ) -> None:
        """Record an allowed request or raise a rate-limit error."""

        resolved_key = (
            client_key.strip()
            or "anonymous"
        )

        async with self._lock:
            current_time = self._clock()

            cutoff_time = (
                current_time
                - self._window_seconds
            )

            self._remove_expired_requests(
                cutoff_time,
            )

            request_times = (
                self._request_times.setdefault(
                    resolved_key,
                    deque(),
                )
            )

            if (
                len(request_times)
                >= self._max_requests
            ):
                oldest_request = request_times[0]

                remaining_seconds = ceil(
                    self._window_seconds
                    - (
                        current_time
                        - oldest_request
                    )
                )

                raise RateLimitExceededError(
                    retry_after_seconds=max(
                        1,
                        remaining_seconds,
                    ),
                )

            request_times.append(
                current_time,
            )

    def _remove_expired_requests(
        self,
        cutoff_time: float,
    ) -> None:
        """Remove expired request records and empty client keys."""

        empty_keys: list[str] = []

        for (
            client_key,
            request_times,
        ) in self._request_times.items():
            while (
                request_times
                and request_times[0]
                <= cutoff_time
            ):
                request_times.popleft()

            if not request_times:
                empty_keys.append(
                    client_key,
                )

        for client_key in empty_keys:
            del self._request_times[
                client_key
            ]