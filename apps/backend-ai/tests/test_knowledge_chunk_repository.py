from unittest.mock import MagicMock

from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)


def create_mock_supabase():
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.rpc.return_value = query
    query.execute.return_value = None

    return client, query


def test_replace_article_chunks():
    client, query = create_mock_supabase()

    repository = KnowledgeChunkRepository(client)

    article_id = "11111111-1111-4111-8111-111111111111"

    chunks = [
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

    repository.replace_article_chunks(article_id, chunks)

    client.schema.assert_called_once_with("medical")

    client.schema.return_value.rpc.assert_called_once_with(
        "replace_knowledge_article_chunks",
        {
            "p_article_id": article_id,
            "p_chunks": chunks,
        },
    )

    query.execute.assert_called_once()


def test_replace_article_chunks_with_empty_list():
    client, query = create_mock_supabase()

    repository = KnowledgeChunkRepository(client)

    article_id = "11111111-1111-4111-8111-111111111111"

    repository.replace_article_chunks(article_id, [])

    client.schema.return_value.rpc.assert_called_once_with(
        "replace_knowledge_article_chunks",
        {
            "p_article_id": article_id,
            "p_chunks": [],
        },
    )

    query.execute.assert_called_once()