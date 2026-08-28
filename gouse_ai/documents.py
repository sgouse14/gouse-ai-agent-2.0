from dataclasses import dataclass
from pathlib import Path


SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv", ".xlsx", ".xls", ".png", ".jpg", ".jpeg", ".webp"}


@dataclass
class DocumentSummary:
    filename: str
    extension: str
    extracted_text: str


def validate_upload(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix or 'unknown'}")
    return suffix


def extract_text(path: str | Path) -> DocumentSummary:
    path = Path(path)
    suffix = validate_upload(path.name)
    text = ""

    if suffix in {".txt", ".md", ".csv"}:
        text = path.read_text(encoding="utf-8", errors="replace")
    elif suffix == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    elif suffix in {".xlsx", ".xls"}:
        import openpyxl
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        rows = []
        for sheet in workbook.worksheets:
            rows.append(f"Sheet: {sheet.title}")
            for row in sheet.iter_rows(values_only=True):
                values = [str(value) for value in row if value is not None]
                if values:
                    rows.append(" | ".join(values))
        text = "\n".join(rows)
    else:
        text = "Image file uploaded. Use vision analysis to inspect drawings, plans, or details."

    return DocumentSummary(path.name, suffix, text)
