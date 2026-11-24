import pytest

from app.core.providers.jina_embeddings import JinaEmbeddingProvider


@pytest.mark.asyncio
async def test_real_jina_connection():

    provider = JinaEmbeddingProvider()

    documents = await provider.embed_documents([
        "دیابت یک بیماری مزمن است که بر تنظیم قند خون تأثیر می‌گذارد."
    ])

    query = await provider.embed_query(
        "علائم بیماری دیابت چیست؟"
    )

    assert len(documents) == 1
    assert len(documents[0]) == 1024
    assert len(query) == 1024

    print("\nJina connection successful.")
    print(f"Document dimensions: {len(documents[0])}")
    print(f"Query dimensions: {len(query)}")