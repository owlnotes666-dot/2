class ProviderError(Exception):
    """Base exception for AI provider errors."""


class ProviderAuthenticationError(ProviderError):
    """Raised when the provider API key is invalid or unauthorized."""


class ProviderRateLimitError(ProviderError):
    """Raised when the provider rate limit is exceeded."""


class ProviderTimeoutError(ProviderError):
    """Raised when the provider request times out."""


class ProviderConnectionError(ProviderError):
    """Raised when the provider cannot be reached."""


class ProviderUnavailableError(ProviderError):
    """Raised when the provider service is unavailable."""


class ProviderResponseError(ProviderError):
    """Raised when the provider returns an invalid response."""


class ProviderConfigurationError(ProviderError):
    """Raised when provider configuration is missing or invalid."""
