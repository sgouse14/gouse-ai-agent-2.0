from pathlib import Path
from uuid import uuid4
from dataclasses import asdict
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Header
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr
from gouse_ai import GouseAIAgent
from gouse_ai.auth import AuthStore
from gouse_ai.audit import AuditLog
from gouse_ai.architecture import ArchitectureAnalyzer, Material
from gouse_ai.database import Database
from gouse_ai.documents import extract_text, validate_upload
from gouse_ai.intelligence import ProjectIntelligenceEngine
from gouse_ai.openai_client import OpenAIClient
from gouse_ai.memory import FileMemory
from gouse_ai.professional_analysis import ProfessionalArchitectureAnalyzer
from gouse_ai.projects import ProjectStore
from gouse_ai.reporting import ArchitectureReportAgent
from gouse_ai.vision import ArchitectureVisionAnalyzer, RenderPromptBuilder, VisionRequest
load_dotenv(); UPLOAD_DIR=Path('data/uploads'); UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
app=FastAPI(title='Gouse AI Architecture Agent',version='3.2.0')
agent=GouseAIAgent(OpenAIClient()); memory=FileMemory(); database=Database(); auth=AuthStore(); audit=AuditLog(); projects=ProjectStore(); architecture=ArchitectureAnalyzer(); professional=ProfessionalArchitectureAnalyzer(); report_agent=ArchitectureReportAgent(agent); intelligence=ProjectIntelligenceEngine(report_agent); vision=ArchitectureVisionAnalyzer(); render_prompts=RenderPromptBuilder()
class Credentials(BaseModel): email:EmailStr; password:str=Field(min_length=8,max_length=256)
class ProjectCreate(BaseModel): name:str; project_type:str='architecture'; location:str=''; description:str=''
class ProjectFileRequest(BaseModel): stored_file:str
class ProjectAnalysisRequest(BaseModel): title:str; analysis:str
class ProjectIntelligenceRequest(BaseModel): focus:str=''
class ProjectChatRequest(BaseModel): message:str
class ChatRequest(BaseModel): message:str
class TeamMemberRequest(BaseModel): email:EmailStr; role:str
class DocumentAnalysisRequest(BaseModel): stored_file:str; question:str=''
class VisionAnalysisRequest(BaseModel): stored_file:str; focus:str='General architectural analysis'
class RenderRequest(BaseModel): description:str; style:str='photorealistic'
class MaterialInput(BaseModel): name:str; category:str; unit:str=''; quantity:float|None=Field(default=None,ge=0); rate:float|None=Field(default=None,ge=0); notes:str=''
def current_user(authorization):
 if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Authentication required')
 user_id=auth.user_for_token(authorization[7:])
 if not user_id: raise HTTPException(401,'Invalid or expired session')
 return user_id
def require_subscription(authorization):
 user_id=current_user(authorization); subscription=auth.subscription_for_user(user_id)
 if not subscription['access']: raise HTTPException(402,'Your free trial has ended. A subscription is required to continue.')
 return user_id,subscription
def require_project(project_id,authorization,allowed=None):
 user_id,_=require_subscription(authorization); project=projects.get(project_id)
 if not project: raise HTTPException(404,'Project not found')
 role=auth.role_for_project(project_id,user_id)
 if not role: raise HTTPException(403,'Project access denied')
 if allowed and role not in allowed: raise HTTPException(403,'Insufficient project permission')
 return project,user_id,role
def uploaded_path(stored_file):
 filename=Path(stored_file).name
 if filename!=stored_file or not filename: raise HTTPException(400,'Invalid stored file')
 path=UPLOAD_DIR/filename
 if not path.exists(): raise HTTPException(404,'Uploaded file not found')
 return path
@app.get('/api/health')
def health(): return {'status':'ok','agent':'Gouse AI Architecture','database':'sqlite','authentication':'enabled','collaboration':'enabled','audit':'enabled','subscription':'six_month_trial'}
@app.post('/api/auth/register')
def register(request:Credentials):
 try: auth.register(uuid4().hex,request.email,request.password)
 except Exception: raise HTTPException(409,'Email already registered')
 return {'status':'registered','trial_days':183}
