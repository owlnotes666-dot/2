from io import BytesIO

import pytest
from docx import Document
from openpyxl import Workbook
from pptx import Presentation
from pypdf import PdfWriter

from app.features.ai_assistant.services.file_processing_service import (
    FileProcessingError,
    FileProcessingService,
)


@pytest.fixture
def service():
    return FileProcessingService()


def test_extract_txt(service):
    result = service.extract_text("notes.txt", b"Hello medical world")
    assert result == "Hello medical world"


def test_extract_markdown(service):
    result = service.extract_text(
        "notes.md",
        b"# Medical Notes\nPatient information",
    )
    assert "Medical Notes" in result
    assert "Patient information" in result


def test_extract_csv(service):
    content = b"Name,Age\nJohn,30\nJane,25"
    result = service.extract_text("patients.csv", content)

    assert "Name | Age" in result
    assert "John | 30" in result


def test_extract_json(service):
    content = b'{"patient": "John", "age": 30}'
    result = service.extract_text("patient.json", content)

    assert '"patient": "John"' in result
    assert '"age": 30' in result


def test_extract_docx(service):
    buffer = BytesIO()
    document = Document()
    document.add_paragraph("Medical report content")
    document.save(buffer)

    result = service.extract_text("report.docx", buffer.getvalue())

    assert "Medical report content" in result


def test_extract_xlsx(service):
    buffer = BytesIO()
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["Patient", "Age"])
    sheet.append(["John", 30])
    workbook.save(buffer)

    result = service.extract_text("patients.xlsx", buffer.getvalue())

    assert "Patient | Age" in result
    assert "John | 30" in result


def test_extract_pptx(service):
    buffer = BytesIO()
    presentation = Presentation()
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[5]
    )
    textbox = slide.shapes.add_textbox(
        100000,
        100000,
        5000000,
        1000000,
    )
    textbox.text = "Medical presentation"
    presentation.save(buffer)

    result = service.extract_text("presentation.pptx", buffer.getvalue())

    assert "Medical presentation" in result


def test_extract_pdf(service):
    buffer = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(buffer)

    # A blank PDF has no extractable text.
    with pytest.raises(FileProcessingError):
        service.extract_text("document.pdf", buffer.getvalue())


def test_reject_unsupported_extension(service):
    with pytest.raises(FileProcessingError, match="Unsupported"):
        service.extract_text("script.exe", b"some content")


def test_reject_empty_file(service):
    with pytest.raises(FileProcessingError, match="empty"):
        service.extract_text("empty.txt", b"")


def test_reject_oversized_file(service):
    content = b"a" * (service.MAX_FILE_SIZE + 1)

    with pytest.raises(FileProcessingError, match="10 MB"):
        service.extract_text("large.txt", content)


def test_reject_corrupted_docx(service):
    with pytest.raises(
        FileProcessingError,
        match="Invalid Office document",
    ):
        service.extract_text(
            "broken.docx",
            b"not a valid docx file",
        )


def test_reject_invalid_json(service):
    with pytest.raises(FileProcessingError, match="Unable to process"):
        service.extract_text("broken.json", b"{invalid json}")
