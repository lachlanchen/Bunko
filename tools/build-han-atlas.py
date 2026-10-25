#!/usr/bin/env python3
"""Build a dated, attributed reference layer from reviewed SVG boundary data.
Requires shapely==2.1.2, svg.path==7.0. No model-created coordinates or borders.
Usage: python tools/build-han-atlas.py /path/to/Han_orientaux_140.svg
The source covers eastern China only; western regions are clipped by that map.
"""
from pathlib import Path
import sys,xml.etree.ElementTree as E,json,math,hashlib
from svg.path import parse_path,Move
from shapely.geometry import LineString,Point,box,shape,mapping
from shapely.ops import unary_union,nearest_points,transform
from shapely.geometry.polygon import orient
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);raw=source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='02f7140c439f90f1b8b4dde0137b2d37398db891ade617ec372acab4ad67611b'
assert hashlib.sha256((root/'src/data/atlas-land.json').read_bytes()).hexdigest()=='2665256c49d268cbc67658039c86cf5e45523b6e063f68a8ce78cad820bd9373'
r=E.fromstring(raw)
lines=[]
for e in r:
 if e.tag.endswith('path') and '#520' in e.get('style',''):
  coords=[]
  for seg in parse_path(e.get('d')):
   n=max(1,math.ceil(seg.length()/2))
   if not isinstance(seg,Move):coords.extend((seg.point(i/n).real,seg.point(i/n).imag) for i in range(n+1))
  lines.append(LineString(coords))
land=json.loads((root/'src/data/atlas-land.json').read_text())
geoms=[]
for f in land['features']:
 p=shape(f['geometry']).intersection(box(99.5,18,125.7,42.5))
 if not p.is_empty:geoms.append(transform(lambda x,y,z=None:((x-99.5)*920/26.2,(42.5-y)*1006/24.5),p))
coast=unary_union(geoms).boundary
other=coast
# Bridge only drafting gaps: original line endpoints are slightly misaligned.
connect=[]
for i,l in enumerate(lines):
 targets=unary_union([coast]+[o for j,o in enumerate(lines) if i!=j])
 for xy in [l.coords[0],l.coords[-1]]:
  p=Point(xy);q=nearest_points(p,targets)[1]
  if p.distance(q)<22: connect.append(LineString([p,q]))
network=unary_union([coast,*lines,*connect])
regions=unary_union(geoms).difference(network.buffer(.8))
polys=list(regions.geoms) if hasattr(regions,'geoms') else [regions]
# Province labels in the source, slightly inset from text baselines.
seeds={}
for e in r:
 if e.tag.endswith('text') and ''.join(e.itertext()).strip() in ['Yang','Xu','Qing','You','Ji','Bing','Sili','Liang','Yi','Jing','Jiaozhi','Yan','Yu']:
  name=''.join(e.itertext()).strip();x=float(e.get('x'))+8;y=float(e.get('y'))-12
  seeds[name]=(x,y)
rows=[]
for name,xy in seeds.items():
 found=[p for p in polys if p.contains(Point(xy))]
 assert len(found)==1, f'No unique region for {name}'
 if found:
  p=found[0].intersection(unary_union(geoms)).simplify(1.2,preserve_topology=True)
  rows.append({'name':name,'label':xy,'geometry':mapping(p)})

assert len(rows)==13 and len(set(json.dumps(p['geometry']) for p in rows))==13
# Chinese names and ASCII aliases identify regions, not modern namesake cities.
names={'Yang':['扬州','揚州','Yangzhou'],'Xu':['徐州','Xuzhou'],'Qing':['青州','Qingzhou'],
 'You':['幽州','Youzhou'],'Ji':['冀州','Jizhou'],'Bing':['并州','幷州','并州','Bingzhou'],
 'Sili':['司隶','司隸','Sili'],'Liang':['凉州','涼州','Liangzhou'],'Yi':['益州','Yizhou'],
 'Jing':['荆州','荊州','Jingzhou'],'Jiaozhi':['交趾','交阯','交州','Jiaozhi','Jiaozhou'],
 'Yan':['兖州','兗州','Yanzhou'],'Yu':['豫州','Yuzhou']}
colors=['#79b6a1','#86aed0','#e5b55f','#aa93c5','#db929b','#afb76f','#7cabc1','#c69c75','#8eae73','#dc9967','#65a99e','#ba91af','#c7bc6b']
regions=[]
for i,row in enumerate(rows):
 key=row['name']; x,y=row['label'];xy=lambda x,y,z=None:(x*26.2/920+99.5,42.5-y*24.5/1006)
 poly=orient(transform(xy,shape(row['geometry'])),sign=-1)
 assert poly.is_valid and poly.area>0
 longitude,latitude=xy(x,y)
 region={'id':'han140-'+key.lower(),'names':list(dict.fromkeys(names[key]+[n+'刺史部' for n in names[key] if any('\u4e00'<=c<='\u9fff' for c in n)])),
  'name':names[key][0],'label':[round(longitude,4),round(latitude,4)],'color':colors[i],'geometry':mapping(poly)}
 regions.append(region)
layer={'id':'han140','year':140,'period':[25,219],'extent':[99.5,18,125.7,42.5],
 'source':'https://commons.wikimedia.org/wiki/File:Han_orientaux_140.svg',
 'download':'https://upload.wikimedia.org/wikipedia/commons/1/16/Han_orientaux_140.svg',
 'sourceSha256':hashlib.sha256(raw).hexdigest(),'license':'CC-BY-SA-4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/',
 'credit':'Zunkir; base map Kanguole. Adapted boundary vectors; Natural Earth coastline.',
 'note':'Eastern Han reference, c. 140 CE. The source crops western regions. Not exact boundaries for a different year or military control.',
 'regions':regions}
path=root/'server/agent/han-regions.json'
path.write_text(json.dumps(layer,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'regions':len(regions),'output':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size}))
