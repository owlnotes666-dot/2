from unittest.mock import MagicMock, patch

import pytest
from pydantic import SecretStr

from app.core.providers.exceptions import ProviderConfigurationError
from app.core.providers.factory import get_ai_provider


def test_openrouter_provider_is_created():
    with (
        patch("app.core.providers.factory.settings") as mock_settings,
        patch(
            "app.core.providers.factory.OpenRouterProvider"
        ) as mock_provider,
    ):
        mock_settings.ai_provider = "openrouter"
        mock_settings.openrouter_api_key = SecretStr("test-key")

        result = get_ai_provider()

        mock_provider.assert_called_once()
        assert result == mock_provider.return_value


def test_huggingface_provider_is_created():
    with (
        patch("app.core.providers.factory.settings") as mock_settings,
        patch(
            "app.core.providers.factory.HuggingFaceProvider"
        ) as mock_provider,
    ):
        mock_settings.ai_provider = "huggingface"
        mock_settings.hf_token = SecretStr("test-token")

        result = get_ai_provider()

        mock_provider.assert_called_once()
        assert result == mock_provider.return_value


def test_openrouter_missing_api_key():
    with patch("app.core.providers.factory.settings") as mock_settings:
        mock_settings.ai_provider = "openrouter"
        mock_settings.openrouter_api_key = None

        with pytest.raises(ProviderConfigurationError):
            get_ai_provider()


def test_huggingface_missing_token():
    with patch("app.core.providers.factory.settings") as mock_settings:
        mock_settings.ai_provider = "huggingface"
        mock_settings.hf_token = None

        with pytest.raises(ProviderConfigurationError):
            get_ai_provider()


def test_unsupported_provider():
    with patch("app.core.providers.factory.settings") as mock_settings:
        mock_settings.ai_provider = "unsupported"

        with pytest.raises(ProviderConfigurationError):
            get_ai_provider()
