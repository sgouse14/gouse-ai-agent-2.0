from pathlib import Path
from uuid import uuid4
from dataclasses import asdict
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from gouse_ai import GouseAIAgent
from gouse_ai.architecture import ArchitectureAnalyzer, Material
from gouse_ai.database import Database
from gouse_ai.documents import extract_text, validate_upload
from gouse_ai.intelligence import ProjectIntelligenceEngine
from gouse_ai.openai_client import OpenAIClient
from gouse_ai.memory import FileMemory
from gouse_ai.projects import ProjectStore
from gouse_ai.reporting import ArchitectureReportAgent
from gouse_ai.vision import ArchitectureVisionAnalyzer, RenderPromptBuilder, VisionRequest

load_dotenv(); UPLOAD_DIR=Path("data/uploads"); UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
app=FastAPI(title="Gouse AI Architecture Agent",version="2.7.0")
agent=GouseAIAgent(OpenAIClient()); memory=FileMemory(); database=Database(); projects=ProjectStore(); architecture=ArchitectureAnalyzer()
report_agent=ArchitectureReportAgent(agent); intelligence=ProjectIntelligenceEngine(report_agent); vision=ArchitectureVisionAnalyzer(); render_prompts=RenderPromptBuilder()

class ProjectCreate(BaseModel): name:str; project_type:str="architecture"; location:str=""; description:str=""
class ProjectFileRequest(BaseModel): stored_file:str
class ProjectAnalysisRequest(BaseModel): title:str; analysis:str
class ProjectIntelligenceRequest(BaseModel): focus:str=""
class ProjectChatRequest(BaseModel): message:str
class ChatRequest(BaseModel): message:str
class DocumentAnalysisRequest(BaseModel): stored_file:str; question:str=""
class VisionAnalysisRequest(BaseModel): stored_file:str; focus:str="General architectural analysis"
class RenderRequest(BaseModel): description:str; style:str="photorealistic"
class MaterialInput(BaseModel): name:str; category:str; unit:str=""; quantity:float|None=Field(default=None,ge=0); rate:float|None=Field(default=None,ge=0); notes:str=""

def uploaded_path(stored_file:str)->Path:
    filename=Path(stored_file).name
    if filename!=stored_file or not filename: raise HTTPException(400,"Invalid stored file")
    path=UPLOAD_DIR/filename
    if not path.exists(): raise HTTPException(404,"Uploaded file not found")
    return path

def project_or_404(project_id:str):
    project=projects.get(project_id)
    if not project: raise HTTPException(404,"Project not found")
    return project

@app.get("/api/health")
def health(): return {"status":"ok","agent":"Gouse AI Architecture","database":"sqlite"}
@app.post("/api/projects")
def create_project(request:ProjectCreate): return asdict(projects.create(**request.model_dump()))
@app.get("/api/projects")
def list_projects(): return {"projects":[asdict(p) for p in projects.list()]}
@app.get("/api/projects/{project_id}")
def get_project(project_id:str): return asdict(project_or_404(project_id))
@app.post("/api/projects/{project_id}/files")
def attach_project_file(project_id:str,request:ProjectFileRequest):
    uploaded_path(request.stored_file)
    try:return asdict(projects.add_file(project_id,request.stored_file))
    except KeyError:raise HTTPException(404,"Project not found")
@app.post("/api/projects/{project_id}/analyses")
def attach_project_analysis(project_id:str,request:ProjectAnalysisRequest):
    try:return asdict(projects.add_analysis(project_id,request.title,request.analysis))
    except KeyError:raise HTTPException(404,"Project not found")
@app.post("/api/projects/{project_id}/intelligence")
def analyze_project(project_id:str,request:ProjectIntelligenceRequest):
    project=project_or_404(project_id); result=intelligence.analyze(project,UPLOAD_DIR,request.focus); projects.add_analysis(project_id,result["title"],result["analysis"]); return result
@app.post("/api/projects/{project_id}/chat")
def project_chat(project_id:str,request:ProjectChatRequest):
    project_or_404(project_id)
    if not request.message.strip(): raise HTTPException(400,"Message cannot be empty")
    history=database.get_memory(project_id,limit=20)
    context="\n".join(f"{item['role']}: {item['content']}" for item in history)
    prompt=f"Project conversation history:\n{context}\n\nCurrent request: {request.message}" if context else request.message
    response=agent.run(prompt); database.add_memory(project_id,"user",request.message); database.add_memory(project_id,"assistant",response.text); return {"response":response.text,"project_id":project_id}
@app.get("/api/projects/{project_id}/memory")
def get_project_memory(project_id:str): project_or_404(project_id); return {"items":database.get_memory(project_id)}
@app.delete("/api/projects/{project_id}/memory")
def clear_project_memory(project_id:str): project_or_404(project_id); database.clear_memory(project_id); return {"status":"cleared","project_id":project_id}
@app.post("/api/chat")
def chat(request:ChatRequest):
    if not request.message.strip(): raise HTTPException(400,"Message cannot be empty")
    memory.add("user",request.message); response=agent.run(request.message); memory.add("assistant",response.text); return {"response":response.text}
@app.post("/api/documents/upload")
async def upload_document(file:UploadFile=File(...)):
    if not file.filename: raise HTTPException(400,"A filename is required")
    try:validate_upload(file.filename)
    except ValueError as exc:raise HTTPException(400,str(exc)) from exc
    safe_name=f"{uuid4().hex}_{Path(file.filename).name}"; destination=UPLOAD_DIR/safe_name; destination.write_bytes(await file.read()); summary=extract_text(destination); return {"filename":file.filename,"stored_file":safe_name,"extension":summary.extension,"text_preview":summary.extracted_text[:5000],"characters_extracted":len(summary.extracted_text)}
@app.post("/api/architecture/analyze-document")
def analyze_document(request:DocumentAnalysisRequest):
    summary=extract_text(uploaded_path(request.stored_file))
    if not summary.extracted_text.strip(): raise HTTPException(422,"No analyzable text was extracted")
    report=report_agent.analyze(summary.extracted_text,summary.filename,request.question); return {"title":report.title,"analysis":report.analysis,"filename":summary.filename}
@app.post("/api/architecture/analyze-image")
def analyze_image(request:VisionAnalysisRequest):
    path=uploaded_path(request.stored_file)
    if path.suffix.lower() not in {".png",".jpg",".jpeg",".webp"}: raise HTTPException(400,"Vision analysis requires an uploaded image")
    response=agent.run(vision.build_analysis_prompt(VisionRequest(str(path),request.focus))); return {"filename":path.name,"analysis":response.text}
@app.post("/api/architecture/render-prompt")
def create_render_prompt(request:RenderRequest): return {"prompt":render_prompts.build(request.description,request.style)}
@app.post("/api/architecture/materials/analyze")
def analyze_materials(materials:list[MaterialInput]): return architecture.analyze_materials([Material(**item.model_dump()) for item in materials])
@app.post("/api/architecture/materials/compare")
def compare_materials(materials:list[MaterialInput]): return {"options":architecture.compare([Material(**item.model_dump()) for item in materials])}
@app.get("/api/architecture/checklist")
def architecture_checklist(project_type:str="architectural project"): return {"items":architecture.checklist(project_type)}
@app.get("/api/memory")
def get_memory(): return {"items":memory.load()}
@app.delete("/api/memory")
def clear_memory(): agent.reset(); memory.clear(); return {"status":"cleared"}
app.mount("/",StaticFiles(directory="static",html=True),name="static")