@app.post('/api/auth/login')
def login(request:Credentials):
 result=auth.login(request.email,request.password)
 if not result: raise HTTPException(401,'Invalid email or password')
 token,user_id=result; return {'token':token,'user_id':user_id,'subscription':auth.subscription_for_user(user_id)}
@app.get('/api/subscription')
def subscription(authorization:str|None=Header(default=None)):
 user_id=current_user(authorization); return auth.subscription_for_user(user_id)
@app.post('/api/projects')
def create_project(request:ProjectCreate,authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization); project=projects.create(**request.model_dump()); auth.set_project_owner(project.id,user_id); audit.add(project.id,user_id,'project_created',project.name); return asdict(project)
@app.get('/api/projects')
def list_projects(authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization); return {'projects':[asdict(p) for p in projects.list() if auth.role_for_project(p.id,user_id)]}
@app.get('/api/projects/{project_id}')
def get_project(project_id:str,authorization:str|None=Header(default=None)): return asdict(require_project(project_id,authorization)[0])
@app.get('/api/projects/{project_id}/activity')
def project_activity(project_id:str,authorization:str|None=Header(default=None)): require_project(project_id,authorization); return {'events':audit.list(project_id)}
@app.get('/api/projects/{project_id}/members')
def list_members(project_id:str,authorization:str|None=Header(default=None)): require_project(project_id,authorization); return {'members':auth.project_members(project_id)}
@app.post('/api/projects/{project_id}/members')
def add_member(project_id:str,request:TeamMemberRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization,{'owner'})
 try: auth.add_project_member(project_id,request.email,request.role)
 except ValueError as exc: raise HTTPException(400,str(exc))
 audit.add(project_id,user_id,'member_added',f'{request.email} as {request.role}'); return {'members':auth.project_members(project_id)}
@app.delete('/api/projects/{project_id}/members/{user_id}')
def remove_member(project_id:str,user_id:str,authorization:str|None=Header(default=None)):
 _,actor,_=require_project(project_id,authorization,{'owner'}); auth.remove_project_member(project_id,user_id); audit.add(project_id,actor,'member_removed',user_id); return {'members':auth.project_members(project_id)}
@app.post('/api/projects/{project_id}/professional-analysis')
def professional_project_analysis(project_id:str,authorization:str|None=Header(default=None)):
 project,user_id,_=require_project(project_id,authorization); result=professional.project_summary(project); result['findings']=professional.prioritize(result['findings']); audit.add(project_id,user_id,'professional_analysis','Professional project analysis run'); return result
