from unittest.mock import AsyncMock

import pytest

from app.core.providers.tavily_search import TavilySearchError
from app.features.ai_assistant.services.web_search_agent.tool_executor import (
    WebSearchExecutionError,
    WebSearchExecutor,
)


@pytest.fixture
def provider():
    return AsyncMock()


@pytest.fixture
def executor(provider):
    return WebSearchExecutor(provider=provider)


@pytest.mark.asyncio
async def test_search_web_success(executor, provider):
    expected_result = {
        "query": "diabetes symptoms",
        "results": [
            {
                "title": "Diabetes Symptoms",
                "url": "https://example.com",
                "content": "Common symptoms include...",
                "score": 0.95,
            }
        ],
    }

    provider.search.return_value = expected_result

    result = await executor.execute(
        "search_web",
        {"query": "diabetes symptoms"},
    )

    assert result == expected_result
    provider.search.assert_awaited_once_with("diabetes symptoms")


@pytest.mark.asyncio
async def test_reject_unknown_tool(executor):
    with pytest.raises(WebSearchExecutionError):
        await executor.execute("unknown_tool", {"query": "test"})


@pytest.mark.asyncio
async def test_reject_invalid_arguments(executor):
    with pytest.raises(WebSearchExecutionError):
        await executor.execute("search_web", {"query": "test", "extra": True})


@pytest.mark.asyncio
async def test_reject_empty_query(executor):
    with pytest.raises(WebSearchExecutionError):
        await executor.execute("search_web", {"query": "   "})


@pytest.mark.asyncio
async def test_reject_long_query(executor):
    with pytest.raises(WebSearchExecutionError):
        await executor.execute("search_web", {"query": "a" * 401})


@pytest.mark.asyncio
async def test_sanitize_provider_error(executor, provider):
    provider.search.side_effect = TavilySearchError("API failure")

    with pytest.raises(WebSearchExecutionError) as exc_info:
        await executor.execute("search_web", {"query": "test"})

    assert str(exc_info.value) == "Web search is currently unavailable."