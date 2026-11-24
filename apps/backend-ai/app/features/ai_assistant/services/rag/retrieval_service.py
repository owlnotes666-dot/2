from app.core.providers.jina_embeddings import JinaEmbeddingProvider
from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)


class RetrievalService:
    def __init__(
        self,
        chunk_repository: KnowledgeChunkRepository,
        min_similarity: float = 0.35,
    ):
        if not 0 <= min_similarity <= 1:
            raise ValueError("min_similarity must be between 0 and 1.")

        self.chunk_repository = chunk_repository
        self.embedding_provider = JinaEmbeddingProvider()
        self.min_similarity = min_similarity

    async def retrieve(
        self,
        query: str,
        match_count: int = 5,
    ) -> list[dict]:
        if not query.strip():
            return []

        query_embedding = await self.embedding_provider.embed_query(
            query.strip()
        )

        results = self.chunk_repository.search_similar_chunks(
            query_embedding=query_embedding,
            match_count=match_count,
        )

        filtered_results = [
            result
            for result in results
            if float(result.get("similarity", 0))
            >= self.min_similarity
        ]

        return filtered_results