from uuid import UUID
from typing import Literal
from pydantic import BaseModel, Field, field_validator, AnyHttpUrl


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(
        ...,
        min_length=1,
        max_length=8000,
    )


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="User message",
    )

    conversation_id: UUID | None = None
    history: list[ChatHistoryMessage] = Field(
        default_factory=list,
        max_length=20,
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Message cannot be empty.")

        return value


class ChatUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatSource(BaseModel):
    article_id: UUID
    article_title: str
    chunk_index: int
    similarity: float


class WebSource(BaseModel):
    title: str
    url: AnyHttpUrl
    score: float = Field(ge=0, le=1)


class ChatResponse(BaseModel):
    conversation_id: UUID | None = None

    message: str

    provider: str

    model: str

    usage: ChatUsage | None = None

    sources: list[ChatSource] = Field(default_factory=list)

    web_sources: list[WebSource] = Field(default_factory=list)


class FileUploadResponse(BaseModel):
    conversation_id: UUID
    filename: str
    message: str
