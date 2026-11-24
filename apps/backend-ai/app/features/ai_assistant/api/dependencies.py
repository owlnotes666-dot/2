from fastapi import Depends, HTTPException, status

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_admin,
    get_current_user,
    get_optional_admin,
)


from app.features.ai_assistant.services.file_processing_service import (
    FileProcessingService,
)

from app.features.ai_assistant.services.temporary_file_storage import (
    TemporaryFileStorage,
)

from app.core.providers.tavily_search import (
    TavilySearchError,
    TavilySearchProvider,
)

from app.features.ai_assistant.services.web_search_agent.tool_executor import (
    WebSearchExecutor,
)

from app.core.supabase import get_supabase_user_client
from app.core.providers.exceptions import ProviderConfigurationError

from app.features.ai_assistant.repositories.knowledge_article_repository import (
    KnowledgeArticleRepository,
)
from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)
from app.features.ai_assistant.repositories.knowledge_ingestion_repository import (
    KnowledgeIngestionRepository,
)

from app.features.ai_assistant.repositories.database.patient_repository import (
    PatientRepository,
)
from app.features.ai_assistant.repositories.database.doctor_repository import (
    DoctorRepository,
)
from app.features.ai_assistant.repositories.database.appointment_repository import (
    AppointmentRepository,
)
from app.features.ai_assistant.repositories.database.staff_repository import (
    StaffRepository,
)
from app.features.ai_assistant.repositories.database.medical_record_repository import (
    MedicalRecordRepository,
)

from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)
from app.features.ai_assistant.services.database_agent.tool_executor import (
    ToolExecutor,
)
from app.features.ai_assistant.services.rag.document_processing_service import (
    DocumentProcessingService,
)
from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)
from app.features.ai_assistant.services.rag.retrieval_service import (
    RetrievalService,
)
from app.features.ai_assistant.services.rag.context_builder import (
    ContextBuilder,
)

from app.features.ai_assistant.repositories.conversation_repository import (
    ConversationRepository,
)


def get_knowledge_ingestion_service(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
) -> KnowledgeIngestionService:

    if current_admin.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    client = get_supabase_user_client(
        current_admin.access_token.get_secret_value()
    )

    article_repository = KnowledgeArticleRepository(client)
    chunk_repository = KnowledgeChunkRepository(client)
    ingestion_repository = KnowledgeIngestionRepository(client)
    document_processor = DocumentProcessingService()

    return KnowledgeIngestionService(
        article_repository=article_repository,
        chunk_repository=chunk_repository,
        ingestion_repository=ingestion_repository,
        document_processor=document_processor,
    )


def get_ai_assistant_service(
    current_user: AuthenticatedUser = Depends(get_current_user),
    current_admin: AuthenticatedUser | None = Depends(get_optional_admin),
) -> AIAssistantService:

    if current_user.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    client = get_supabase_user_client(
        current_user.access_token.get_secret_value()
    )

    conversation_repository = None

    if current_admin is not None:
        conversation_repository = ConversationRepository(client)

    chunk_repository = KnowledgeChunkRepository(client)

    retrieval_service = RetrievalService(
        chunk_repository=chunk_repository
    )

    context_builder = ContextBuilder()

    tool_executor = None

    if current_admin is not None:
        tool_executor = ToolExecutor(
            patient_repository=PatientRepository(client),
            doctor_repository=DoctorRepository(client),
            appointment_repository=AppointmentRepository(client),
            staff_repository=StaffRepository(client),
            medical_record_repository=MedicalRecordRepository(client),
            is_admin=True,
        )

    try:
        web_search_executor = WebSearchExecutor(
            provider=TavilySearchProvider()
        )

        return AIAssistantService(
            retrieval_service=retrieval_service,
            context_builder=context_builder,
            tool_executor=tool_executor,
            web_search_executor=web_search_executor,
            conversation_repository=conversation_repository,
        )

    except ProviderConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI provider is not configured.",
        ) from None

    except TavilySearchError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Web search provider is not configured.",
        ) from None


def get_knowledge_chunk_repository(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> KnowledgeChunkRepository:

    if current_user.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    client = get_supabase_user_client(
        current_user.access_token.get_secret_value()
    )

    return KnowledgeChunkRepository(client)


# Shared in-memory storage for temporary conversation files.
_temporary_file_storage = TemporaryFileStorage()


def get_file_processing_service() -> FileProcessingService:
    return FileProcessingService()


def get_temporary_file_storage() -> TemporaryFileStorage:
    return _temporary_file_storage