@app.post('/api/projects/{project_id}/files')
def attach_project_file(project_id:str,request:ProjectFileRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'}); uploaded_path(request.stored_file)
 try: result=asdict(projects.add_file(project_id,request.stored_file))
 except KeyError: raise HTTPException(404,'Project not found')
 audit.add(project_id,user_id,'file_attached',request.stored_file); return result
@app.post('/api/projects/{project_id}/analyses')
def attach_project_analysis(project_id:str,request:ProjectAnalysisRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'})
 try: result=asdict(projects.add_analysis(project_id,request.title,request.analysis))
 except KeyError: raise HTTPException(404,'Project not found')
 audit.add(project_id,user_id,'analysis_added',request.title); return result
@app.post('/api/projects/{project_id}/intelligence')
def analyze_project(project_id:str,request:ProjectIntelligenceRequest,authorization:str|None=Header(default=None)):
 project,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'}); result=intelligence.analyze(project,UPLOAD_DIR,request.focus); projects.add_analysis(project_id,result['title'],result['analysis']); audit.add(project_id,user_id,'ai_intelligence_run',request.focus or 'General project intelligence'); return result
@app.post('/api/projects/{project_id}/chat')
def project_chat(project_id:str,request:ProjectChatRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization)
 if not request.message.strip(): raise HTTPException(400,'Message cannot be empty')
 history=database.get_memory(project_id,limit=20); context='\n'.join(f"{x['role']}: {x['content']}" for x in history); prompt=f'Project conversation history:\n{context}\n\nCurrent request: {request.message}' if context else request.message; response=agent.run(prompt); database.add_memory(project_id,'user',request.message); database.add_memory(project_id,'assistant',response.text); audit.add(project_id,user_id,'ai_chat','Project chat message'); return {'response':response.text,'project_id':project_id}
@app.get('/api/projects/{project_id}/memory')
def get_project_memory(project_id:str,authorization:str|None=Header(default=None)): require_project(project_id,authorization); return {'items':database.get_memory(project_id)}
@app.delete('/api/projects/{project_id}/memory')
def clear_project_memory(project_id:str,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'}); database.clear_memory(project_id); audit.add(project_id,user_id,'memory_cleared','Project AI memory cleared'); return {'status':'cleared','project_id':project_id}
@app.post('/api/chat')
def chat(request:ChatRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 if not request.message.strip(): raise HTTPException(400,'Message cannot be empty')
 memory.add('user',request.message); response=agent.run(request.message); memory.add('assistant',response.text); return {'response':response.text}
@app.post('/api/documents/upload')
async def upload_document(file:UploadFile=File(...),authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 if not file.filename: raise HTTPException(400,'A filename is required')
 try: validate_upload(file.filename)
 except ValueError as exc: raise HTTPException(400,str(exc))
 safe_name=f'{uuid4().hex}_{Path(file.filename).name}'; destination=UPLOAD_DIR/safe_name; destination.write_bytes(await file.read()); summary=extract_text(destination); return {'filename':file.filename,'stored_file':safe_name,'extension':summary.extension,'text_preview':summary.extracted_text[:5000],'characters_extracted':len(summary.extracted_text)}
@app.post('/api/architecture/analyze-document')
def analyze_document(request:DocumentAnalysisRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization); summary=extract_text(uploaded_path(request.stored_file))
 if not summary.extracted_text.strip(): raise HTTPException(422,'No analyzable text was extracted')
 report=report_agent.analyze(summary.extracted_text,summary.filename,request.question); return {'title':report.title,'analysis':report.analysis,'filename':summary.filename}
@app.post('/api/architecture/analyze-image')
def analyze_image(request:VisionAnalysisRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization); path=uploaded_path(request.stored_file)
 if path.suffix.lower() not in {'.png','.jpg','.jpeg','.webp'}: raise HTTPException(400,'Vision analysis requires an uploaded image')
 response=agent.run(vision.build_analysis_prompt(VisionRequest(str(path),request.focus))); return {'filename':path.name,'analysis':response.text}
@app.post('/api/architecture/render-prompt')
def create_render_prompt(request:RenderRequest,authorization:str|None=Header(default=None)): require_subscription(authorization); return {'prompt':render_prompts.build(request.description,request.style)}
@app.post('/api/architecture/materials/analyze')
def analyze_materials(materials:list[MaterialInput],authorization:str|None=Header(default=None)): require_subscription(authorization); return architecture.analyze_materials([Material(**x.model_dump()) for x in materials])
@app.post('/api/architecture/materials/professional-analysis')
def professional_material_analysis(materials:list[MaterialInput],authorization:str|None=Header(default=None)): require_subscription(authorization); result=professional.analyze_materials([Material(**x.model_dump()) for x in materials]); result['findings']=professional.prioritize(result['findings']); return result
@app.post('/api/architecture/materials/compare')
def compare_materials(materials:list[MaterialInput],authorization:str|None=Header(default=None)): require_subscription(authorization); return {'options':architecture.compare([Material(**x.model_dump()) for x in materials])}
@app.get('/api/architecture/checklist')
def architecture_checklist(project_type:str='architectural project',authorization:str|None=Header(default=None)): require_subscription(authorization); return {'items':architecture.checklist(project_type)}
@app.get('/api/memory')
def get_memory(authorization:str|None=Header(default=None)): require_subscription(authorization); return {'items':memory.load()}
@app.delete('/api/memory')
def clear_memory(authorization:str|None=Header(default=None)): require_subscription(authorization); agent.reset(); memory.clear(); return {'status':'cleared'}
app.mount('/',StaticFiles(directory='static',html=True),name='static')
