from uuid import UUID
from pathlib import Path
from fastapi import HTTPException

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
    UploadFile,
    File,
    Form,
)

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
    get_current_admin,
    get_optional_admin,
)
from app.core.rate_limit import limiter

from app.features.ai_assistant.schemas.chat import (
    ChatRequest,
    ChatResponse,
    FileUploadResponse,
)

from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)

from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)

from app.features.ai_assistant.api.dependencies import (
    get_knowledge_ingestion_service,
    get_ai_assistant_service,
    get_file_processing_service,
    get_temporary_file_storage,
)

from app.features.ai_assistant.services.file_processing_service import (
    FileProcessingService,
    FileProcessingError,
)

from app.features.ai_assistant.services.temporary_file_storage import (
    TemporaryFileStorage,
)


router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"],
)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    current_admin: AuthenticatedUser | None = Depends(get_optional_admin),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
    file_storage: TemporaryFileStorage = Depends(
        get_temporary_file_storage
    ),
) -> ChatResponse:
    try:
        return await ai_service.generate_response(
            request=chat_request,
            user_id=current_user.id,
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
            file_context=(
                file_storage.get_context(
                    owner_id=current_admin.id,
                    conversation_id=chat_request.conversation_id,
                )
                if current_admin and chat_request.conversation_id
                else None
            ),
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid message.",
        ) from None


@router.post(
    "/files/upload",
    response_model=FileUploadResponse,
)
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    conversation_id: UUID = Form(...),
    file: UploadFile = File(...),
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    file_processor: FileProcessingService = Depends(
        get_file_processing_service
    ),
    file_storage: TemporaryFileStorage = Depends(
        get_temporary_file_storage
    ),
) -> FileUploadResponse:

    filename = Path(file.filename or "").name

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename.",
        )

    try:
        content = await file.read(
            file_processor.MAX_FILE_SIZE + 1
        )

        if len(content) > file_processor.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 10 MB limit.",
            )

        extracted_text = file_processor.extract_text(
            filename=filename,
            content=content,
        )

        file_storage.add_file(
            owner_id=current_admin.id,
            conversation_id=conversation_id,
            filename=filename,
            text=extracted_text,
        )

        return FileUploadResponse(
            conversation_id=conversation_id,
            filename=filename,
            message="File uploaded and processed successfully.",
        )

    except FileProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None

    finally:
        await file.close()


@router.post("/knowledge/{article_id}/ingest")
async def ingest_knowledge_article(
    article_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return await ingestion_service.ingest_article(article_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from None

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge article ingestion failed.",
        ) from None


@router.delete("/knowledge/{article_id}/index")
async def remove_knowledge_article_index(
    article_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return ingestion_service.remove_article_index(article_id)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge article index removal failed.",
        ) from None


@router.post("/knowledge/ingest-all")
@limiter.limit("2/minute")
async def ingest_all_knowledge_articles(
    request: Request,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return await ingestion_service.ingest_all_articles()

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk knowledge ingestion failed.",
        ) from None


@router.get("/conversations")
async def list_conversations(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
):
    repository = ai_service.conversation_repository

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    try:
        return repository.list_conversations(
            owner_id=current_admin.id
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve conversations.",
        ) from None


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
):
    repository = ai_service.conversation_repository

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    try:
        conversation = repository.get_conversation(
            conversation_id
        )

        if (
            conversation is None
            or str(conversation.get("owner_id"))
            != str(current_admin.id)
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

        messages = repository.get_messages(
            conversation_id
        )

        return {
            "conversation": conversation,
            "messages": messages,
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve conversation.",
        ) from None


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
):
    repository = ai_service.conversation_repository

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    try:
        deleted = repository.delete_conversation(
            conversation_id=conversation_id,
            owner_id=current_admin.id,
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

        return {
            "message": "Conversation deleted successfully."
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete conversation.",
        ) from None
