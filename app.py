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
from gouse_ai.boq import BOQEngine
from gouse_ai.database import Database
from gouse_ai.documents import extract_text, validate_upload
from gouse_ai.intelligence import ProjectIntelligenceEngine
from gouse_ai.openai_client import OpenAIClient
from gouse_ai.memory import FileMemory
from gouse_ai.projects import ProjectStore
from gouse_ai.reporting import ArchitectureReportAgent
from gouse_ai.vision import ArchitectureVisionAnalyzer, RenderPromptBuilder, VisionRequest
from gouse_ai.marketplace import MarketplaceStore, ENQUIRY_STATUSES
load_dotenv(); UPLOAD_DIR=Path('data/uploads'); UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
app=FastAPI(title='Gouse AI Architecture Agent',version='3.7.0')
agent=GouseAIAgent(OpenAIClient()); memory=FileMemory(); database=Database(); auth=AuthStore(); audit=AuditLog(); projects=ProjectStore(); architecture=ArchitectureAnalyzer(); boq=BOQEngine(); report_agent=ArchitectureReportAgent(agent); intelligence=ProjectIntelligenceEngine(report_agent); vision=ArchitectureVisionAnalyzer(); render_prompts=RenderPromptBuilder(); marketplace=MarketplaceStore()
class Credentials(BaseModel): email:EmailStr; password:str=Field(min_length=8,max_length=256)
class ProjectCreate(BaseModel): name:str; project_type:str='architecture'; location:str=''; description:str=''
class ProjectFileRequest(BaseModel): stored_file:str
class ProjectIntelligenceRequest(BaseModel): focus:str=''
class ProjectChatRequest(BaseModel): message:str
class ChatRequest(BaseModel): message:str
class TeamMemberRequest(BaseModel): email:EmailStr; role:str
class DocumentAnalysisRequest(BaseModel): stored_file:str; question:str=''
class VisionAnalysisRequest(BaseModel): stored_file:str; focus:str='General architectural analysis'
class RenderRequest(BaseModel): description:str; style:str='photorealistic'
class MaterialInput(BaseModel): name:str; category:str; unit:str=''; quantity:float|None=Field(default=None,ge=0); rate:float|None=Field(default=None,ge=0); notes:str=''
class BOQLineInput(BaseModel): name:str=Field(min_length=2); category:str='general'; unit:str='nos'; quantity:float=Field(ge=0); rate:float=Field(ge=0); notes:str=''
class BOQRequest(BaseModel): items:list[BOQLineInput]=Field(min_length=1,max_length=1000); contingency_percent:float=Field(default=0,ge=0,le=100)
class ProfessionalProfileInput(BaseModel): professional_type:str; name:str=Field(min_length=2); company:str=''; bio:str=''; services:str=''
class EnquiryInput(BaseModel): project_title:str=Field(min_length=2); message:str=Field(min_length=2)
class MatchRequest(BaseModel): requirement:str=Field(min_length=3); professional_type:str|None=None; limit:int=Field(default=10,ge=1,le=50)
class EnquiryStatusInput(BaseModel): status:str
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
def health(): return {'status':'ok','agent':'Gouse AI Architecture','marketplace':'enabled','matching':'enabled','enquiry_management':'enabled','boq_cost_estimation':'enabled','subscription':'six_month_trial'}
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
def subscription(authorization:str|None=Header(default=None)): return auth.subscription_for_user(current_user(authorization))
@app.post('/api/boq/estimate')
def estimate_boq(request:BOQRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization); result=boq.build([x.model_dump() for x in request.items],request.contingency_percent); return {'estimate':result,'summary':boq.summary(result)}
@app.put('/api/marketplace/profile')
def save_profile(request:ProfessionalProfileInput,authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization)
 try:return marketplace.upsert_profile(user_id,request.model_dump())
 except ValueError as e:raise HTTPException(400,str(e))
