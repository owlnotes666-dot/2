from uuid import UUID

from supabase import Client


class KnowledgeArticleRepository:
    TABLE_NAME = "knowledge_articles"

    def __init__(self, client: Client):
        self.client = client

    def get_published_article(self, article_id: UUID) -> dict | None:
        response = (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .select("id, title, content, status")
            .eq("id", str(article_id))
            .eq("status", "Published")
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def get_all_published_articles(self) -> list[dict]:
        response = (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .select("id, title, content, status")
            .eq("status", "Published")
            .execute()
        )

        return response.data or []

    def get_all_article_ids(self) -> list[UUID]:
        response = (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .select("id")
            .execute()
        )

        return [
            UUID(row["id"])
            for row in (response.data or [])
        ]
