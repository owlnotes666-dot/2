from app.core.providers.jina_embeddings import JinaEmbeddingProvider
from app.features.ai_assistant.services.rag.chunking_service import (
    ChunkingService,
)


class DocumentProcessingService:
    def __init__(self):
        self.chunking_service = ChunkingService()
        self.embedding_provider = JinaEmbeddingProvider()

    async def process_document(self, content: str) -> list[dict]:
        chunks = self.chunking_service.split_text(content)

        if not chunks:
            return []

        embeddings = await self.embedding_provider.embed_documents(chunks)

        if len(chunks) != len(embeddings):
            raise ValueError("Chunk and embedding counts do not match.")

        return [
            {
                "chunk_index": index,
                "content": chunk,
                "embedding": embedding,
            }
            for index, (chunk, embedding) in enumerate(
                zip(chunks, embeddings)
            )
        ]