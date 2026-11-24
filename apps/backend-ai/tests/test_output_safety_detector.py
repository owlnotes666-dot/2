from unittest.mock import AsyncMock

import pytest

from app.core.providers.base import ProviderResponse
from app.features.ai_assistant.services.guardrails.output_safety_detector import (
    OutputSafetyClassificationError,
    detect_unsafe_output,
)


@pytest.mark.anyio
async def test_classifier_blocks_unsafe_medical_response():
    provider = AsyncMock()
    provider.generate.return_value = ProviderResponse(
        content="BLOCK",
        model="test-model",
    )

    result = await detect_unsafe_output(
        "You should stop taking your prescribed medication.",
        provider,
    )

    assert result is True


@pytest.mark.anyio
async def test_classifier_allows_safe_medical_response():
    provider = AsyncMock()
    provider.generate.return_value = ProviderResponse(
        content="ALLOW",
        model="test-model",
    )

    result = await detect_unsafe_output(
        "For general information, consult a qualified healthcare professional.",
        provider,
    )

    assert result is False


@pytest.mark.anyio
async def test_classifier_allows_non_identifying_patient_statistics():
    provider = AsyncMock()
    provider.generate.return_value = ProviderResponse(
        content="ALLOW",
        model="test-model",
    )

    result = await detect_unsafe_output(
        "There are 25 active patients.",
        provider,
    )

    assert result is False
    classifier_prompt = provider.generate.await_args.kwargs["messages"][0].content
    assert "Aggregate counts that do not identify an individual" in (
        classifier_prompt
    )


@pytest.mark.anyio
async def test_classifier_rejects_unexpected_response():
    provider = AsyncMock()
    provider.generate.return_value = ProviderResponse(
        content="This response seems safe.",
        model="test-model",
    )

    with pytest.raises(OutputSafetyClassificationError):
        await detect_unsafe_output(
            "General medical information.",
            provider,
        )


@pytest.mark.anyio
async def test_classifier_uses_expected_generation_settings():
    provider = AsyncMock()
    provider.generate.return_value = ProviderResponse(
        content="ALLOW",
        model="test-model",
    )

    await detect_unsafe_output(
        "General medical information.",
        provider,
    )

    provider.generate.assert_awaited_once()

    call_kwargs = provider.generate.await_args.kwargs

    assert call_kwargs["max_tokens"] == 256
    assert call_kwargs["temperature"] == 0.0