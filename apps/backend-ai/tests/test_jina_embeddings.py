from unittest.mock import MagicMock, patch

import pytest

from app.core.providers.jina_embeddings import JinaEmbeddingProvider


@pytest.fixture
def provider():
    with patch(
        "app.core.providers.jina_embeddings.settings.jina_api_key"
    ) as api_key:
        api_key.get_secret_value.return_value = "test-api-key"
        yield JinaEmbeddingProvider()


@pytest.mark.asyncio
async def test_embed_documents(provider):
    fake_vector = [0.1] * 1024

    with patch(
        "app.core.providers.jina_embeddings.httpx.AsyncClient"
    ) as client_class:

        client = client_class.return_value.__aenter__.return_value

        response = MagicMock()
        response.json.return_value = {
            "data": [
                {
                    "index": 0,
                    "embedding": fake_vector,
                }
            ]
        }

        client.post.return_value = response

        result = await provider.embed_documents(
            ["Synthetic medical article"]
        )

        assert len(result) == 1
        assert len(result[0]) == 1024


@pytest.mark.asyncio
async def test_embed_query(provider):
    fake_vector = [0.2] * 1024

    with patch(
        "app.core.providers.jina_embeddings.httpx.AsyncClient"
    ) as client_class:

        client = client_class.return_value.__aenter__.return_value

        response = MagicMock()
        response.json.return_value = {
            "data": [
                {
                    "index": 0,
                    "embedding": fake_vector,
                }
            ]
        }

        client.post.return_value = response

        result = await provider.embed_query(
            "What are diabetes symptoms?"
        )

        assert isinstance(result, list)
        assert len(result) == 1024
