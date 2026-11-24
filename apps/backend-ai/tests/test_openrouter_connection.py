import asyncio

from app.core.providers import (
    ProviderMessage,
    get_ai_provider,
)


async def main():
    provider = get_ai_provider()

    response = await provider.generate(
        messages=[
            ProviderMessage(
                role="user",
                content="Hello! Introduce yourself in one short sentence.",
            )
        ],
        model="openrouter/free",
        max_tokens=100,
        temperature=0.7,
    )

    print("\nProvider:", type(provider).__name__)
    print("Model:", response.model)
    print("Response:", response.content)
    print("Usage:", response.usage)


if __name__ == "__main__":
    asyncio.run(main())