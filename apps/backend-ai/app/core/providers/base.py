from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

MessageRole = Literal["system", "user", "assistant", "tool"]


@dataclass
class ProviderToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class ProviderMessage:
    role: MessageRole
    content: str | None
    tool_call_id: str | None = None
    tool_calls: list[ProviderToolCall] = field(default_factory=list)


@dataclass
class ProviderResponse:
    content: str | None
    model: str
    usage: dict[str, int | float] | None = None
    tool_calls: list[ProviderToolCall] = field(default_factory=list)


class BaseAIProvider(ABC):
    """Common interface for all AI providers."""

    @abstractmethod
    async def generate(
        self,
        messages: list[ProviderMessage],
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | dict[str, Any] | None = None,
    ) -> ProviderResponse:
        """Generate an AI response, optionally using tools."""
        raise NotImplementedError
