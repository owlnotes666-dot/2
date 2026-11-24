from app.features.ai_assistant.services.rag.chunking_service import (
    ChunkingService,
)


def test_split_text():
    service = ChunkingService()

    text = (
        "دیابت یک بیماری مزمن است. " * 100
    )

    chunks = service.split_text(text)

    assert len(chunks) > 1
    assert all(len(chunk) <= 800 for chunk in chunks)
    assert all(chunk.strip() for chunk in chunks)


def test_empty_text():
    service = ChunkingService()

    assert service.split_text("") == []
    assert service.split_text("   ") == []


def test_short_text():
    service = ChunkingService()

    text = "دیابت بر تنظیم قند خون تأثیر می‌گذارد."

    chunks = service.split_text(text)

    assert len(chunks) == 1
    assert chunks[0] == text