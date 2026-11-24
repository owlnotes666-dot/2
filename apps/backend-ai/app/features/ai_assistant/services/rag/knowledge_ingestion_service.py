import hashlib
import logging
from uuid import UUID

from app.features.ai_assistant.repositories.knowledge_article_repository import (
    KnowledgeArticleRepository,
)
from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)
from app.features.ai_assistant.repositories.knowledge_ingestion_repository import (
    KnowledgeIngestionRepository,
)
from app.features.ai_assistant.services.rag.document_processing_service import (
    DocumentProcessingService,
)

logger = logging.getLogger(__name__)


class KnowledgeIngestionService:
    def __init__(
        self,
        article_repository: KnowledgeArticleRepository,
        chunk_repository: KnowledgeChunkRepository,
        ingestion_repository: KnowledgeIngestionRepository,
        document_processor: DocumentProcessingService,
    ):
        self.article_repository = article_repository
        self.chunk_repository = chunk_repository
        self.ingestion_repository = ingestion_repository
        self.document_processor = document_processor

    @staticmethod
    def _calculate_content_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    async def _process_article(self, article: dict) -> dict:
        article_id = UUID(str(article["id"]))
        content_hash = self._calculate_content_hash(article["content"])

        chunks = await self.document_processor.process_document(
            article["content"]
        )

        if not chunks:
            raise ValueError("Article content produced no chunks.")

        self.chunk_repository.replace_article_chunks(
            article_id=article_id,
            chunks=chunks,
        )

        self.ingestion_repository.upsert_ingestion(
            article_id=article_id,
            content_hash=content_hash,
            chunk_count=len(chunks),
        )

        return {
            "article_id": str(article_id),
            "title": article["title"],
            "chunks_created": len(chunks),
            "status": "indexed",
        }

    async def ingest_article(self, article_id: UUID) -> dict:
        article = self.article_repository.get_published_article(article_id)

        if article is None:
            raise ValueError("Published knowledge article not found.")

        return await self._process_article(article)

    def remove_article_index(self, article_id: UUID) -> dict:
        self.chunk_repository.delete_article_chunks(article_id)
        self.ingestion_repository.delete_ingestion(article_id)

        logger.info(
            "Knowledge article index removed: %s",
            article_id,
        )

        return {
            "article_id": str(article_id),
            "status": "removed",
        }

    async def ingest_all_articles(self) -> dict:
        articles = self.article_repository.get_all_published_articles()

        indexed = []
        unchanged = []
        failed = []
        removed = []

        published_ids = {
            UUID(str(article["id"]))
            for article in articles
        }

        # Process published articles.
        for article in articles:
            article_id = UUID(str(article["id"]))

            try:
                content_hash = self._calculate_content_hash(
                    article["content"]
                )

                existing = self.ingestion_repository.get_ingestion(
                    article_id
                )

                if (
                    existing is not None
                    and existing["content_hash"] == content_hash
                ):
                    unchanged.append({
                        "article_id": str(article_id),
                        "title": article["title"],
                        "status": "unchanged",
                    })
                    continue

                result = await self._process_article(article)
                indexed.append(result)

            except Exception:
                logger.exception(
                    "Knowledge article ingestion failed: %s",
                    article_id,
                )

                failed.append({
                    "article_id": str(article_id),
                    "title": article.get("title"),
                    "status": "failed",
                })

        # Remove chunks and ingestion records for non-published articles.
        try:
            all_article_ids = self.article_repository.get_all_article_ids()

            for article_id in all_article_ids:
                if article_id in published_ids:
                    continue

                try:
                    self.chunk_repository.delete_article_chunks(article_id)
                    self.ingestion_repository.delete_ingestion(article_id)

                    removed.append(str(article_id))

                except Exception:
                    logger.exception(
                        "Knowledge article cleanup failed: %s",
                        article_id,
                    )

                    failed.append({
                        "article_id": str(article_id),
                        "status": "cleanup_failed",
                    })

        except Exception:
            logger.exception("Knowledge article cleanup operation failed.")

            failed.append({
                "status": "cleanup_failed",
                "detail": "Unable to retrieve article IDs for cleanup.",
            })

        return {
            "total_published": len(articles),
            "indexed_count": len(indexed),
            "unchanged_count": len(unchanged),
            "failed_count": len(failed),
            "removed_count": len(removed),
            "indexed": indexed,
            "unchanged": unchanged,
            "failed": failed,
            "removed": removed,
        }
