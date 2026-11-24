from uuid import UUID

from supabase import Client


class KnowledgeChunkRepository:
    TABLE_NAME = "knowledge_article_chunks"

    def __init__(self, client: Client):
        self.client = client

    def replace_article_chunks(
        self,
        article_id: UUID,
        chunks: list[dict],
    ) -> None:
        (
            self.client.schema("medical")
            .rpc(
                "replace_knowledge_article_chunks",
                {
                    "p_article_id": str(article_id),
                    "p_chunks": chunks,
                },
            )
            .execute()
        )

    def delete_article_chunks(self, article_id: UUID) -> None:
        (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .delete()
            .eq("article_id", str(article_id))
            .execute()
        )

    def search_similar_chunks(
        self,
        query_embedding: list[float],
        match_count: int = 5,
    ) -> list[dict]:
        response = (
            self.client.schema("medical")
            .rpc(
                "match_knowledge_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_count": match_count,
                },
            )
            .execute()
        )

        return response.data or []
