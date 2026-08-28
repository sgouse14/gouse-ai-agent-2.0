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

load_dotenv()
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Gouse AI Architecture Agent", version="2.2.0")
agent = GouseAIAgent(OpenAIClient())
memory = FileMemory()
architecture = ArchitectureAnalyzer()


class ChatRequest(BaseModel):
    message: str


class MaterialInput(BaseModel):
    name: str
    category: str
    unit: str = ""
    quantity: float | None = Field(default=None, ge=0)
    rate: float | None = Field(default=None, ge=0)
    notes: str = ""


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
    content = await file.read()
    destination.write_bytes(content)

    summary = extract_text(destination)
    return {
        "filename": file.filename,
        "stored_file": safe_name,
        "extension": summary.extension,
        "text_preview": summary.extracted_text[:5000],
        "characters_extracted": len(summary.extracted_text),
    }


@app.post("/api/architecture/materials/analyze")
def analyze_materials(materials: list[MaterialInput]):
    items = [Material(**item.model_dump()) for item in materials]
    return architecture.analyze_materials(items)


@app.post("/api/architecture/materials/compare")
def compare_materials(materials: list[MaterialInput]):
    items = [Material(**item.model_dump()) for item in materials]
    return {"options": architecture.compare(items)}


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
