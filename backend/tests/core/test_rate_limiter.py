"""Tests for the NEXORA in-memory request limiter."""

import asyncio

import pytest

from app.core.rate_limiter import (
    InMemoryRateLimiter,
    RateLimitExceededError,
)


class FakeClock:
    """Controllable clock used by rate-limiter tests."""

    def __init__(self) -> None:
        self.current_time = 0.0

    def __call__(self) -> float:
        return self.current_time

    def advance(
        self,
        seconds: float,
    ) -> None:
        self.current_time += seconds


def test_limiter_allows_requests_within_limit() -> None:
    clock = FakeClock()

    limiter = InMemoryRateLimiter(
        max_requests=2,
        window_seconds=60,
        clock=clock,
    )

    async def scenario() -> None:
        await limiter.check(
            "client-one",
        )

        await limiter.check(
            "client-one",
        )

    asyncio.run(
        scenario(),
    )


def test_limiter_blocks_request_above_limit() -> None:
    clock = FakeClock()

    limiter = InMemoryRateLimiter(
        max_requests=2,
        window_seconds=60,
        clock=clock,
    )

    async def scenario() -> None:
        await limiter.check(
            "client-one",
        )

        await limiter.check(
            "client-one",
        )

        with pytest.raises(
            RateLimitExceededError,
            match="Request limit exceeded",
        ) as captured_error:
            await limiter.check(
                "client-one",
            )

        assert (
            captured_error.value.retry_after_seconds
            == 60
        )

    asyncio.run(
        scenario(),
    )


def test_limiter_calculates_remaining_wait_time() -> None:
    clock = FakeClock()

    limiter = InMemoryRateLimiter(
        max_requests=1,
        window_seconds=60,
        clock=clock,
    )

    async def scenario() -> None:
        await limiter.check(
            "client-one",
        )

        clock.advance(
            25,
        )

        with pytest.raises(
            RateLimitExceededError,
        ) as captured_error:
            await limiter.check(
                "client-one",
            )

        assert (
            captured_error.value.retry_after_seconds
            == 35
        )

    asyncio.run(
        scenario(),
    )


def test_limiter_allows_request_after_window() -> None:
    clock = FakeClock()

    limiter = InMemoryRateLimiter(
        max_requests=1,
        window_seconds=60,
        clock=clock,
    )

    async def scenario() -> None:
        await limiter.check(
            "client-one",
        )

        clock.advance(
            60,
        )

        await limiter.check(
            "client-one",
        )

    asyncio.run(
        scenario(),
    )


def test_limiter_tracks_clients_separately() -> None:
    clock = FakeClock()

    limiter = InMemoryRateLimiter(
        max_requests=1,
        window_seconds=60,
        clock=clock,
    )

    async def scenario() -> None:
        await limiter.check(
            "client-one",
        )

        await limiter.check(
            "client-two",
        )

        with pytest.raises(
            RateLimitExceededError,
        ):
            await limiter.check(
                "client-one",
            )

    asyncio.run(
        scenario(),
    )


def test_limiter_rejects_invalid_configuration() -> None:
    with pytest.raises(
        ValueError,
        match="Maximum requests must be greater than zero",
    ):
        InMemoryRateLimiter(
            max_requests=0,
            window_seconds=60,
        )

    with pytest.raises(
        ValueError,
        match="Rate-limit window must be greater than zero",
    ):
        InMemoryRateLimiter(
            max_requests=5,
            window_seconds=0,
        )