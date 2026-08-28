import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

PROFESSIONAL_TYPES={'architect','builder','material_supplier'}

class MarketplaceStore:
    def __init__(self,path='data/gouse_ai.db'):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True); self.initialize()
    def connect(self): return sqlite3.connect(self.path)
    def initialize(self):
        with self.connect() as db:
            db.executescript('''CREATE TABLE IF NOT EXISTS professional_profiles(id TEXT PRIMARY KEY,user_id TEXT UNIQUE NOT NULL,professional_type TEXT NOT NULL,name TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',bio TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',services TEXT NOT NULL DEFAULT '',verified INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS marketplace_enquiries(id TEXT PRIMARY KEY,professional_id TEXT NOT NULL,client_user_id TEXT NOT NULL,project_title TEXT NOT NULL,message TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL);CREATE INDEX IF NOT EXISTS idx_profiles_type_location ON professional_profiles(professional_type,location);CREATE INDEX IF NOT EXISTS idx_enquiries_professional ON marketplace_enquiries(professional_id);''')
    def upsert_profile(self,user_id,data):
        kind=data['professional_type']
        if kind not in PROFESSIONAL_TYPES: raise ValueError('Invalid professional type')
        now=datetime.now(timezone.utc).isoformat()
        with self.connect() as db:
            row=db.execute('SELECT id,verified,created_at FROM professional_profiles WHERE user_id=?',(user_id,)).fetchone()
            if row:
                profile_id,verified,created=row
                db.execute('UPDATE professional_profiles SET professional_type=?,name=?,company=?,bio=?,location=?,phone=?,services=?,updated_at=? WHERE id=?',(kind,data['name'],data.get('company',''),data.get('bio',''),data.get('location',''),data.get('phone',''),data.get('services',''),now,profile_id))
            else:
                profile_id=uuid4().hex; verified=0; created=now
                db.execute('INSERT INTO professional_profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',(profile_id,user_id,kind,data['name'],data.get('company',''),data.get('bio',''),data.get('location',''),data.get('phone',''),data.get('services',''),verified,created,now))
        return self.get_profile(profile_id)
    def get_profile(self,profile_id):
        with self.connect() as db: row=db.execute('SELECT id,user_id,professional_type,name,company,bio,location,phone,services,verified,created_at,updated_at FROM professional_profiles WHERE id=?',(profile_id,)).fetchone()
        if not row:return None
        keys=['id','user_id','professional_type','name','company','bio','location','phone','services','verified','created_at','updated_at']; return dict(zip(keys,row))
    def my_profile(self,user_id):
        with self.connect() as db: row=db.execute('SELECT id FROM professional_profiles WHERE user_id=?',(user_id,)).fetchone()
        return self.get_profile(row[0]) if row else None
    def search(self,professional_type=None,location='',query=''):
        sql='SELECT id FROM professional_profiles WHERE 1=1'; args=[]
        if professional_type:
            if professional_type not in PROFESSIONAL_TYPES: raise ValueError('Invalid professional type')
            sql+=' AND professional_type=?'; args.append(professional_type)
        if location: sql+=' AND lower(location) LIKE ?'; args.append('%'+location.lower()+'%')
        if query: sql+=' AND (lower(name) LIKE ? OR lower(company) LIKE ? OR lower(services) LIKE ? OR lower(bio) LIKE ?)'; q='%'+query.lower()+'%'; args += [q,q,q,q]
        sql+=' ORDER BY verified DESC, updated_at DESC LIMIT 100'
        with self.connect() as db: ids=[r[0] for r in db.execute(sql,args).fetchall()]
        return [self.get_profile(x) for x in ids]
    def create_enquiry(self,professional_id,client_user_id,project_title,message,location=''):
        if not self.get_profile(professional_id): raise ValueError('Professional not found')
        enquiry={'id':uuid4().hex,'professional_id':professional_id,'client_user_id':client_user_id,'project_title':project_title,'message':message,'location':location,'status':'open','created_at':datetime.now(timezone.utc).isoformat()}
        with self.connect() as db: db.execute('INSERT INTO marketplace_enquiries VALUES (?,?,?,?,?,?,?,?)',tuple(enquiry.values()))
        return enquiry
    def enquiries_for_professional(self,user_id):
        with self.connect() as db: rows=db.execute('SELECT e.id,e.professional_id,e.client_user_id,e.project_title,e.message,e.location,e.status,e.created_at FROM marketplace_enquiries e JOIN professional_profiles p ON p.id=e.professional_id WHERE p.user_id=? ORDER BY e.created_at DESC',(user_id,)).fetchall()
        keys=['id','professional_id','client_user_id','project_title','message','location','status','created_at']; return [dict(zip(keys,r)) for r in rows]
