from unittest.mock import AsyncMock

import pytest

from app.features.ai_assistant.services.rag import (
    document_processing_service as processing_module,
)
from app.features.ai_assistant.services.rag.document_processing_service import (
    DocumentProcessingService,
)


@pytest.mark.asyncio
async def test_process_document(monkeypatch):
    fake_embeddings = [
        [0.1] * 1024,
        [0.2] * 1024,
    ]

    fake_provider = AsyncMock()
    fake_provider.embed_documents.return_value = fake_embeddings

    monkeypatch.setattr(
        processing_module,
        "JinaEmbeddingProvider",
        lambda: fake_provider,
    )

    service = DocumentProcessingService()

    monkeypatch.setattr(
        service.chunking_service,
        "split_text",
        lambda content: ["First chunk", "Second chunk"],
    )

    result = await service.process_document("Sample document")

    assert len(result) == 2
    assert result[0]["chunk_index"] == 0
    assert result[0]["content"] == "First chunk"
    assert result[0]["embedding"] == fake_embeddings[0]
    assert result[1]["chunk_index"] == 1
    assert result[1]["content"] == "Second chunk"

    fake_provider.embed_documents.assert_awaited_once_with(
        ["First chunk", "Second chunk"]
    )


@pytest.mark.asyncio
async def test_process_empty_document(monkeypatch):
    fake_provider = AsyncMock()

    monkeypatch.setattr(
        processing_module,
        "JinaEmbeddingProvider",
        lambda: fake_provider,
    )

    service = DocumentProcessingService()

    result = await service.process_document("   ")

    assert result == []
    fake_provider.embed_documents.assert_not_awaited()


@pytest.mark.asyncio
async def test_embedding_count_mismatch(monkeypatch):
    fake_provider = AsyncMock()
    fake_provider.embed_documents.return_value = [[0.1] * 1024]

    monkeypatch.setattr(
        processing_module,
        "JinaEmbeddingProvider",
        lambda: fake_provider,
    )

    service = DocumentProcessingService()

    monkeypatch.setattr(
        service.chunking_service,
        "split_text",
        lambda content: ["First chunk", "Second chunk"],
    )

    with pytest.raises(ValueError, match="Chunk and embedding counts do not match"):
        await service.process_document("Sample document")