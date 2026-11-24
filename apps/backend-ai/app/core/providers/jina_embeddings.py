from typing import Literal

import httpx

from app.core.config import settings


class JinaEmbeddingProvider:
    API_URL = "https://api.jina.ai/v1/embeddings"
    MODEL = "jina-embeddings-v5-text-small"
    DIMENSIONS = 1024

    def __init__(self):
        if not settings.jina_api_key:
            raise ValueError("Jina API key is not configured.")

        self.api_key = settings.jina_api_key.get_secret_value()

    async def _embed(
        self,
        texts: list[str],
        task: Literal["retrieval.query", "retrieval.passage"],
    ) -> list[list[float]]:

        if not texts:
            return []

        payload = {
            "model": self.MODEL,
            "input": texts,
            "task": task,
            "dimensions": self.DIMENSIONS,
            "normalized": True,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.API_URL,
                json=payload,
                headers=headers,
            )

            response.raise_for_status()

        data = response.json()["data"]
        data.sort(key=lambda item: item["index"])

        embeddings = [
            item["embedding"]
            for item in data
        ]

        if len(embeddings) != len(texts):
            raise ValueError("Unexpected number of embeddings returned.")

        if any(len(vector) != self.DIMENSIONS for vector in embeddings):
            raise ValueError("Unexpected embedding dimensions.")

        return embeddings

    async def embed_documents(
        self,
        texts: list[str],
    ) -> list[list[float]]:

        return await self._embed(
            texts,
            task="retrieval.passage",
        )

    async def embed_query(
        self,
        text: str,
    ) -> list[float]:

        embeddings = await self._embed(
            [text],
            task="retrieval.query",
        )

        return embeddings[0]