class ContextBuilder:
    @staticmethod
    def build_context(results: list[dict]) -> str:
        if not results:
            return ""

        context_parts = []

        for index, result in enumerate(results, start=1):
            title = result.get("article_title", "Untitled")
            content = result.get("content", "")
            similarity = result.get("similarity", 0)

            if not content.strip():
                continue

            context_parts.append(
                f"""
Source {index}: {title}
Relevance: {similarity:.3f}

Content:
{content.strip()}
""".strip()
            )

        return "\n\n---\n\n".join(context_parts)
