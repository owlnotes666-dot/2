from io import BytesIO
import csv
import json
from pathlib import Path
import zipfile

from pypdf import PdfReader
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation


class FileProcessingError(Exception):
    pass


class FileProcessingService:
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_EXTRACTED_TEXT_LENGTH = 100_000  # 100K characters

    MAX_ARCHIVE_FILES = 2_000
    MAX_ARCHIVE_UNCOMPRESSED_SIZE = 50 * 1024 * 1024  # 50 MB

    SUPPORTED_EXTENSIONS = {
        ".pdf",
        ".docx",
        ".txt",
        ".md",
        ".csv",
        ".json",
        ".xlsx",
        ".pptx",
    }

    def extract_text(
        self,
        filename: str,
        content: bytes,
    ) -> str:
        extension = Path(filename).suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:
            raise FileProcessingError(
                "Unsupported file format."
            )

        if not content:
            raise FileProcessingError(
                "The uploaded file is empty."
            )

        if len(content) > self.MAX_FILE_SIZE:
            raise FileProcessingError(
                "File size exceeds the 10 MB limit."
            )

        self._validate_file_structure(filename, content)

        try:
            if extension == ".pdf":
                text = self._extract_pdf(content)

            elif extension == ".docx":
                text = self._extract_docx(content)

            elif extension in {".txt", ".md"}:
                text = content.decode("utf-8-sig")

            elif extension == ".csv":
                text = self._extract_csv(content)

            elif extension == ".json":
                text = self._extract_json(content)

            elif extension == ".xlsx":
                text = self._extract_xlsx(content)

            elif extension == ".pptx":
                text = self._extract_pptx(content)

            else:
                raise FileProcessingError(
                    "Unsupported file format."
                )

        except FileProcessingError:
            raise

        except Exception:
            raise FileProcessingError(
                "Unable to process the uploaded file."
            ) from None

        text = text.strip()

        if not text:
            raise FileProcessingError(
                "No readable text was found in the file."
            )

        if len(text) > self.MAX_EXTRACTED_TEXT_LENGTH:
            raise FileProcessingError(
                "Extracted text exceeds the 100,000 character limit."
            )

        return text

    @classmethod
    def _validate_file_structure(
        cls,
        filename: str,
        content: bytes,
    ) -> None:
        extension = Path(filename).suffix.lower()

        if extension == ".pdf":
            if not content.startswith(b"%PDF-"):
                raise FileProcessingError(
                    "Invalid PDF file."
                )

        elif extension in {".docx", ".xlsx", ".pptx"}:
            try:
                with zipfile.ZipFile(BytesIO(content)) as archive:
                    files = archive.infolist()

                    if len(files) > cls.MAX_ARCHIVE_FILES:
                        raise FileProcessingError(
                            "The uploaded file contains too many entries."
                        )

                    total_size = sum(
                        item.file_size
                        for item in files
                    )

                    if total_size > cls.MAX_ARCHIVE_UNCOMPRESSED_SIZE:
                        raise FileProcessingError(
                            "The uploaded file contains too much uncompressed data."
                        )

                    if any(
                        item.flag_bits & 0x1
                        for item in files
                    ):
                        raise FileProcessingError(
                            "Encrypted files are not supported."
                        )

                    required_files = {
                        ".docx": "word/document.xml",
                        ".xlsx": "xl/workbook.xml",
                        ".pptx": "ppt/presentation.xml",
                    }

                    if required_files[extension] not in archive.namelist():
                        raise FileProcessingError(
                            "Invalid Office document structure."
                        )

                    if archive.testzip() is not None:
                        raise FileProcessingError(
                            "The uploaded file is corrupted."
                        )

            except zipfile.BadZipFile:
                raise FileProcessingError(
                    "Invalid Office document."
                ) from None

    @staticmethod
    def _extract_pdf(content: bytes) -> str:
        reader = PdfReader(BytesIO(content))

        return "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    @staticmethod
    def _extract_docx(content: bytes) -> str:
        document = Document(BytesIO(content))

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    @staticmethod
    def _extract_csv(content: bytes) -> str:
        decoded = content.decode("utf-8-sig")
        rows = csv.reader(decoded.splitlines())

        return "\n".join(
            " | ".join(row)
            for row in rows
        )

    @staticmethod
    def _extract_json(content: bytes) -> str:
        decoded = content.decode("utf-8-sig")
        data = json.loads(decoded)

        return json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )

    @staticmethod
    def _extract_xlsx(content: bytes) -> str:
        workbook = load_workbook(
            BytesIO(content),
            read_only=True,
            data_only=True,
        )

        extracted = []

        try:
            for sheet in workbook.worksheets:
                extracted.append(
                    f"Sheet: {sheet.title}"
                )

                for row in sheet.iter_rows(values_only=True):
                    values = [
                        str(value)
                        for value in row
                        if value is not None
                    ]

                    if values:
                        extracted.append(" | ".join(values))
        finally:
            workbook.close()

        return "\n".join(extracted)

    @staticmethod
    def _extract_pptx(content: bytes) -> str:
        presentation = Presentation(BytesIO(content))
        extracted = []

        for slide_number, slide in enumerate(
            presentation.slides,
            start=1,
        ):
            extracted.append(
                f"Slide {slide_number}:"
            )

            for shape in slide.shapes:
                if shape.has_text_frame:
                    extracted.append(shape.text)

        return "\n".join(extracted)
