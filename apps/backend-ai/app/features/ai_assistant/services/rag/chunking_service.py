from langchain_text_splitters import RecursiveCharacterTextSplitter


class ChunkingService:
    CHUNK_SIZE = 800
    CHUNK_OVERLAP = 120

    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.CHUNK_SIZE,
            chunk_overlap=self.CHUNK_OVERLAP,
            length_function=len,
            separators=[
                "\n\n",
                "\n",
                ". ",
                "؟ ",
                " ",
                "",
            ],
        )

    def split_text(self, text: str) -> list[str]:
        if not text or not text.strip():
            return []

        return self.splitter.split_text(text)