
import httpx
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.providers.tavily_search import (
    TavilySearchError,
    TavilySearchProvider,
)


@pytest.fixture
def provider():
    with patch(
        "app.core.providers.tavily_search.settings"
    ) as mock_settings:
        mock_settings.tavily_api_key.get_secret_value.return_value = (
            "test-api-key"
        )
        yield TavilySearchProvider()


@pytest.mark.asyncio
async def test_successful_search(provider):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Diabetes Symptoms",
                "url": "https://example.com/diabetes",
                "content": "Common symptoms include thirst and fatigue.",
                "score": 0.95,
            }
        ]
    }
    mock_response.raise_for_status.return_value = None

    with patch(
        "app.core.providers.tavily_search.httpx.AsyncClient"
    ) as mock_client:
        mock_client.return_value.__aenter__.return_value.post = (
            AsyncMock(return_value=mock_response)
        )

        result = await provider.search("diabetes symptoms")

    assert result["query"] == "diabetes symptoms"
    assert len(result["results"]) == 1
    assert result["results"][0]["title"] == "Diabetes Symptoms"


@pytest.mark.asyncio
async def test_empty_query_raises_error(provider):
    with pytest.raises(TavilySearchError):
        await provider.search("   ")


@pytest.mark.asyncio
async def test_query_too_long_raises_error(provider):
    with pytest.raises(TavilySearchError):
        await provider.search("a" * 401)


@pytest.mark.asyncio
async def test_http_error_is_handled(provider):
    mock_response = MagicMock()
    mock_response.status_code = 401

    mock_response.raise_for_status.side_effect = (
        httpx.HTTPStatusError(
            "Unauthorized",
            request=MagicMock(),
            response=mock_response,
        )
    )

    with patch(
        "app.core.providers.tavily_search.httpx.AsyncClient"
    ) as mock_client:
        mock_client.return_value.__aenter__.return_value.post = (
            AsyncMock(return_value=mock_response)
        )

        with pytest.raises(TavilySearchError):
            await provider.search("diabetes symptoms")


@pytest.mark.asyncio
async def test_connection_error_is_handled(provider):
    with patch(
        "app.core.providers.tavily_search.httpx.AsyncClient"
    ) as mock_client:
        mock_client.return_value.__aenter__.return_value.post = (
            AsyncMock(
                side_effect=httpx.ConnectError("Connection failed")
            )
        )

        with pytest.raises(TavilySearchError):
            await provider.search("diabetes symptoms")


@pytest.mark.asyncio
async def test_invalid_response_is_handled(provider):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": "invalid"
    }
    mock_response.raise_for_status.return_value = None

    with patch(
        "app.core.providers.tavily_search.httpx.AsyncClient"
    ) as mock_client:
        mock_client.return_value.__aenter__.return_value.post = (
            AsyncMock(return_value=mock_response)
        )

        with pytest.raises(TavilySearchError):
            await provider.search("diabetes symptoms")
