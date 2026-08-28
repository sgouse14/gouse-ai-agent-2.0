import sqlite3,re
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
PROFESSIONAL_TYPES={'architect','builder','material_supplier'}
def words(text): return {w for w in re.findall(r'[a-z0-9]+',(text or '').lower()) if len(w)>2}
class MarketplaceStore:
 def __init__(self,path='data/gouse_ai.db'): self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True);self.initialize()
 def connect(self): return sqlite3.connect(self.path)
 def initialize(self):
  with self.connect() as db: db.executescript('''CREATE TABLE IF NOT EXISTS professional_profiles(id TEXT PRIMARY KEY,user_id TEXT UNIQUE NOT NULL,professional_type TEXT NOT NULL,name TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',bio TEXT NOT NULL DEFAULT '',services TEXT NOT NULL DEFAULT '',verified INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS marketplace_enquiries(id TEXT PRIMARY KEY,professional_id TEXT NOT NULL,client_user_id TEXT NOT NULL,project_title TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL);CREATE INDEX IF NOT EXISTS idx_profiles_type ON professional_profiles(professional_type);CREATE INDEX IF NOT EXISTS idx_enquiries_professional ON marketplace_enquiries(professional_id);''')
 def upsert_profile(self,user_id,data):
  kind=data['professional_type'];now=datetime.now(timezone.utc).isoformat()
  if kind not in PROFESSIONAL_TYPES: raise ValueError('Invalid professional type')
  with self.connect() as db:
   row=db.execute('SELECT id FROM professional_profiles WHERE user_id=?',(user_id,)).fetchone();profile_id=row[0] if row else uuid4().hex
   if row: db.execute('UPDATE professional_profiles SET professional_type=?,name=?,company=?,bio=?,services=?,updated_at=? WHERE id=?',(kind,data['name'],data.get('company',''),data.get('bio',''),data.get('services',''),now,profile_id))
   else: db.execute('INSERT INTO professional_profiles(id,user_id,professional_type,name,company,bio,services,verified,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',(profile_id,user_id,kind,data['name'],data.get('company',''),data.get('bio',''),data.get('services',''),0,now,now))
  return self.get_profile(profile_id)
 def get_profile(self,profile_id):
  with self.connect() as db: row=db.execute('SELECT id,user_id,professional_type,name,company,bio,services,verified,created_at,updated_at FROM professional_profiles WHERE id=?',(profile_id,)).fetchone()
  return dict(zip(['id','user_id','professional_type','name','company','bio','services','verified','created_at','updated_at'],row)) if row else None
 def my_profile(self,user_id):
  with self.connect() as db: row=db.execute('SELECT id FROM professional_profiles WHERE user_id=?',(user_id,)).fetchone()
  return self.get_profile(row[0]) if row else None
 def search(self,professional_type=None,query=''):
  if professional_type and professional_type not in PROFESSIONAL_TYPES: raise ValueError('Invalid professional type')
  sql='SELECT id FROM professional_profiles WHERE 1=1';args=[]
  if professional_type: sql+=' AND professional_type=?';args.append(professional_type)
  if query: sql+=' AND (lower(name) LIKE ? OR lower(company) LIKE ? OR lower(services) LIKE ? OR lower(bio) LIKE ?)';q='%'+query.lower()+'%';args += [q,q,q,q]
  sql+=' ORDER BY verified DESC, updated_at DESC LIMIT 100'
  with self.connect() as db: ids=[r[0] for r in db.execute(sql,args)]
  return [self.get_profile(x) for x in ids]
 def match(self,requirement,professional_type=None,limit=10):
  req=words(requirement);items=self.search(professional_type);scored=[]
  for p in items:
   text=' '.join(str(p.get(k,'')) for k in ('professional_type','name','company','bio','services'));hits=sorted(req & words(text));score=len(hits)*10+(15 if p.get('verified') else 0)
   if professional_type and p['professional_type']==professional_type: score+=5
   p={k:v for k,v in p.items() if k!='user_id'};p['match_score']=score;p['matching_terms']=hits;p['reason']='Matches: '+', '.join(hits) if hits else 'Professional type and profile match';scored.append(p)
  return sorted(scored,key=lambda x:(x['match_score'],x['verified']),reverse=True)[:max(1,min(limit,50))]
 def create_enquiry(self,professional_id,client_user_id,project_title,message):
  if not self.get_profile(professional_id): raise ValueError('Professional not found')
  enquiry={'id':uuid4().hex,'professional_id':professional_id,'client_user_id':client_user_id,'project_title':project_title,'message':message,'status':'open','created_at':datetime.now(timezone.utc).isoformat()}
  with self.connect() as db: db.execute('INSERT INTO marketplace_enquiries(id,professional_id,client_user_id,project_title,message,status,created_at) VALUES (?,?,?,?,?,?,?)',tuple(enquiry.values()))
  return enquiry
 def enquiries_for_professional(self,user_id):
  with self.connect() as db: rows=db.execute('SELECT e.id,e.professional_id,e.client_user_id,e.project_title,e.message,e.status,e.created_at FROM marketplace_enquiries e JOIN professional_profiles p ON p.id=e.professional_id WHERE p.user_id=? ORDER BY e.created_at DESC',(user_id,)).fetchall()
  return [dict(zip(['id','professional_id','client_user_id','project_title','message','status','created_at'],r)) for r in rows]
