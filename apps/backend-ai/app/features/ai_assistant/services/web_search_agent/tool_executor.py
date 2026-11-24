from typing import Any

from app.core.providers.tavily_search import (
    TavilySearchError,
    TavilySearchProvider,
)


class WebSearchExecutionError(Exception):
    """Raised when web search tool execution fails."""


class WebSearchExecutor:
    ALLOWED_TOOLS = {"search_web"}

    def __init__(self, provider: TavilySearchProvider):
        self.provider = provider

    async def execute(
        self,
        name: str,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:
        if name not in self.ALLOWED_TOOLS:
            raise WebSearchExecutionError("Unknown web search tool.")

        if not isinstance(arguments, dict):
            raise WebSearchExecutionError("Invalid tool arguments.")

        if set(arguments.keys()) != {"query"}:
            raise WebSearchExecutionError("Invalid tool arguments.")

        query = arguments.get("query")

        if not isinstance(query, str):
            raise WebSearchExecutionError("Search query must be a string.")

        query = query.strip()

        if not query or len(query) > 400:
            raise WebSearchExecutionError("Invalid search query.")

        try:
            return await self.provider.search(query)
        except TavilySearchError as exc:
            raise WebSearchExecutionError(
                "Web search is currently unavailable."
            ) from exc
