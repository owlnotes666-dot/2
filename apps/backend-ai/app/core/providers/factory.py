from app.core.config import settings
from app.core.providers.base import BaseAIProvider
from app.core.providers.exceptions import ProviderConfigurationError
from app.core.providers.huggingface import HuggingFaceProvider
from app.core.providers.openrouter import OpenRouterProvider


def get_ai_provider() -> BaseAIProvider:
    if settings.ai_provider == "huggingface":
        if not settings.hf_token:
            raise ProviderConfigurationError(
                "HF_TOKEN is required when using Hugging Face."
            )

        return HuggingFaceProvider()

    if settings.ai_provider == "openrouter":
        if not settings.openrouter_api_key:
            raise ProviderConfigurationError(
                "OPENROUTER_API_KEY is required when using OpenRouter."
            )

        return OpenRouterProvider()

    raise ProviderConfigurationError(
        f"Unsupported AI provider: {settings.ai_provider}"
    )
