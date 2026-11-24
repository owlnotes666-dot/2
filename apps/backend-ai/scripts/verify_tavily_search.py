import asyncio

from app.core.providers.tavily_search import TavilySearchProvider


async def main():
    provider = TavilySearchProvider()

    result = await provider.search(
        "What are the common symptoms of type 2 diabetes?"
    )

    print("Search query:", result["query"])
    print("Number of results:", len(result["results"]))

    for index, item in enumerate(result["results"], start=1):
        print(f"\nResult {index}")
        print("Title:", item["title"])
        print("URL:", item["url"])
        print("Content:", item["content"][:250])


if __name__ == "__main__":
    asyncio.run(main())