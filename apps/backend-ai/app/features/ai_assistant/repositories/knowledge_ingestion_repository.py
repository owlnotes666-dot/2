from uuid import UUID

from supabase import Client


class KnowledgeIngestionRepository:
    TABLE_NAME = "knowledge_article_ingestions"

    def __init__(self, client: Client):
        self.client = client

    def get_ingestion(self, article_id: UUID) -> dict | None:
        response = (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .select("article_id, content_hash, chunk_count, indexed_at")
            .eq("article_id", str(article_id))
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def upsert_ingestion(
        self,
        article_id: UUID,
        content_hash: str,
        chunk_count: int,
    ) -> None:
        self.client.schema("medical").table(self.TABLE_NAME).upsert(
            {
                "article_id": str(article_id),
                "content_hash": content_hash,
                "chunk_count": chunk_count,
            },
            on_conflict="article_id",
        ).execute()

    def delete_ingestion(self, article_id: UUID) -> None:
        (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .delete()
            .eq("article_id", str(article_id))
            .execute()
        )