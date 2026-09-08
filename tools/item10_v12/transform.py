import copy,json
from collections import Counter
from .config import *

def clean_brand(s):
    if not isinstance(s,str):return s
    return s.replace('FAMILY NESTâ¢','FAMILY NEST™').replace('FAMILY NESTâ„¢','FAMILY NEST™')
def uniq(seq):
    out=[];seen=set()
    for x in seq:
        if x is None:continue
        if isinstance(x,str):x=x.strip()
        if x in ('',[]):continue
        k=json.dumps(x,sort_keys=True,ensure_ascii=False) if isinstance(x,(dict,list)) else str(x)
        if k not in seen:seen.add(k);out.append(x)
    return out
def dedupe(vs):
    out=[];seen=set()
    for v in vs:
        h=v.get('hash') or f"{v.get('source')}|{v.get('efdId')}|{v.get('docId')}|{v.get('score')}|{v.get('evidenceQuote','')[:120]}"
        if h not in seen:seen.add(h);out.append(copy.deepcopy(v))
    return out
def items(vs,key):
    a=[]
    for v in vs:
        x=v.get(key,[]);x=[x] if isinstance(x,str) else (x or []);a+=x
    return uniq(a)
def quote(vs):
    q=[(v.get('evidenceQuote') or '').strip() for v in vs if (v.get('evidenceQuote') or '').strip()]
    return max(q,key=len) if q else ''
def make(chain,brand,year,vs,base=None,forced=None,status=None,qc=None,rule='',action=None):
    vs=dedupe(vs);scores=uniq([v.get('score') for v in vs if v.get('score') is not None]);score=forced if forced is not None else (scores[0] if len(scores)==1 else None)
    sel=[v for v in vs if v.get('score')==score] if score is not None else vs
    if not sel:sel=vs
    base=base or {};acts=list(base.get('identityActions') or [])
    if action and action not in acts:acts.append(action)
    return {'id':f'{chain}::{int(year)}','chainId':chain,'brand':clean_brand(brand),'year':int(year),'score':score,'status':status or ('CONSENSUS' if score is not None else 'UNRESOLVED_SCORE_CONFLICT'),'paperReady':score is not None,'documents':len(vs) if base.get('documents') is None or len(vs)!=base.get('versions') else base.get('documents'),'versions':len(vs),'sources':uniq([v.get('source') for v in vs]),'forms':items(sel,'forms'),'providers':items(sel,'providers'),'purposes':items(sel,'purposes'),'evidenceQuote':quote(sel),'hasFullText':any(bool((v.get('item10Text') or '').strip()) for v in vs),'identityActions':acts,'v1_2_qc_status':qc or ('UNCHANGED_V1_1' if base else 'V1_2_CREATED'),'v1_2_resolution_rule':rule}

