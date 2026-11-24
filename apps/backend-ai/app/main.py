from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security_audit import audit_security_event
from app.features.ai_assistant.api.routes import router as ai_assistant_router

app = FastAPI(
    title=settings.app_name,
    description="AI Assistant API for Medical Dashboard",
    version="1.0.0",
)

app.state.limiter = limiter


async def rate_limit_exceeded_handler(
    request: Request,
    exc: RateLimitExceeded,
):
    ip_address = (
        request.client.host if request.client else None
    )

    audit_security_event(
        event_name="rate_limit_exceeded",
        ip_address=ip_address,
    )

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later."
        },
    )


app.add_exception_handler(
    RateLimitExceeded,
    rate_limit_exceeded_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    ai_assistant_router,
    prefix=settings.api_v1_prefix,
)


@app.get("/")
async def root():
    return {
        "message": "Medical Dashboard AI Backend is running",
    }


@app.get(f"{settings.api_v1_prefix}/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.app_env,
    }
