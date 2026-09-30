"""Check every published scripture passage/footnote and Japanese ruby coverage."""
import sys,json,sqlite3,re,hashlib,argparse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_scripture import bible_source, plain, CANON
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--library',type=Path,required=True)
parser.add_argument('--cache',type=Path,required=True)
parser.add_argument('--report',type=Path,required=True)
args=parser.parse_args()
r=args.library;cache=args.cache;report={}
for slug,wanted in [('bible',['en','zh','ja']),('quran',['ar','en','zh','ja'])]:
 meta=json.loads((r/'books'/slug/'meta.json').read_text());assert meta['langs']==wanted
 for row in meta['chapters']:
  raw=(r/'books'/slug/row['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['sha256']
 report[slug]={'languages':wanted,'chapters':len(meta['chapters'])-1,'bytes':meta['bytes']}
 # Unmodified publisher bodies/notes must each occur at their own verse group.
 if slug=='bible':
  sources={l:bible_source(cache,k)[0] for l,k in [('en','engwebp'),('zh','cmn-cu89t'),('ja','jpnm')]}
  counts={l:0 for l in wanted};notes={l:0 for l in wanted};headings={l:0 for l in wanted}
  for row in meta['chapters'][1:]:
   c=json.loads((r/'books'/slug/row['file']).read_text());_,code,ch=c['id'].split('-');ch=int(ch);code=code.upper()
   # Each publisher's text in a chapter, stripped only of whitespace, must be present.
   texts={l:'\n'.join(plain(u.get(l,[])) for p in c['p'] for u in p['u']) for l in wanted}
   for l in wanted:
    normalized=''.join(texts[l].split())
    for source in sources[l][code][ch]:
     if 'verse' in source:
      counts[l]+=1
      if source['text']:assert ''.join(source['text'].split()) in normalized,(code,ch,source['verse'],l)
     if 'heading' in source:
      headings[l]+=1;assert ''.join(source['heading'].split()) in normalized
     for note in source.get('notes',[]):notes[l]+=1;assert ''.join(note.split()) in normalized
  report[slug].update(verseEntries=counts,notes=notes,headings=headings)
 else:
  arabic={tuple(map(int,line.split('|')[:2])):line.split('|',2)[2] for line in (cache/'quran-uthmani.txt').read_text().splitlines() if re.match(r'^\d+\|\d+\|',line)}
  sources={'ar':{k:(t,'') for k,t in arabic.items()}}
  for l,key in [('en','english_rwwad'),('zh','chinese_makin'),('ja','japanese_saeedsato')]:
   db=sqlite3.connect(cache/(key+'.sqlite'));sources[l]={(s,a):(t,n or '') for s,a,t,n in db.execute('select sura,aya,translation,footnotes from translations')};db.close()
  seen={l:set() for l in wanted};notes={l:0 for l in wanted}
  for row in meta['chapters'][1:]:
   c=json.loads((r/'books'/slug/row['file']).read_text());assert 'Copyright (C) 2007-2026 Tanzil Project' in c['sourceNotice']
   for p in c['p']:
    parts=p['id'].split('-');key=(int(parts[1]),int(parts[2]));unit=p['u'][0]
    if parts[-1]=='notes':
     for l in wanted:
      if l in unit:assert plain(unit[l])==sources[l][key][1];notes[l]+=1
    else:
     for l in wanted:
      assert key not in seen[l];seen[l].add(key)
      assert plain(unit[l])==f'{key[0]}:{key[1]}  '+sources[l][key][0],(key,l)
  assert all(seen[l]==set(sources[l]) for l in wanted)
  report[slug].update(verses={l:len(v) for l,v in seen.items()},notes=notes)
 # Scan all Japanese layers, including front matter and notes.
 ja_lines=0; ruby_lines=0; kanji_lines=0; ruby_tokens=0; annotations=0
 for row in meta['chapters']:
  c=json.loads((r/'books'/slug/row['file']).read_text())
  for p in c['p']:
   annotations += p.get('kind') == 'annotation'
   for unit in p['u']:
    line=unit.get('ja',[]);text=plain(line)
    if not text:continue
    ja_lines+=1
    assert re.search('[ぁ-んァ-ン一-龯]',text),(slug,p['id'],'Non-Japanese layer')
    readings=sum(isinstance(t,list) and len(t)>1 and bool(t[1]) for t in line)
    ruby_tokens+=readings;ruby_lines+=bool(readings)
    if re.search('[一-龯]',text):
     kanji_lines+=1
     assert readings or re.search('（[ぁ-ん]+）',text),(slug,p['id'],'Missing Japanese ruby')
 report[slug]['japaneseQuality']={'lines':ja_lines,'kanjiLines':kanji_lines,'linesWithRuby':ruby_lines,'rubyTokens':ruby_tokens,'noteGroups':annotations,'nonJapaneseLayers':0}
args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,indent=2))
