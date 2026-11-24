import json
from typing import Any

from huggingface_hub import AsyncInferenceClient

from app.core.config import settings
from app.core.providers.base import (
    BaseAIProvider,
    ProviderMessage,
    ProviderResponse,
    ProviderToolCall,
)
from app.core.providers.exceptions import (
    ProviderResponseError,
)


class HuggingFaceProvider(BaseAIProvider):
    """Hugging Face Inference Provider implementation."""

    def __init__(self) -> None:
        token = (
            settings.hf_token.get_secret_value()
            if settings.hf_token
            else None
        )

        self.client = AsyncInferenceClient(
            token=token,
            timeout=60,
        )

    async def generate(
        self,
        messages: list[ProviderMessage],
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | dict[str, Any] | None = None,
    ) -> ProviderResponse:
        formatted_messages = []
        for message in messages:
            formatted_message: dict[str, Any] = {
                "role": message.role,
                "content": message.content,
            }

            if message.tool_call_id:
                formatted_message["tool_call_id"] = message.tool_call_id

            if message.tool_calls:
                formatted_message["tool_calls"] = [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.name,
                            "arguments": json.dumps(tool_call.arguments),
                        },
                    }
                    for tool_call in message.tool_calls
                ]

            formatted_messages.append(formatted_message)

        response = await self.client.chat_completion(
            messages=formatted_messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            tools=tools,
            tool_choice=tool_choice or ("auto" if tools else None),
        )

        assistant_message = response.choices[0].message
        content = assistant_message.content
        tool_calls = []

        for tool_call in assistant_message.tool_calls or []:
            arguments = tool_call.function.arguments
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    raise ProviderResponseError(
                        "The provider returned invalid tool arguments."
                    ) from None

            if not isinstance(arguments, dict):
                raise ProviderResponseError(
                    "Tool arguments must be a JSON object."
                )

            tool_calls.append(
                ProviderToolCall(
                    id=tool_call.id,
                    name=tool_call.function.name,
                    arguments=arguments,
                )
            )

        usage = None

        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        return ProviderResponse(
            content=content,
            model=response.model or model,
            usage=usage,
            tool_calls=tool_calls,
        )