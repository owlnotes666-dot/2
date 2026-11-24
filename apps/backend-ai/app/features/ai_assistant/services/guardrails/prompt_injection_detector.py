from app.core.config import settings
from app.core.providers import ProviderMessage
from app.features.ai_assistant.prompts.prompt_injection import (
    PROMPT_INJECTION_CLASSIFIER_PROMPT,
)


class PromptInjectionClassificationError(Exception):
    pass


async def detect_prompt_injection(
    message: str,
    provider,
) -> bool:
    """
    Classify a user message for prompt injection.

    Returns:
        True: Prompt injection detected.
        False: Message classified as safe.

    Raises:
        PromptInjectionClassificationError:
            If the classifier returns an unexpected result.
    """

    response = await provider.generate(
        messages=[
            ProviderMessage(
                role="system",
                content=PROMPT_INJECTION_CLASSIFIER_PROMPT,
            ),
            ProviderMessage(
                role="user",
                content=message,
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

    raise PromptInjectionClassificationError(
        "The prompt injection classifier returned an invalid result."
    )