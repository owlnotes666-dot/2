
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class TavilySearchError(Exception):
    """Raised when Tavily search fails."""


class TavilySearchProvider:
    API_URL = "https://api.tavily.com/search"

    def __init__(self):
        if settings.tavily_api_key is None:
            raise TavilySearchError("Tavily API key is not configured.")

        self.api_key = settings.tavily_api_key.get_secret_value()

    async def search(self, query: str) -> dict[str, Any]:
        query = query.strip()

        if not query:
            raise TavilySearchError("Search query cannot be empty.")

        if len(query) > 400:
            raise TavilySearchError("Search query is too long.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "query": query,
            "search_depth": "basic",
            "max_results": 5,
            "include_answer": False,
            "include_raw_content": False,
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    self.API_URL,
                    headers=headers,
                    json=payload,
                )

                response.raise_for_status()
                data = response.json()

        except httpx.HTTPStatusError as exc:
            logger.error(
                "Tavily API returned HTTP %s",
                exc.response.status_code,
            )
            raise TavilySearchError(
                "Tavily search request failed."
            ) from exc

        except (httpx.RequestError, ValueError) as exc:
            logger.error("Tavily API request failed.")
            raise TavilySearchError(
                "Unable to connect to Tavily."
            ) from exc

        results = data.get("results", [])

        if not isinstance(results, list):
            raise TavilySearchError("Invalid Tavily response.")

        normalized_results = []

        for item in results[:5]:
            if not isinstance(item, dict):
                continue

            normalized_results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0.0),
            })

        return {
            "query": query,
            "results": normalized_results,
        }
