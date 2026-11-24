
from unittest.mock import AsyncMock, MagicMock
from types import SimpleNamespace

import httpx
import pytest
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)

from app.core.providers.exceptions import (
    ProviderAuthenticationError,
    ProviderConnectionError,
    ProviderRateLimitError,
    ProviderTimeoutError,
)
from app.core.providers.openrouter import OpenRouterProvider

from openai import APIStatusError

from app.core.providers.exceptions import (
    ProviderResponseError,
    ProviderUnavailableError,
)


@pytest.fixture
def provider():
    instance = OpenRouterProvider()
    instance.client.chat.completions.create = AsyncMock()
    return instance


@pytest.fixture
def messages():
    from app.core.providers.base import ProviderMessage

    return [
        ProviderMessage(
            role="user",
            content="Explain medical dashboards.",
        )
    ]




@pytest.mark.anyio
async def test_authentication_error(provider, messages):
    provider.client.chat.completions.create.side_effect = AuthenticationError(
        message="Unauthorized",
        response=httpx.Response(
            status_code=401,
            request=httpx.Request("POST", "https://openrouter.ai/api/v1"),
        ),
        body=None,
    )

    with pytest.raises(ProviderAuthenticationError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_rate_limit_error(provider, messages):
    provider.client.chat.completions.create.side_effect = RateLimitError(
        message="Rate limit exceeded",
        response=httpx.Response(
            status_code=429,
            request=httpx.Request("POST", "https://openrouter.ai/api/v1"),
        ),
        body=None,
    )

    with pytest.raises(ProviderRateLimitError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_timeout_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APITimeoutError(
        request=httpx.Request(
            "POST",
            "https://openrouter.ai/api/v1",
        )
    )

    with pytest.raises(ProviderTimeoutError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_connection_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APIConnectionError(
        request=httpx.Request(
            "POST",
            "https://openrouter.ai/api/v1",
        )
    )

    with pytest.raises(ProviderConnectionError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_provider_unavailable_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APIStatusError(
        message="Internal Server Error",
        response=httpx.Response(
            status_code=503,
            request=httpx.Request(
                "POST",
                "https://openrouter.ai/api/v1",
            ),
        ),
        body=None,
    )

    with pytest.raises(ProviderUnavailableError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_invalid_provider_response(provider, messages):
    response = MagicMock()
    response.choices = []

    provider.client.chat.completions.create.return_value = response

    with pytest.raises(ProviderResponseError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_empty_provider_response(provider, messages):
    response = MagicMock()
    response.choices = [MagicMock()]
    response.choices[0].message.content = ""

    provider.client.chat.completions.create.return_value = response

    with pytest.raises(ProviderResponseError):
        await provider.generate(messages, "test-model")


