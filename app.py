from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from gouse_ai import GouseAIAgent
from gouse_ai.architecture import ArchitectureAnalyzer, Material
from gouse_ai.documents import extract_text, validate_upload
from gouse_ai.openai_client import OpenAIClient
from gouse_ai.memory import FileMemory
from gouse_ai.reporting import ArchitectureReportAgent
from gouse_ai.vision import ArchitectureVisionAnalyzer, RenderPromptBuilder, VisionRequest

load_dotenv()
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Gouse AI Architecture Agent", version="2.4.0")
agent = GouseAIAgent(OpenAIClient())
memory = FileMemory()
architecture = ArchitectureAnalyzer()
report_agent = ArchitectureReportAgent(agent)
vision = ArchitectureVisionAnalyzer()
render_prompts = RenderPromptBuilder()


class ChatRequest(BaseModel):
    message: str


class DocumentAnalysisRequest(BaseModel):
    stored_file: str
    question: str = ""


class VisionAnalysisRequest(BaseModel):
    stored_file: str
    focus: str = "General architectural analysis"


class RenderRequest(BaseModel):
    description: str
    style: str = "photorealistic"


class MaterialInput(BaseModel):
    name: str
    category: str
    unit: str = ""
    quantity: float | None = Field(default=None, ge=0)
    rate: float | None = Field(default=None, ge=0)
    notes: str = ""


def uploaded_path(stored_file: str) -> Path:
    filename = Path(stored_file).name
    if filename != stored_file or not filename:
        raise HTTPException(status_code=400, detail="Invalid stored file")
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return path


@app.get("/api/health")
def health():
    return {"status": "ok", "agent": "Gouse AI Architecture"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    memory.add("user", request.message)
    response = agent.run(request.message)
    memory.add("assistant", response.text)
    return {"response": response.text}


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")
    try:
        validate_upload(file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    safe_name = f"{uuid4().hex}_{Path(file.filename).name}"
    destination = UPLOAD_DIR / safe_name
    destination.write_bytes(await file.read())
    summary = extract_text(destination)
    return {"filename": file.filename, "stored_file": safe_name, "extension": summary.extension, "text_preview": summary.extracted_text[:5000], "characters_extracted": len(summary.extracted_text)}


@app.post("/api/architecture/analyze-document")
def analyze_document(request: DocumentAnalysisRequest):
    path = uploaded_path(request.stored_file)
    summary = extract_text(path)
    if not summary.extracted_text.strip():
        raise HTTPException(status_code=422, detail="No analyzable text was extracted from this file")
    report = report_agent.analyze(summary.extracted_text, summary.filename, request.question)
    return {"title": report.title, "analysis": report.analysis, "filename": summary.filename}


@app.post("/api/architecture/analyze-image")
def analyze_image(request: VisionAnalysisRequest):
    path = uploaded_path(request.stored_file)
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        raise HTTPException(status_code=400, detail="Vision analysis requires an uploaded image")
    prompt = vision.build_analysis_prompt(VisionRequest(str(path), request.focus))
    response = agent.run(prompt)
    return {"filename": path.name, "analysis": response.text}


@app.post("/api/architecture/render-prompt")
def create_render_prompt(request: RenderRequest):
    if not request.description.strip():
        raise HTTPException(status_code=400, detail="A project description is required")
    return {"prompt": render_prompts.build(request.description, request.style)}


@app.post("/api/architecture/materials/analyze")
def analyze_materials(materials: list[MaterialInput]):
    return architecture.analyze_materials([Material(**item.model_dump()) for item in materials])


@app.post("/api/architecture/materials/compare")
def compare_materials(materials: list[MaterialInput]):
    return {"options": architecture.compare([Material(**item.model_dump()) for item in materials])}


@app.get("/api/architecture/checklist")
def architecture_checklist(project_type: str = "architectural project"):
    return {"items": architecture.checklist(project_type)}


@app.get("/api/memory")
def get_memory():
    return {"items": memory.load()}


@app.delete("/api/memory")
def clear_memory():
    agent.reset()
    memory.clear()
    return {"status": "cleared"}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