@app.get('/api/marketplace/profile')
def my_profile(authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization); return {'profile':marketplace.my_profile(user_id)}
@app.get('/api/marketplace/professionals')
def find_professionals(professional_type:str|None=None,query:str='',authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 try:
  result=marketplace.search(professional_type,query)
  for p in result:p.pop('user_id',None)
  return {'professionals':result}
 except ValueError as e:raise HTTPException(400,str(e))
@app.post('/api/marketplace/match')
def match_professionals(request:MatchRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 try:return {'requirement':request.requirement,'matches':marketplace.match(request.requirement,request.professional_type,request.limit)}
 except ValueError as e:raise HTTPException(400,str(e))
@app.get('/api/marketplace/professionals/{profile_id}')
def professional_profile(profile_id:str,authorization:str|None=Header(default=None)):
 require_subscription(authorization); profile=marketplace.get_profile(profile_id)
 if not profile:raise HTTPException(404,'Professional not found')
 profile.pop('user_id',None); return profile
@app.post('/api/marketplace/professionals/{profile_id}/enquiries')
def create_enquiry(profile_id:str,request:EnquiryInput,authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization)
 try:return marketplace.create_enquiry(profile_id,user_id,request.project_title,request.message)
 except ValueError as e:raise HTTPException(404,str(e))
@app.get('/api/marketplace/enquiries')
def marketplace_enquiries(authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization); return {'enquiries':marketplace.enquiries_for_professional(user_id),'statuses':sorted(ENQUIRY_STATUSES)}
@app.put('/api/marketplace/enquiries/{enquiry_id}/status')
def update_enquiry_status(enquiry_id:str,request:EnquiryStatusInput,authorization:str|None=Header(default=None)):
 user_id,_=require_subscription(authorization)
 try:return marketplace.update_enquiry_status(enquiry_id,user_id,request.status)
 except ValueError as e:raise HTTPException(400,str(e))
 except LookupError as e:raise HTTPException(404,str(e))
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
@app.post('/api/projects/{project_id}/intelligence')
def analyze_project(project_id:str,request:ProjectIntelligenceRequest,authorization:str|None=Header(default=None)):
 project,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'}); result=intelligence.analyze(project,UPLOAD_DIR,request.focus); projects.add_analysis(project_id,result['title'],result['analysis']); audit.add(project_id,user_id,'ai_intelligence_run',request.focus or 'General project intelligence'); return result
@app.post('/api/projects/{project_id}/files')
def attach_project_file(project_id:str,request:ProjectFileRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization,{'owner','architect','engineer'}); uploaded_path(request.stored_file); result=asdict(projects.add_file(project_id,request.stored_file)); audit.add(project_id,user_id,'file_attached',request.stored_file); return result
@app.post('/api/projects/{project_id}/chat')
def project_chat(project_id:str,request:ProjectChatRequest,authorization:str|None=Header(default=None)):
 _,user_id,_=require_project(project_id,authorization)
 if not request.message.strip(): raise HTTPException(400,'Message cannot be empty')
 history=database.get_memory(project_id,limit=20); context='\n'.join(f"{x['role']}: {x['content']}" for x in history); prompt=f'Project conversation history:\n{context}\n\nCurrent request: {request.message}' if context else request.message; response=agent.run(prompt); database.add_memory(project_id,'user',request.message); database.add_memory(project_id,'assistant',response.text); audit.add(project_id,user_id,'ai_chat','Project chat message'); return {'response':response.text,'project_id':project_id}
@app.post('/api/chat')
def chat(request:ChatRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 if not request.message.strip(): raise HTTPException(400,'Message cannot be empty')
 memory.add('user',request.message); response=agent.run(request.message); memory.add('assistant',response.text); return {'response':response.text}
@app.post('/api/documents/upload')
async def upload_document(file:UploadFile=File(...),authorization:str|None=Header(default=None)):
 require_subscription(authorization)
 if not file.filename: raise HTTPException(400,'A filename is required')
 validate_upload(file.filename); safe_name=f'{uuid4().hex}_{Path(file.filename).name}'; destination=UPLOAD_DIR/safe_name; destination.write_bytes(await file.read()); summary=extract_text(destination); return {'filename':file.filename,'stored_file':safe_name,'extension':summary.extension,'text_preview':summary.extracted_text[:5000],'characters_extracted':len(summary.extracted_text)}
@app.post('/api/architecture/analyze-document')
def analyze_document(request:DocumentAnalysisRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization); summary=extract_text(uploaded_path(request.stored_file)); report=report_agent.analyze(summary.extracted_text,summary.filename,request.question); return {'title':report.title,'analysis':report.analysis,'filename':summary.filename}
@app.post('/api/architecture/analyze-image')
def analyze_image(request:VisionAnalysisRequest,authorization:str|None=Header(default=None)):
 require_subscription(authorization); path=uploaded_path(request.stored_file)
 if path.suffix.lower() not in {'.png','.jpg','.jpeg','.webp'}: raise HTTPException(400,'Vision analysis requires an uploaded image')
 return {'filename':path.name,'analysis':agent.run(vision.build_analysis_prompt(VisionRequest(str(path),request.focus))).text}
@app.post('/api/architecture/render-prompt')
def create_render_prompt(request:RenderRequest,authorization:str|None=Header(default=None)): require_subscription(authorization); return {'prompt':render_prompts.build(request.description,request.style)}
@app.post('/api/architecture/materials/analyze')
def analyze_materials(materials:list[MaterialInput],authorization:str|None=Header(default=None)): require_subscription(authorization); return architecture.analyze_materials([Material(**x.model_dump()) for x in materials])
@app.post('/api/architecture/materials/compare')
def compare_materials(materials:list[MaterialInput],authorization:str|None=Header(default=None)): require_subscription(authorization); return {'options':architecture.compare([Material(**x.model_dump()) for x in materials])}
@app.get('/api/architecture/checklist')
def architecture_checklist(project_type:str='architectural project',authorization:str|None=Header(default=None)): require_subscription(authorization); return {'items':architecture.checklist(project_type)}
app.mount('/',StaticFiles(directory='static',html=True),name='static')
