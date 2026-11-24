from unittest.mock import MagicMock
from uuid import UUID

from app.features.ai_assistant.repositories.knowledge_article_repository import (
    KnowledgeArticleRepository,
)


def create_mock_supabase():
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value = query
    query.select.return_value = query
    query.eq.return_value = query
    query.limit.return_value = query

    return client, query


def test_get_published_article():
    client, query = create_mock_supabase()

    article_id = UUID("11111111-1111-4111-8111-111111111111")

    expected_article = {
        "id": str(article_id),
        "title": "Diabetes Overview",
        "content": "Synthetic medical education content.",
        "status": "Published",
    }

    query.execute.return_value.data = [expected_article]

    repository = KnowledgeArticleRepository(client)

    result = repository.get_published_article(article_id)

    assert result == expected_article

    client.schema.assert_called_once_with("medical")

    client.schema.return_value.table.assert_called_once_with(
        "knowledge_articles"
    )

    query.select.assert_called_once_with(
        "id, title, content, status"
    )


def test_get_published_article_returns_none_when_not_found():
    client, query = create_mock_supabase()

    article_id = UUID("11111111-1111-4111-8111-111111111111")

    query.execute.return_value.data = []

    repository = KnowledgeArticleRepository(client)

    result = repository.get_published_article(article_id)

    assert result is None