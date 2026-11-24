from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)


ARTICLE_ID = UUID("11111111-1111-4111-8111-111111111111")


@pytest.fixture
def dependencies():
    article_repository = MagicMock()
    chunk_repository = MagicMock()
    document_processor = MagicMock()
    ingestion_repository = MagicMock()

    service = KnowledgeIngestionService(
        article_repository=article_repository,
        chunk_repository=chunk_repository,
        ingestion_repository=ingestion_repository,
        document_processor=document_processor,
    )

    return service, article_repository, chunk_repository, document_processor


@pytest.mark.asyncio
async def test_ingest_article_success(dependencies):
    service, article_repo, chunk_repo, processor = dependencies

    article_repo.get_published_article.return_value = {
        "id": str(ARTICLE_ID),
        "title": "Diabetes Overview",
        "content": "Synthetic diabetes education content.",
        "status": "Published",
    }

    processor.process_document = AsyncMock(
        return_value=[
            {
                "chunk_index": 0,
                "content": "First chunk",
                "embedding": [0.1] * 1024,
            },
            {
                "chunk_index": 1,
                "content": "Second chunk",
                "embedding": [0.2] * 1024,
            },
        ]
    )

    result = await service.ingest_article(ARTICLE_ID)

    assert result == {
        "article_id": str(ARTICLE_ID),
        "title": "Diabetes Overview",
        "chunks_created": 2,
        "status": "indexed",
    }

    article_repo.get_published_article.assert_called_once_with(ARTICLE_ID)

    processor.process_document.assert_awaited_once_with(
        "Synthetic diabetes education content."
    )

    chunk_repo.replace_article_chunks.assert_called_once_with(
        article_id=ARTICLE_ID,
        chunks=processor.process_document.return_value,
    )


@pytest.mark.asyncio
async def test_ingest_article_not_found(dependencies):
    service, article_repo, chunk_repo, processor = dependencies

    article_repo.get_published_article.return_value = None

    with pytest.raises(
        ValueError,
        match="Published knowledge article not found.",
    ):
        await service.ingest_article(ARTICLE_ID)

    processor.process_document.assert_not_called()
    chunk_repo.replace_article_chunks.assert_not_called()


@pytest.mark.asyncio
async def test_ingest_article_empty_chunks(dependencies):
    service, article_repo, chunk_repo, processor = dependencies

    article_repo.get_published_article.return_value = {
        "id": str(ARTICLE_ID),
        "title": "Empty Article",
        "content": "Some content",
        "status": "Published",
    }

    processor.process_document = AsyncMock(return_value=[])

    with pytest.raises(
        ValueError,
        match="Article content produced no chunks.",
    ):
        await service.ingest_article(ARTICLE_ID)

    chunk_repo.replace_article_chunks.assert_not_called()


@pytest.mark.asyncio
async def test_ingest_article_embedding_failure(dependencies):
    service, article_repo, chunk_repo, processor = dependencies

    article_repo.get_published_article.return_value = {
        "id": str(ARTICLE_ID),
        "title": "Diabetes Overview",
        "content": "Synthetic content",
        "status": "Published",
    }

    processor.process_document = AsyncMock(
        side_effect=RuntimeError("Embedding provider unavailable.")
    )

    with pytest.raises(
        RuntimeError,
        match="Embedding provider unavailable.",
    ):
        await service.ingest_article(ARTICLE_ID)

    chunk_repo.replace_article_chunks.assert_not_called()
