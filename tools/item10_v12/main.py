#!/usr/bin/env python3
import json
from pathlib import Path
from .transform import transform
from .outputs import build,save
from .workbook import build as build_workbook

def read_json(p):
    with open(p,encoding='utf-8') as f:return json.load(f)

def main():
    root=Path(__file__).resolve().parents[2]
    src=root/'public'/'data'/'item10-financing'
    webout=root/'public'/'data'/'item10-financing-v1.2'
    release=root/'release'/'item10-v1.2'
    idx=read_json(src/'brand-year-index.json')
    details={}
    for p in (src/'details').glob('*.json'):
        obj=read_json(p)
        if isinstance(obj,dict):details.update(obj)
    rows,new_details,orig_num=transform(idx['rows'],details)
    data=build(rows,new_details,orig_num)
    save(data,rows,new_details,webout,with_details=True)
    save(data,rows,new_details,release,with_details=False)
    xlsx,zpath=build_workbook(data,release)
    result={'xlsx':str(xlsx.relative_to(root)),'zip':str(zpath.relative_to(root)),'counts':data['counts'],'score_counts':dict(data['score_counts'])}
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
