#!/usr/bin/env python3
"""Match authored sentence cues to captured native Edge WordBoundary audio events.

No uniform word estimates are used. Multiword native events are rejected;
year phrases must be written as spoken words to obtain exact word boundaries.
"""
from pathlib import Path
import hashlib,json,math,re
ROOT=Path(__file__).resolve().parents[1]
def norm(text): return ''.join(c for c in text.lower() if c.isalnum())
def save(path,value):
 path.parent.mkdir(parents=True,exist_ok=True)
 temporary=path.with_suffix(path.suffix+'.incoming')
 temporary.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n');temporary.replace(path)
def build_sync(story=None):
 story=story or json.loads((ROOT/'script/script.json').read_text())
 timing=json.loads((ROOT/'public/timing.json').read_text());scenes={x['id']:x for x in timing['scenes']}
 sentences=[];events=[];all_years=[];cumulative=0;voice_files=[]
 def event(sentence,kind,year,word=None,count=1,occurrence=1):
  nonlocal cumulative
  t=sentence['keySeconds'] if word is None else sentence['_at'](word,occurrence)
  cumulative+=count
  e=dict(id=f"{sentence['id']}-{kind}-{year}-{'reveal' if count else 'focus'}",sceneId=sentence['sceneId'],kind=kind,year=year,startSeconds=t,absoluteSeconds=round(sentence['_sceneStart']+t,5),count=count,cumulativeCount=cumulative)
  sentence['trophies'].append(e);events.append(e)
 for scene in story['scenes']:
  ts=scenes[scene['id']];ws=ts['words'];starts=[];whole=''
  audio_path=ROOT/f"public/voice/{scene['id']}.mp3"
  audio_hash=hashlib.sha256(audio_path.read_bytes()).hexdigest()
  metadata=json.loads(audio_path.with_suffix('.json').read_text())
  if metadata.get('audioSha256')!=audio_hash:raise ValueError(f"{scene['id']}: captured boundaries do not match current audio SHA-256")
  if metadata['words']!=ws:raise ValueError(f"{scene['id']}: timing.json contains stale word boundaries")
  voice_files.append(dict(sceneId=scene['id'],audio=f"voice/{scene['id']}.mp3",audioSha256=audio_hash,
   nativeBoundaryCount=len(ws),timingSource=metadata['timingSource']))
  for word in ws:
   start=len(whole);whole+=norm(word['text']);starts.append((start,len(whole),word))
  expected=norm(scene['narration'])
  if any(len(w['text'].split()) != 1 for w in ws):
   raise ValueError(f"{scene['id']}: native boundary groups multiple words; write the year phrase as spoken words and regenerate")
  if len(ws)!=len(scene['narration'].split()):
   raise ValueError(f"{scene['id']}: word-level boundary count differs from narration")
  if whole!=expected: raise ValueError(f"{scene['id']}: stale voice; native words differ from narration")
  cursor=0
  for sentence in scene['sentences']:
   raw=sentence['text'];n=norm(raw);pos=whole.find(n,cursor)
   if pos!=cursor: raise ValueError(f"{sentence['id']}: sentence mismatch at {cursor}")
   end=pos+len(n);boundaries=[x[2] for x in starts if x[1]>pos and x[0]<end]
   def at(phrase,occurrence=1,pos=pos,n=n):
    needle=norm(phrase);i=-1
    for _ in range(occurrence):i=n.find(needle,i+1)
    if i<0:raise ValueError(f'{sentence["id"]}: cue word {phrase!r} missing')
    offset=pos+i
    return round(next(x[2]['startMs']/1000 for x in starts if x[0]<=offset<x[1]),5)
   c=sentence['visual_cue'];key=at(c['start_word']);base=ts['from']/timing['fps']
   row=dict(id=sentence['id'],sceneId=scene['id'],text=raw,startSeconds=boundaries[0]['startMs']/1000,endSeconds=boundaries[-1]['endMs']/1000,keySeconds=key,absoluteKeySeconds=round(base+key,5),visual_cue=c,years=[],trophies=[],_at=at,_sceneStart=base)
   for authored_year in sentence['year_cues']:
    year=authored_year['year'];t=at(authored_year['start_word'])
    y=dict(year=year,startSeconds=t,absoluteSeconds=round(base+t,5));row['years'].append(y);all_years.append(dict(sceneId=scene['id'],sentenceId=row['id'],**y))
   if scene['id']=='scene04':
    if 'Champions League' in raw:event(row,'champions-league',2008)
    elif 'Premier League' in raw:event(row,'premier-league',2008)
    elif 'Ballon' in raw:event(row,'ballon-dor',2008)
    elif 'FIFA World' in raw:event(row,'fifa-player',2008)
   if scene['id']=='scene05':
    if 'Four Champions League' in raw:
     # The spoken count is four immediately: all four models appear together.
     row['keySeconds']=at('Four');row['absoluteKeySeconds']=round(base+row['keySeconds'],5)
     for year in [2014,2016,2017,2018]:event(row,'champions-league',year,'Four')
    elif raw.strip() in ['2014.','2016.','2017.','2018.'] and cumulative==8:
     event(row,'champions-league',int(re.search(r'\d+',raw).group()),count=0)
    elif 'More Ballon' in raw:event(row,'ballon-dor',2013)
    elif raw.strip() in ['2014.','2016.','2017.'] and cumulative>=9:
     event(row,'ballon-dor',int(re.search(r'\d+',raw).group()))
   if scene['id']=='scene07':
    if 'Euro twenty sixteen' in raw:event(row,'euro',2016)
    elif 'Nations League' in raw:event(row,'nations-league',int(re.search(r'\d{4}',raw).group()))
   row['expectedTrophyCount']=cumulative
   row['keyFrame']=math.ceil(row['absoluteKeySeconds']*timing['fps']-1e-8)
   row['visualStartSeconds']=round(math.ceil(row['keySeconds']*timing['fps']-1e-8)/timing['fps'],6)
   row['syncDeltaSeconds']=round(row['keyFrame']/timing['fps']-row['absoluteKeySeconds'],6)
   if not 0<=row['syncDeltaSeconds']<=.3:raise ValueError(f"{row['id']}: visual cue outside 300ms")
   row.pop('_at');row.pop('_sceneStart');sentences.append(row);cursor=end
  if cursor!=len(whole):raise ValueError(f"{scene['id']}: missing sentence cues")
 current=json.loads((ROOT/'script/script.json').read_text())
 if current!=story:raise ValueError('script.json changed while aligning; rerun after the narration is frozen')
 narration_fingerprint=hashlib.sha256(json.dumps([(s['id'],s['narration'],s['segments']) for s in story['scenes']],sort_keys=True).encode()).hexdigest()
 actions=[dict(id=s['id'],sceneId=s['sceneId'],startSeconds=s['keySeconds'],absoluteSeconds=s['absoluteKeySeconds'],
  action=s['visual_cue']['action'],outfit=s['visual_cue']['outfit'],props=s['visual_cue']['props'],camera=s['visual_cue']['camera']) for s in sentences]
 outfits=[]
 for scene in story['scenes']:
  previous=None
  for sentence in [s for s in sentences if s['sceneId']==scene['id']]:
   outfit=sentence['visual_cue']['outfit']
   if outfit!=previous:
    start=sentence['keySeconds'] if previous is not None else 0
    outfits.append(dict(sceneId=scene['id'],startSeconds=start,absoluteSeconds=round(scenes[scene['id']]['from']/timing['fps']+start,5),
     outfit=outfit,start_word=sentence['visual_cue']['start_word'],subject='lead'))
    previous=outfit
 result=dict(schemaVersion=1,wordTimingAudit=dict(narrationWords=story['wordCount'],nativeWordBoundaries=sum(len(x['words']) for x in timing['scenes']),allBoundariesSingleWord=True),timingSource='Captured native Edge TTS WordBoundary events, measured assembled MP3s; no speech stretching or uniform word estimates',fps=timing['fps'],totalDuration=timing['totalDuration'],sentences=sentences,trophyEvents=events,yearEvents=all_years,
  actionEvents=actions,outfitEvents=outfits,voiceFiles=voice_files,narrationFingerprint=narration_fingerprint,
  maxSyncDeltaSeconds=max(s['syncDeltaSeconds'] for s in sentences),
  checks=dict(allAudioHashesMatch=True,allNarrationMatchesNativeBoundaries=True,allSentenceKeysResolved=True,allVisualStartsWithin300ms=True),
  audioSha256={x['sceneId']:x['audioSha256'] for x in voice_files})
 for scene in story['scenes']:
  ts=scenes[scene['id']];metadata=json.loads((ROOT/f"public/voice/{scene['id']}.json").read_text())
  save(ROOT/f"public/word-timestamps/{scene['id']}.json",dict(sceneId=scene['id'],sceneStartSeconds=ts['from']/timing['fps'],
   audio=f"voice/{scene['id']}.mp3",audioSha256=metadata['audioSha256'],timingSource=metadata['timingSource'],words=ts['words'],
   note='Native provider boundaries retained verbatim, including grouped number phrases; no interpolated sub-word timestamps.'))
 save(ROOT/'public/sync.json',result)
 print(f"Sync: {len(sentences)} sentence cues, {len(events)} trophy reveals/focus cues, {cumulative} named trophies",flush=True)
 return result
if __name__=='__main__':build_sync()
