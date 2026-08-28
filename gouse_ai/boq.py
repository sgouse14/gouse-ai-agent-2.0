from dataclasses import dataclass,asdict
from uuid import uuid4
from datetime import datetime,timezone
import json,re
@dataclass
class BOQItem:
 id:str;name:str;category:str;unit:str;quantity:float;rate:float;notes:str=''
 @property
 def amount(self): return round(self.quantity*self.rate,2)
class BOQEngine:
 def build(self,items,contingency=0):
  rows=[]
  for item in items:
   q=max(0,float(item.get('quantity',0)));r=max(0,float(item.get('rate',0)))
   x=BOQItem(item.get('id') or uuid4().hex,item['name'],item.get('category','general'),item.get('unit','nos'),q,r,item.get('notes',''))
   d=asdict(x);d['amount']=x.amount;rows.append(d)
  subtotal=round(sum(x['amount'] for x in rows),2);cont=max(0,min(float(contingency),100));reserve=round(subtotal*cont/100,2);categories={}
  for x in rows: categories[x['category']]=round(categories.get(x['category'],0)+x['amount'],2)
  return {'items':rows,'subtotal':subtotal,'contingency_percent':cont,'contingency_amount':reserve,'total':round(subtotal+reserve,2),'category_totals':categories,'generated_at':datetime.now(timezone.utc).isoformat()}
 def summary(self,result): return {'line_items':len(result['items']),'subtotal':result['subtotal'],'contingency_amount':result['contingency_amount'],'estimated_total':result['total'],'categories':result['category_totals']}
 def generation_prompt(self,description,document_text=''):
  return f'''You are a construction BOQ assistant. Generate a preliminary bill of quantities from the project description and optional document text. Do not invent exact engineering measurements when they are unavailable. Use quantity 0 for unknown quantities and explain assumptions in notes. Return ONLY valid JSON with this shape: {{"project_summary":"...","assumptions":["..."],"items":[{{"name":"...","category":"...","unit":"...","quantity":0,"notes":"..."}}]}}.\nProject description:\n{description}\nOptional document text:\n{document_text[:12000]}'''
 def parse_generated(self,text):
  raw=text.strip();match=re.search(r'\{.*\}',raw,re.S)
  if not match: raise ValueError('AI did not return a BOQ structure')
  data=json.loads(match.group(0));items=[]
  for x in data.get('items',[])[:200]:
   name=str(x.get('name','')).strip()
   if name: items.append({'name':name,'category':str(x.get('category','general')),'unit':str(x.get('unit','nos')),'quantity':max(0,float(x.get('quantity',0) or 0)),'notes':str(x.get('notes',''))})
  if not items: raise ValueError('No BOQ items were generated')
  return {'project_summary':str(data.get('project_summary','')),'assumptions':[str(x) for x in data.get('assumptions',[])[:50]],'items':items}