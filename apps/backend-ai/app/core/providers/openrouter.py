import json
from typing import Any

import httpx
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    RateLimitError,
)

from app.core.config import settings
from app.core.providers.base import (
    BaseAIProvider,
    ProviderMessage,
    ProviderResponse,
    ProviderToolCall,
)
from app.core.providers.exceptions import (
    ProviderAuthenticationError,
    ProviderConnectionError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter AI Provider implementation."""

    def __init__(self) -> None:
        api_key = (
            settings.openrouter_api_key.get_secret_value()
            if settings.openrouter_api_key
            else None
        )

        self.client = AsyncOpenAI(
            api_key=api_key or "missing-api-key",
            base_url="https://openrouter.ai/api/v1",
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
        try:
            formatted_messages = []

            for message in messages:
                formatted_message = {
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
                                "arguments": json.dumps(
                                    tool_call.arguments
                                ),
                            },
                        }
                        for tool_call in message.tool_calls
                    ]

                formatted_messages.append(formatted_message)

            request_options = {
                "model": model,
                "messages": formatted_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            if tools:
                request_options["tools"] = tools
                request_options["tool_choice"] = tool_choice or "auto"

            response = await self.client.chat.completions.create(
                **request_options
            )

            if not response.choices:
                raise ProviderResponseError(
                    "The provider returned no response choices."
                )

            assistant_message = response.choices[0].message

            content = assistant_message.content

            tool_calls = []

            for tool_call in assistant_message.tool_calls or []:
                try:
                    arguments = json.loads(
                        tool_call.function.arguments
                    )
                except (json.JSONDecodeError, TypeError):
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

            if (
                (content is None or not content.strip())
                and not tool_calls
            ):
                raise ProviderResponseError(
                    "The provider returned an empty response."
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

        except AuthenticationError as exc:
            raise ProviderAuthenticationError(
                "OpenRouter authentication failed."
            ) from exc

        except RateLimitError as exc:
            raise ProviderRateLimitError(
                "OpenRouter rate limit exceeded."
            ) from exc

        except APITimeoutError as exc:
            raise ProviderTimeoutError(
                "OpenRouter request timed out."
            ) from exc

        except APIConnectionError as exc:
            raise ProviderConnectionError(
                "Could not connect to OpenRouter."
            ) from exc

        except APIStatusError as exc:
            if exc.status_code >= 500:
                raise ProviderUnavailableError(
                    "OpenRouter is temporarily unavailable."
                ) from exc

            raise ProviderResponseError(
                f"OpenRouter returned an unexpected status: {exc.status_code}."
            ) from exc

        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError(
                "OpenRouter request timed out."
            ) from exc

        except httpx.ConnectError as exc:
            raise ProviderConnectionError(
                "Could not connect to OpenRouter."
            ) from exc
