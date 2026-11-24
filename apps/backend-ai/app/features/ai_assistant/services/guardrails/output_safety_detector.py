from app.core.config import settings
from app.core.providers.base import BaseAIProvider, ProviderMessage
from app.features.ai_assistant.prompts.output_safety import (
    OUTPUT_SAFETY_CLASSIFIER_PROMPT,
)


class OutputSafetyClassificationError(Exception):
    pass


async def detect_unsafe_output(
    content: str,
    provider: BaseAIProvider,
) -> bool:
    """
    Classify an AI-generated response for medical safety.

    Returns:
        True: The response is unsafe.
        False: The response is safe.

    Raises:
        OutputSafetyClassificationError:
            If the classifier returns an unexpected result.
    """

    response = await provider.generate(
        messages=[
            ProviderMessage(
                role="system",
                content=OUTPUT_SAFETY_CLASSIFIER_PROMPT,
            ),
            ProviderMessage(
                role="user",
                content=content,
            ),
        ],
        model=settings.ai_model,
        max_tokens=256,
        temperature=0.0,
    )

    classification = response.content.strip().upper()

    if classification == "BLOCK":
        return True

    if classification == "ALLOW":
        return False

    raise OutputSafetyClassificationError(
        "The output safety classifier returned an invalid result."
    )
