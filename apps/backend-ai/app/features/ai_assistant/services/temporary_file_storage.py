import time
from threading import Lock
from uuid import UUID


class TemporaryFileStorage:
    TTL_SECONDS = 30 * 60  # 30 minutes

    MAX_FILES_PER_CONVERSATION = 5
    MAX_TOTAL_TEXT_LENGTH = 200_000

    def __init__(self) -> None:
        self._storage: dict[tuple[UUID, UUID], dict] = {}
        self._lock = Lock()

    def _cleanup_expired(self) -> None:
        now = time.monotonic()

        expired_keys = [
            storage_key
            for storage_key, data in self._storage.items()
            if data["expires_at"] <= now
        ]

        for storage_key in expired_keys:
            del self._storage[storage_key]

    def add_file(
        self,
        owner_id: UUID,
        conversation_id: UUID,
        filename: str,
        text: str,
    ) -> None:
        if not text.strip():
            raise ValueError("File content cannot be empty.")

        with self._lock:
            self._cleanup_expired()

            now = time.monotonic()
            storage_key = (owner_id, conversation_id)

            data = self._storage.get(storage_key)

            if data is None:
                data = {
                    "files": [],
                    "expires_at": now + self.TTL_SECONDS,
                }
                self._storage[storage_key] = data

            files = data["files"]

            if len(files) >= self.MAX_FILES_PER_CONVERSATION:
                raise ValueError(
                    "Maximum 5 files are allowed per conversation."
                )

            current_length = sum(
                len(file["text"])
                for file in files
            )

            if current_length + len(text) > self.MAX_TOTAL_TEXT_LENGTH:
                raise ValueError(
                    "Total extracted text exceeds the 200,000 character limit."
                )

            files.append({
                "filename": filename,
                "text": text,
            })

            # Refresh expiration after each successful upload.
            data["expires_at"] = now + self.TTL_SECONDS

    def get_context(
        self,
        owner_id: UUID,
        conversation_id: UUID,
    ) -> str:
        with self._lock:
            self._cleanup_expired()

            storage_key = (owner_id, conversation_id)
            data = self._storage.get(storage_key)

            if data is None:
                return ""

            return "\n\n".join(
                f"File: {file['filename']}\n{file['text']}"
                for file in data["files"]
            )

    def get_files(
        self,
        owner_id: UUID,
        conversation_id: UUID,
    ) -> list[str]:
        with self._lock:
            self._cleanup_expired()

            storage_key = (owner_id, conversation_id)
            data = self._storage.get(storage_key)

            if data is None:
                return []

            return [
                file["filename"]
                for file in data["files"]
            ]

    def clear(
        self,
        owner_id: UUID,
        conversation_id: UUID,
    ) -> None:
        with self._lock:
            storage_key = (owner_id, conversation_id)
            self._storage.pop(storage_key, None)

    def cleanup_expired(self) -> None:
        with self._lock:
            self._cleanup_expired()