def transform(base_rows,base_details):
    base_rows=copy.deepcopy(base_rows);base_details=copy.deepcopy(base_details)
    for r in base_rows:r['brand']=clean_brand(r['brand'])
    original=[copy.deepcopy(r) for r in base_rows if r.get('status')=='UNRESOLVED_SCORE_CONFLICT'];assert len(base_rows)==13222 and len(original)==155
    num={i+1:r for i,r in enumerate(original)};rm={r['id']:r for r in base_rows};dm=base_details
    for r in rm.values():r.setdefault('v1_2_qc_status','UNCHANGED_V1_1');r.setdefault('v1_2_resolution_rule','')
    def vs(i):return dedupe((dm.get(i,{}) or {}).get('versions') or [])
    def put(r,v):rm[r['id']]=r;dm[r['id']]={'id':r['id'],'brand':r['brand'],'year':r['year'],'score':r['score'],'status':r['status'],'versions':dedupe(v)}
    def delete(i):rm.pop(i,None);dm.pop(i,None)
    def merge(t,extra,qc='IDENTITY_SPLIT_RESOLVED_V1_2',rule='V1.2 offering-scope reconciliation'):
        b=rm[t];v=vs(t)+list(extra);r=make(b['chainId'],b['brand'],b['year'],v,b,qc=qc,rule=rule,action='V1_2_SCOPE_RECONCILIATION');put(r,v);return r
    def remap(old,chain,brand,qc,rule):
        b=rm[old];v=vs(old);delete(old);r=make(chain,brand,b['year'],v,b,qc=qc,rule=rule,action='V1_2_IDENTITY_REMAP');put(r,v);return r
    def split(old,parts,rule):
        b=rm[old];allv=vs(old);delete(old);assigned=[];out=[]
        for p in parts:
            sv=[v for v in allv if p['sel'](v)];assigned += [v.get('hash') for v in sv]
            if not sv:raise RuntimeError(f'No split versions {old} {p}')
            tid=f"{p['chain']}::{b['year']}"
            if tid in rm:r=merge(tid,sv,p.get('qc','IDENTITY_SPLIT_RESOLVED_V1_2'),rule)
            else:r=make(p['chain'],p['brand'],b['year'],sv,b,p.get('score'),p.get('status'),p.get('qc','IDENTITY_SPLIT_RESOLVED_V1_2'),rule,'V1_2_OFFERING_SPLIT');put(r,sv)
            out.append(r)
        if not set(v.get('hash') for v in allv).issubset(set(assigned)):raise RuntimeError(f'Unassigned split versions {old}')
        return out
    A='U_47621ef6::2025';B='U_46c577ea::2025';mv=vs(A)+vs(B);a=rm[A];delete(B);put(make('U_47621ef6','1 Percent Lists',2025,mv,a,qc='IDENTITY_CONSOLIDATED_V1_2',rule='Consolidated duplicate 2025 identities 1 Percent Lists / 1% Lists before chronology adjudication.',action='V1_2_IDENTITY_CONSOLIDATION'),mv)
    for n,sc in CHRONOLOGY_SCORES.items():
        oid=A if n==1 else num[n]['id'];b=rm[oid];v=vs(oid);put(make(b['chainId'],b['brand'],b['year'],v,b,sc,'CHRONOLOGY_RESOLVED_V1_2','CHRONOLOGY_RESOLUTION',f'Latest controlling amendment/version within the same offering is unambiguous; V1.2 selects RiskScore {sc}.','V1_2_CHRONOLOGY_PASS'),v)
    efd=lambda *x:(lambda v:str(v.get('efdId') or '') in set(x));score=lambda x:(lambda v:v.get('score')==x)
    split(num[4]['id'],[{'chain':'S0069','brand':'ActionCOACH OneCo, LLC - Business Coach Offering','sel':lambda v:str(v.get('efdId'))=='EFD436542' or v.get('score')==0,'score':0},{'chain':'R_S0069_MASTER','brand':'ActionCOACH - Master License Offering','sel':lambda v:str(v.get('efdId'))=='EFD436508' or v.get('score')==2,'score':2}],'Distinct Business Coach and Master License FDDs were incorrectly aggregated into one chain-year.')
    remap(num[12]['id'],'S7513','Curry Pizza House (Area Rep)','IDENTITY_REMAP_RETAINED_NA_V1_2','Generic Area Representative identity remapped to Curry Pizza House (Area Rep); conflicting versions remain, so score stays NA.')
    for n in (16,17):split(num[n]['id'],[{'chain':'S6962','brand':'Barrio Burrito Bar - Unit / Single Franchise','sel':lambda v:str(v.get('efdId'))!='EFD494279','score':0},{'chain':'R_BARRIO_MASTER','brand':'Barrio Burrito Bar - Master Franchise','sel':lambda v:str(v.get('efdId'))=='EFD494279','score':2}],'Unit/single and Master Franchise FDDs are distinct offerings.')
    for n in (36,37,38):split(num[n]['id'],[{'chain':'S5362','brand':'DivaDance - Unit','sel':lambda v:str(v.get('efdId'))!='EFD532385' and not (v.get('source')=='WI' and v.get('score')==0),'score':2},{'chain':'R_S5362_AREA_REP','brand':'DivaDance - Area Representative','sel':lambda v:str(v.get('efdId'))=='EFD532385' or (v.get('source')=='WI' and v.get('score')==0),'score':0}],'DivaDance Unit and Area Representative FDDs are distinct offerings.')
    split(num[45]['id'],[{'chain':'S0616','brand':'FYZICAL - Unit Franchise Program','sel':lambda v:str(v.get('efdId'))!='EFD440333','qc':'OFFERING_SPLIT_RETAINED_NA_V1_2'},{'chain':'R_S0616_AREA_REP','brand':'FYZICAL - Area Representative Program','sel':lambda v:str(v.get('efdId'))=='EFD440333','score':2}],'FYZICAL Unit and Area Representative programs are split; Unit retains an internal 0 vs 2 conflict.')
    for n in (59,60,61,62,63):split(num[n]['id'],[{'chain':'S0846','brand':'IHOP - Traditional Program','sel':lambda v:str(v.get('efdId')) not in {'EFD436506','EFD509985'},'score':4},{'chain':'R_S0846_NONTRAD','brand':'IHOP - Non-Traditional Program','sel':lambda v:str(v.get('efdId')) in {'EFD436506','EFD509985'},'score':0}],'Traditional and Non-Traditional IHOP FDDs are distinct programs.')
    oid=num[73]['id'];b=rm[oid];v=vs(oid);delete(oid);ar=[x for x in v if x.get('score')==0];bv=[x for x in v if x.get('score')==2];put(make('U_2b5decdd','Ledgers - Area Representative',2023,ar,b,0,'IDENTITY_SPLIT_RESOLVED_V1_2','OFFERING_REASSIGNMENT','Score-0 Area Representative version retained; score-2 version reassigned to existing Ledgers base identity.','V1_2_OFFERING_REASSIGNMENT'),ar);merge('U_74ea0954::2023',bv,'OFFERING_REASSIGNMENT','Received score-2 version reassigned from misaggregated Ledgers Area Representative row.')
    split(num[75]['id'],[{'chain':'S6426','brand':'Live Hydration Spa - Area Representative','sel':efd('EFD482062'),'score':0},{'chain':'R_S6426_UNIT','brand':'Live Hydration Spa - Unit Franchise','sel':efd('EFD442630'),'qc':'OFFERING_SPLIT_RETAINED_NA_V1_2'}],'Area Representative and Unit FDDs are split; Unit retains a substantive 0 vs 2 version conflict.')
    split(num[95]['id'],[{'chain':'S6636','brand':'Pet Evolution - Unit Offering','sel':efd('EFD430268'),'score':2},{'chain':'R_S6636_RD','brand':'Pet Evolution - Regional Development Offering','sel':efd('EFD430271'),'score':0}],'Pet Evolution Unit and Regional Development FDDs are distinct offerings.')
    split(num[99]['id'],[{'chain':'S1313','brand':'Pizza Hut - Express / Non-Traditional','sel':efd('EFD510117'),'score':0},{'chain':'R_S1313_TRAD','brand':'Pizza Hut - Traditional','sel':efd('EFD510115'),'score':3}],'Pizza Hut Express/Non-Traditional and Traditional FDDs are distinct offerings.')
    split(num[110]['id'],[{'chain':'S2569','brand':'Scissors & Scotch - Unit','sel':efd('EFD444567'),'score':0},{'chain':'R_S2569_AREA_REP','brand':'Scissors & Scotch - Area Representative','sel':efd('EFD446106'),'score':1}],'Scissors & Scotch Unit and Area Representative FDDs are distinct offerings.')
    for n in (123,124,125):split(num[n]['id'],[{'chain':'R_STEAKNSHAKE_STD','brand':'Steak n Shake - By Biglari / Standard Program','sel':score(1),'score':1,'qc':'OFFERING_SPLIT_AND_IDENTITY_STABILIZATION'},{'chain':'R_STEAKNSHAKE_PARTNER','brand':'Steak n Shake - Franchise Partner Program','sel':score(4),'score':4,'qc':'OFFERING_SPLIT_AND_IDENTITY_STABILIZATION'}],'Two recurring Steak n Shake programs are stabilized as separate longitudinal identities.')
    for n in (143,144,145,146):split(num[n]['id'],[{'chain':'S3620','brand':'Toro Taxes - Area Representative Offering','sel':lambda v:str(v.get('efdId'))!='EFD445903' or (not v.get('efdId') and v.get('score')==2),'score':2,'qc':'OFFERING_SPLIT_PLUS_YEAR_QC' if n==146 else 'IDENTITY_SPLIT_RESOLVED_V1_2'},{'chain':'R_TORO_TAXES_UNIT','brand':'Toro Taxes - Unit Offering','sel':lambda v:str(v.get('efdId'))=='EFD445903' or (not v.get('efdId') and v.get('score')==4),'score':4,'qc':'OFFERING_SPLIT_PLUS_YEAR_QC' if n==146 else 'IDENTITY_SPLIT_RESOLVED_V1_2'}],'Toro Taxes Unit and Area Representative FDDs are distinct offerings; 2026 also receives year/metadata QC.')
    for n,r0 in num.items():
        if n in CHRONOLOGY_SCORES or n in SCOPE or n==2:continue
        oid=r0['id']
        if oid not in rm or rm[oid].get('score') is not None:continue
        r=rm[oid]
        if n in PARALLEL:q='SAME_STATE_SAME_DATE_PARALLEL_RETAINED';rule='Parallel versions cannot be safely ordered by chronology; national offering/system-year remains NA.'
        elif n in VERIFIED_STATE:q='VERIFIED_STATE_SPECIFIC_RETAINED';rule='Valid state/source-specific Item 10 versions disclose substantively different financing support; national offering/system-year remains NA.'
        elif n in IDENTITY_REVIEW:q='IDENTITY_REVIEW_RETAINED';rule='Identity/year evidence remains insufficient for a safe national offering/system-year score.'
        elif n in CHRONOLOGY_CANDIDATE:q='CHRONOLOGY_CANDIDATE_NEEDS_SCOPE_CHECK';rule='A later-looking version exists, but supersession/offering scope is not sufficiently established to force a score.'
        else:q='METADATA_INSUFFICIENT_RETAINED';rule='Available filing metadata is insufficient to establish safe chronology, state applicability, or offering control; score remains NA.'
        r['v1_2_qc_status']=q;r['v1_2_resolution_rule']=rule
    rows=sorted(rm.values(),key=lambda r:(str(r['brand']).casefold(),int(r['year']),str(r['chainId'])))
    for r in rows:
        r['brand']=clean_brand(r['brand'])
        if r.get('score') is None:r['status']='UNRESOLVED_SCORE_CONFLICT';r['paperReady']=False
    paper=[r for r in rows if r.get('paperReady') and r.get('score') is not None];unres=[r for r in rows if not r.get('paperReady')]
    assert (len(rows),len(paper),len(unres))==(13237,13124,113),(len(rows),len(paper),len(unres))
    assert Counter(int(r['score']) for r in paper)==Counter({0:8739,1:765,2:1737,3:370,4:1513})
    return rows,dm,num
