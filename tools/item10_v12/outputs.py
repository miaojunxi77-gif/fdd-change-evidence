import csv,json
from pathlib import Path
from collections import Counter,defaultdict
from .config import *
from .transform import clean_brand

BRAND_FIELDS=['canonical_chain_id','canonical_chain_name','year','final_risk_score','final_score_status','paper_ready','n_documents','n_unique_item10_versions','sources','final_forms','providers','purposes','evidence_quote','full_item10_text_available','v1_2_qc_status','v1_2_resolution_rule']

def write_csv(p,rows,fields):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    with open(p,'w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(rows)
def write_json(p,obj):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    with open(p,'w',encoding='utf-8') as f:json.dump(obj,f,ensure_ascii=False,indent=2)

def qc_class(n):
    if n in CHRONOLOGY_SCORES:return 'CHRONOLOGY_RESOLUTION'
    if n==2:return 'IDENTITY_CONSOLIDATION'
    if n in SCOPE:return SCOPE_SUBCLASS.get(n,'OFFERING_SPLIT')
    if n in VERIFIED_STATE:return 'VERIFIED_STATE_SPECIFIC_RETAINED'
    if n in PARALLEL:return 'SAME_STATE_SAME_DATE_PARALLEL_RETAINED'
    if n in CHRONOLOGY_CANDIDATE:return 'CHRONOLOGY_CANDIDATE_NEEDS_SCOPE_CHECK'
    if n in IDENTITY_REVIEW:return 'IDENTITY_REVIEW_RETAINED'
    return 'METADATA_INSUFFICIENT_RETAINED'
def reason(c,n):
    if c=='CHRONOLOGY_RESOLUTION':return f'Unambiguous within-offering chronology identifies the controlling later amendment/version; RiskScore {CHRONOLOGY_SCORES[n]} selected.'
    if c=='IDENTITY_CONSOLIDATION':return 'Duplicate 1 Percent Lists / 1% Lists 2025 identities consolidated before chronology adjudication.'
    if c.startswith('OFFERING_SPLIT'):return 'Distinct offering/program identities were incorrectly pooled in V1.1; V1.2 separates them before scoring.'
    if c=='OFFERING_REASSIGNMENT':return 'One version belongs to another existing offering identity and is reassigned rather than treated as a temporal conflict.'
    if c=='IDENTITY_REMAP':return 'Generic/misbucketed identity was remapped to the correct franchise offering; remaining score conflict is preserved as NA.'
    if c=='VERIFIED_STATE_SPECIFIC_RETAINED':return 'Valid state/source-specific versions contain substantive Item 10 differences; no national controlling version is imposed.'
    if c=='SAME_STATE_SAME_DATE_PARALLEL_RETAINED':return 'Parallel versions cannot be safely ordered by chronology; score remains NA.'
    if c=='CHRONOLOGY_CANDIDATE_NEEDS_SCOPE_CHECK':return 'Later-looking version exists but amendment scope/supersession is not strong enough to force a score.'
    if c=='IDENTITY_REVIEW_RETAINED':return 'Identity/year evidence remains insufficient for safe adjudication; score remains NA.'
    return 'Filing metadata is insufficient to establish chronology, state applicability, or offering control; score remains NA.'
def targets(n,r0):
    y=r0['year'];A='U_47621ef6::2025'
    m={2:[A],4:[f'S0069::{y}',f'R_S0069_MASTER::{y}'],12:[f'S7513::{y}'],16:[f'S6962::{y}',f'R_BARRIO_MASTER::{y}'],17:[f'S6962::{y}',f'R_BARRIO_MASTER::{y}'],36:[f'S5362::{y}',f'R_S5362_AREA_REP::{y}'],37:[f'S5362::{y}',f'R_S5362_AREA_REP::{y}'],38:[f'S5362::{y}',f'R_S5362_AREA_REP::{y}'],45:[f'S0616::{y}',f'R_S0616_AREA_REP::{y}'],59:[f'S0846::{y}',f'R_S0846_NONTRAD::{y}'],60:[f'S0846::{y}',f'R_S0846_NONTRAD::{y}'],61:[f'S0846::{y}',f'R_S0846_NONTRAD::{y}'],62:[f'S0846::{y}',f'R_S0846_NONTRAD::{y}'],63:[f'S0846::{y}',f'R_S0846_NONTRAD::{y}'],73:[f'U_2b5decdd::{y}',f'U_74ea0954::{y}'],75:[f'S6426::{y}',f'R_S6426_UNIT::{y}'],95:[f'S6636::{y}',f'R_S6636_RD::{y}'],99:[f'S1313::{y}',f'R_S1313_TRAD::{y}'],110:[f'S2569::{y}',f'R_S2569_AREA_REP::{y}'],123:[f'R_STEAKNSHAKE_STD::{y}',f'R_STEAKNSHAKE_PARTNER::{y}'],124:[f'R_STEAKNSHAKE_STD::{y}',f'R_STEAKNSHAKE_PARTNER::{y}'],125:[f'R_STEAKNSHAKE_STD::{y}',f'R_STEAKNSHAKE_PARTNER::{y}'],143:[f'S3620::{y}',f'R_TORO_TAXES_UNIT::{y}'],144:[f'S3620::{y}',f'R_TORO_TAXES_UNIT::{y}'],145:[f'S3620::{y}',f'R_TORO_TAXES_UNIT::{y}'],146:[f'S3620::{y}',f'R_TORO_TAXES_UNIT::{y}']}
    return m.get(n,[r0['id'] if r0['id']!='U_46c577ea::2025' else A])

def build(rows,details,orig_num):
    rm={r['id']:r for r in rows};paper=[r for r in rows if r.get('paperReady') and r.get('score') is not None];unresolved=[r for r in rows if not r.get('paperReady')]
    brand=[]
    for r in rows:
        brand.append({'canonical_chain_id':r['chainId'],'canonical_chain_name':r['brand'],'year':r['year'],'final_risk_score':'' if r['score'] is None else int(r['score']),'final_score_status':r['status'],'paper_ready':1 if r['paperReady'] else 0,'n_documents':r.get('documents',0),'n_unique_item10_versions':r.get('versions',0),'sources':' | '.join(r.get('sources') or []),'final_forms':' | '.join(r.get('forms') or []),'providers':' | '.join(r.get('providers') or []),'purposes':' | '.join(r.get('purposes') or []),'evidence_quote':r.get('evidenceQuote',''),'full_item10_text_available':1 if r.get('hasFullText') else 0,'v1_2_qc_status':r.get('v1_2_qc_status',''),'v1_2_resolution_rule':r.get('v1_2_resolution_rule','')})
    nall=len(rows);np=len(paper);nu=len(unresolved);sc=Counter(int(r['score']) for r in paper);an=sum(x>=1 for x in sc.elements());rn=sum(x>=2 for x in sc.elements());mn=sum(x>=3 for x in sc.elements());dn=sc[4]
    assert (an,rn,mn,dn)==(4385,3620,1883,1513)
    prevalence=[{'measure':'All reconciled brand-years','n_brand_years':nall,'share':1.0},{'measure':'Paper-ready brand-years','n_brand_years':np,'share':np/nall},{'measure':'Remaining unresolved score conflicts','n_brand_years':nu,'share':nu/nall},{'measure':'Any financing support (score >= 1)','n_brand_years':an,'share':an/np},{'measure':'Risk-bearing support (score >= 2)','n_brand_years':rn,'share':rn/np},{'measure':'Material credit risk (score >= 3)','n_brand_years':mn,'share':mn/np},{'measure':'Direct funded credit (score = 4)','n_brand_years':dn,'share':dn/np}]
    risk=[{'final_risk_score':s,'n_brand_years':sc[s],'share':sc[s]/np} for s in range(5)]
    byy=defaultdict(list)
    for r in paper:byy[int(r['year'])].append(int(r['score']))
    annual=[]
    for y in sorted(byy):
        a=byy[y];n=len(a);annual.append({'year':y,'n_brand_years':n,'mean_risk_score':sum(a)/n,'any_support_share':sum(x>=1 for x in a)/n,'risk_bearing_share':sum(x>=2 for x in a)/n,'material_risk_share':sum(x>=3 for x in a)/n,'direct_funded_share':sum(x==4 for x in a)/n})
    byc=defaultdict(dict)
    for r in paper:byc[r['chainId']][int(r['year'])]=r
    pairs=[];changes=[]
    for cid,ym in byc.items():
        for y in sorted(ym):
            if y+1 not in ym:continue
            a,b=ym[y],ym[y+1];sa,sb=int(a['score']),int(b['score']);pairs.append((a,b))
            if sa!=sb:
                ct='0 → support' if sa==0 and sb>0 else ('support → 0' if sa>0 and sb==0 else ('other increase' if sb>sa else 'other decrease'))
                changes.append({'canonical_chain_id':cid,'canonical_chain_name':b['brand'],'from_year':y,'to_year':y+1,'from_score':sa,'to_score':sb,'score_change':sb-sa,'change_type':ct,'from_forms':' | '.join(a.get('forms') or []),'to_forms':' | '.join(b.get('forms') or []),'from_providers':' | '.join(a.get('providers') or []),'to_providers':' | '.join(b.get('providers') or []),'from_evidence_quote':a.get('evidenceQuote',''),'to_evidence_quote':b.get('evidenceQuote','')})
    assert (len(pairs),len(changes))==(7070,349)
    z2s=sum(int(a['score'])==0 and int(b['score'])>0 for a,b in pairs);s2z=sum(int(a['score'])>0 and int(b['score'])==0 for a,b in pairs);inc=sum(int(b['score'])>int(a['score']) for a,b in pairs);dec=sum(int(b['score'])<int(a['score']) for a,b in pairs);lm=sum(int(a['score'])<=2 and int(b['score'])>=3 for a,b in pairs);ml=sum(int(a['score'])>=3 and int(b['score'])<=2 for a,b in pairs);assert (z2s,s2z)==(135,146)
    transition=[{'measure':'Consecutive brand-year pairs','n_pairs':len(pairs),'share':1.0},{'measure':'RiskScore changes','n_pairs':len(changes),'share':len(changes)/len(pairs)},{'measure':'0 to support','n_pairs':z2s,'share':z2s/len(pairs)},{'measure':'Support to 0','n_pairs':s2z,'share':s2z/len(pairs)},{'measure':'Risk increase','n_pairs':inc,'share':inc/len(pairs)},{'measure':'Risk decrease','n_pairs':dec,'share':dec/len(pairs)},{'measure':'Low (0-2) to material (3-4)','n_pairs':lm,'share':lm/len(pairs)},{'measure':'Material (3-4) to low (0-2)','n_pairs':ml,'share':ml/len(pairs)}]
    latest=[]
    for cid,ym in byc.items():
        y=max(ym);r=ym[y];x=int(r['score']);latest.append({'canonical_chain_id':cid,'canonical_chain_name':r['brand'],'latest_paper_ready_year':y,'final_risk_score':x,'any_support':int(x>=1),'risk_bearing_ge2':int(x>=2),'material_risk_ge3':int(x>=3),'direct_funded_eq4':int(x==4),'final_forms':' | '.join(r.get('forms') or []),'providers':' | '.join(r.get('providers') or []),'purposes':' | '.join(r.get('purposes') or []),'evidence_quote':r.get('evidenceQuote','')})
    latest.sort(key=lambda r:r['canonical_chain_name'].casefold())
    sens=[]
    for label,obs in [('Any financing support (score >= 1)',an),('Risk-bearing support (score >= 2)',rn),('Material credit risk (score >= 3)',mn),('Direct funded credit (score = 4)',dn)]:sens.append({'measure':label,'observed_qualifying_brand_years':obs,'unresolved_brand_years':nu,'all_reconciled_brand_years':nall,'lower_bound_share':obs/nall,'upper_bound_share':(obs+nu)/nall})
    v11={'Brand-years':13222,'Paper-ready brand-years':13067,'Unique canonical brands':4736,'Any financing support':4345,'Risk-bearing support':3586,'Material credit risk':1869,'Direct funded credit':1502,'Consecutive brand-year pairs':7013,'RiskScore changes':341,'0 to support':130,'Support to 0':144,'Unresolved score conflicts':155};v12={'Brand-years':nall,'Paper-ready brand-years':np,'Unique canonical brands':len(set(r['chainId'] for r in rows)),'Any financing support':an,'Risk-bearing support':rn,'Material credit risk':mn,'Direct funded credit':dn,'Consecutive brand-year pairs':len(pairs),'RiskScore changes':len(changes),'0 to support':z2s,'Support to 0':s2z,'Unresolved score conflicts':nu};impact=[{'metric':k,'v1_1':v11[k],'v1_2':v12[k],'change':v12[k]-v11[k]} for k in v11]
    audit=[]
    for n,r0 in orig_num.items():
        c=qc_class(n);ts=targets(n,r0);cur=[rm[t] for t in ts if t in rm];ns=' | '.join('NA' if r.get('score') is None else str(int(r['score'])) for r in cur) or 'NA';out='RESOLVED' if cur and all(r.get('score') is not None for r in cur) else ('SPLIT_WITH_REMAINING_NA' if n in SCOPE else 'RETAINED_NA');audit.append({'original_index':n,'brand':clean_brand(r0['brand']),'year':r0['year'],'old_id':r0['id'],'action':c,'new_id':' | '.join(ts),'old_score':'NA','new_score':ns,'outcome':out,'reason':reason(c,n)})
    qc=Counter(a['action'] for a in audit);assert qc==Counter(EXPECTED_QC),qc
    qcs=[{'qc_class':k,'n_original_conflicts':EXPECTED_QC[k],'v1_2_policy':reason(k,1 if k=='CHRONOLOGY_RESOLUTION' else 0)} for k in EXPECTED_QC]
    return {'brand':brand,'paper':paper,'unresolved':unresolved,'prevalence':prevalence,'risk':risk,'annual':annual,'pairs':pairs,'changes':changes,'transition':transition,'latest':latest,'sensitivity':sens,'impact':impact,'audit':audit,'scope':[a for a in audit if a['original_index'] in SCOPE],'chronology':[a for a in audit if a['original_index'] in CHRONOLOGY_SCORES],'qc_summary':qcs,'counts':{'all':nall,'paper':np,'unresolved':nu,'any':an,'risk':rn,'material':mn,'direct':dn,'pairs':len(pairs),'changes':len(changes),'zero_to_support':z2s,'support_to_zero':s2z},'score_counts':sc}

def save(data,rows,details,dest,with_details=True):
    dest=Path(dest);dest.mkdir(parents=True,exist_ok=True)
    write_csv(dest/'brand-year-evidence.csv',data['brand'],BRAND_FIELDS)
    write_csv(dest/'within-firm-changes.csv',data['changes'],['canonical_chain_id','canonical_chain_name','from_year','to_year','from_score','to_score','score_change','change_type','from_forms','to_forms','from_providers','to_providers','from_evidence_quote','to_evidence_quote'])
    write_csv(dest/'prevalence.csv',data['prevalence'],['measure','n_brand_years','share']);write_csv(dest/'risk-distribution.csv',data['risk'],['final_risk_score','n_brand_years','share']);write_csv(dest/'annual-trends.csv',data['annual'],['year','n_brand_years','mean_risk_score','any_support_share','risk_bearing_share','material_risk_share','direct_funded_share']);write_csv(dest/'transition-summary.csv',data['transition'],['measure','n_pairs','share']);write_csv(dest/'franchisor-latest-year.csv',data['latest'],['canonical_chain_id','canonical_chain_name','latest_paper_ready_year','final_risk_score','any_support','risk_bearing_ge2','material_risk_ge3','direct_funded_eq4','final_forms','providers','purposes','evidence_quote']);write_csv(dest/'sensitivity-bounds.csv',data['sensitivity'],['measure','observed_qualifying_brand_years','unresolved_brand_years','all_reconciled_brand_years','lower_bound_share','upper_bound_share']);write_csv(dest/'v1.1-v1.2-impact.csv',data['impact'],['metric','v1_1','v1_2','change']);af=['original_index','brand','year','old_id','action','new_id','old_score','new_score','outcome','reason'];write_csv(dest/'v1.2-qc-audit.csv',data['audit'],af);write_csv(dest/'v1.2-scope-splits.csv',data['scope'],af);write_csv(dest/'v1.2-chronology-resolved.csv',data['chronology'],af);write_csv(dest/'v1.2-qc-summary.csv',data['qc_summary'],['qc_class','n_original_conflicts','v1_2_policy'])
    c=data['counts'];meta={'version':VERSION,'freezeDate':FREEZE,'unit':'canonical franchise offering/system × filing year after chronology and offering-scope QC','nBrandYears':c['all'],'nPaperReady':c['paper'],'nWithFullText':sum(r.get('hasFullText',False) for r in rows),'nUnresolved':c['unresolved'],'note':'V1.2 applies chronology only when supersession is unambiguous, splits distinct offerings/programs, preserves verified state-specific differences as NA, and keeps original PDFs as authoritative evidence.'};write_json(dest/'brand-year-index.json',{'meta':meta,'rows':rows})
    wj=[]
    for r in data['changes']:wj.append({'id':f"{r['canonical_chain_id']}::{r['from_year']}::{r['to_year']}",'chainId':r['canonical_chain_id'],'brand':r['canonical_chain_name'],'fromYear':r['from_year'],'toYear':r['to_year'],'fromScore':r['from_score'],'toScore':r['to_score'],'scoreChange':r['score_change'],'changeType':r['change_type'],'fromForms':r['from_forms'].split(' | ') if r['from_forms'] else [],'toForms':r['to_forms'].split(' | ') if r['to_forms'] else [],'fromProviders':r['from_providers'].split(' | ') if r['from_providers'] else [],'toProviders':r['to_providers'].split(' | ') if r['to_providers'] else [],'fromQuote':r['from_evidence_quote'],'toQuote':r['to_evidence_quote'],'fromId':f"{r['canonical_chain_id']}::{r['from_year']}",'toId':f"{r['canonical_chain_id']}::{r['to_year']}"})
    write_json(dest/'within-firm-changes.json',{'meta':{'nChangedPairs':c['changes'],'nConsecutivePairs':c['pairs']},'rows':wj})
    if with_details:
        dd=dest/'details';dd.mkdir(exist_ok=True)
        for y in sorted(set(int(r['year']) for r in rows)):
            yd={r['id']:details.get(r['id'],{'id':r['id'],'brand':r['brand'],'year':r['year'],'score':r['score'],'status':r['status'],'versions':[]}) for r in rows if int(r['year'])==y};write_json(dd/f'{y}.json',yd)
