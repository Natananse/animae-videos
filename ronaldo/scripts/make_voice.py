#!/usr/bin/env python3
"""Cache native Ryan passages, preserving authored action pauses; never stretch audio."""
from __future__ import annotations
import argparse, asyncio, hashlib, html, json, subprocess, tempfile
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parents[1]
VOICE_DIR=ROOT/'public/voice'
CACHE_DIR=ROOT/'.cache/voice-passages'
FPS=30

def probe(path):
    return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],check=True,capture_output=True,text=True).stdout.strip())

def atomic_json(path,value):
    temporary=path.with_suffix(path.suffix+'.incoming')
    temporary.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n')
    temporary.replace(path)

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()

async def synthesize_passage(passage,voice,default_rate,force):
    rate=passage.get('rate',default_rate)
    key=digest({'text':passage['narration'],'voice':voice,'rate':rate,'pipeline':'native-passages-v1'})
    audio=CACHE_DIR/f'{key}.mp3'; metadata=audio.with_suffix('.json')
    if not force and audio.exists() and metadata.exists():
        saved=json.loads(metadata.read_text())
        if saved['audioSha256']==hashlib.sha256(audio.read_bytes()).hexdigest():
            print(f"{passage['id']}: cached native speech {saved['duration']:.3f}s",flush=True)
            return {**saved,'path':str(audio)}
    CACHE_DIR.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='incoming-',dir=CACHE_DIR) as work:
        incoming=Path(work)/'speech.mp3'
        for attempt in range(3):
            words=[]
            try:
                communication=edge_tts.Communicate(passage['narration'],voice=voice,rate=rate,boundary='WordBoundary',connect_timeout=20,receive_timeout=60)
                with incoming.open('wb') as stream:
                    async for item in communication.stream():
                        if item['type']=='audio': stream.write(item['data'])
                        elif item['type']=='WordBoundary':
                            start=item['offset']/10000
                            words.append({'text':html.unescape(item['text']),'startMs':round(start,2),'endMs':round(start+item['duration']/10000,2)})
                if incoming.stat().st_size<1024 or not words: raise RuntimeError('Edge returned no speech or word boundaries')
                break
            except Exception as error:
                if attempt==2: raise RuntimeError(f"{passage['id']}: synthesis failed: {error}") from error
                print(f"{passage['id']}: network retry {attempt+1}",flush=True)
                await asyncio.sleep(2*(attempt+1))
        duration=probe(incoming)
        saved={'cacheKey':key,'voice':voice,'rate':rate,'duration':duration,'words':words,'narration':passage['narration'],'audioSha256':hashlib.sha256(incoming.read_bytes()).hexdigest(),'timingSource':'Native Edge WordBoundary; no tempo processing'}
        incoming.replace(audio);atomic_json(metadata,saved)
        print(f"{passage['id']}: generated native speech {duration:.3f}s",flush=True)
        return {**saved,'path':str(audio)}

def assemble_scene(scene,recordings,force):
    passages=scene['segments']; scene_duration=float(scene['duration'])
    ranges=[];words=[];entries=[];previous_end=0.0
    for passage,recording in zip(passages,recordings):
        start=float(passage['offset']);end=start+recording['duration'];deadline=float(passage.get('windowEnd',scene_duration-.1))
        if start<previous_end-.001: raise RuntimeError(f"{passage['id']}: overlaps the preceding passage")
        if end>deadline+.015: raise RuntimeError(f"{passage['id']}: native speech ends {end:.3f}s, after {deadline:.3f}s; shorten the passage, no stretching permitted")
        ranges.append({'start':round(start,5),'end':round(end,5)})
        words.extend({'text':w['text'],'startMs':round(w['startMs']+start*1000,2),'endMs':round(w['endMs']+start*1000,2)} for w in recording['words'])
        entries.append({'id':passage['id'],'offset':start,'duration':recording['duration'],'rate':recording['rate'],'cacheKey':recording['cacheKey']})
        previous_end=end
    key=digest({'sceneDuration':scene_duration,'segments':entries,'assembly':1})
    audio=VOICE_DIR/f"{scene['id']}.mp3";metadata=audio.with_suffix('.json')
    if not force and audio.exists() and metadata.exists():
        saved=json.loads(metadata.read_text())
        if saved.get('cacheKey')==key and saved.get('audioSha256')==hashlib.sha256(audio.read_bytes()).hexdigest():
            print(f"{scene['id']}: assembled audio cached",flush=True);return saved
    with tempfile.TemporaryDirectory(prefix=f"{scene['id']}-",dir=VOICE_DIR) as work:
        ready=Path(work)/'scene.mp3';length=scene_duration-.075
        command=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono']
        for recording in recordings: command+=['-i',recording['path']]
        filters=[f'[0:a]atrim=duration={length}[bed]'];labels=['[bed]']
        for index,passage in enumerate(passages):
            label=f'p{index}';delay=round(float(passage['offset'])*48000)
            filters.append(f'[{index+1}:a]aresample=48000,adelay={delay}S:all=1[{label}]');labels.append(f'[{label}]')
        filters.append(''.join(labels)+f'amix=inputs={len(labels)}:normalize=0:duration=first,atrim=duration={length}[out]')
        command+=['-filter_complex',';'.join(filters),'-map','[out]','-ar','48000','-ac','1','-c:a','libmp3lame','-b:a','128k',str(ready)]
        subprocess.run(command,check=True);duration=probe(ready)
        if duration>scene_duration+.025: raise RuntimeError(f"{scene['id']}: encoder padding exceeds chapter")
        saved={'sceneId':scene['id'],'cacheKey':key,'voice':recordings[0]['voice'],'duration':duration,'voiceFrom':0,'segments':entries,'speechRanges':ranges,'words':words,'audioSha256':hashlib.sha256(ready.read_bytes()).hexdigest(),'timingSource':'Actual native WordBoundary timings offset into scene; no atempo'}
        ready.replace(audio);atomic_json(metadata,saved)
        print(f"{scene['id']}: assembled {duration:.3f}s with {len(ranges)} speech windows",flush=True)
        return saved

def assemble_timing(story):
    scenes=[];cursor=0;last_voice=0.0
    for scene in story['scenes']:
        saved=json.loads((VOICE_DIR/f"{scene['id']}.json").read_text())
        if 'speechRanges' not in saved: raise RuntimeError(f"{scene['id']}: regenerate for revised passage timeline")
        frames=round(scene['duration']*FPS)
        entry={'id':scene['id'],'from':cursor,'durationInFrames':frames,'voiceFrom':0,'voiceDuration':probe(VOICE_DIR/f"{scene['id']}.mp3"),'words':saved['words'],'speechRanges':saved['speechRanges']}
        for speech in entry['speechRanges']: last_voice=max(last_voice,cursor/FPS+speech['end'])
        scenes.append(entry);cursor+=frames
    expected=round(story['totalDuration']*FPS)
    if cursor!=expected: raise RuntimeError(f'Expected {expected} frames, got {cursor}')
    if last_voice>story['totalDuration']-6: raise RuntimeError('Closing six-second visual ending must have no narration')
    result={'fps':FPS,'totalFrames':cursor,'totalDuration':cursor/FPS,'voice':story['voice'],'lastVoiceEndSeconds':round(last_voice,5),'timingPolicy':'Native cached passages measured by ffprobe, separated by authored silent action windows','scenes':scenes}
    atomic_json(ROOT/'public/timing.json',result)
    print(f'Timeline: {cursor} frames / {cursor/FPS:g}s; final voice ends {last_voice:.3f}s',flush=True)
    return result

async def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force',action='store_true');parser.add_argument('--scene',help='Scene id, such as scene05; omitted generates all')
    parser.add_argument('--rate',default='+10%',help='Native Edge rate; never an audio stretch')
    args=parser.parse_args();story=json.loads((ROOT/'script/script.json').read_text());VOICE_DIR.mkdir(parents=True,exist_ok=True)
    selected=[scene for scene in story['scenes'] if not args.scene or scene['id']==args.scene]
    if not selected: parser.error('Unknown scene id')
    limit=asyncio.Semaphore(2)
    async def request(passage):
        async with limit: return await synthesize_passage(passage,story['voice'],args.rate,args.force)
    # Cache every native passage before assembly; rewrites regenerate only changed passages.
    groups=[]
    for scene in selected: groups.append(await asyncio.gather(*(request(p) for p in scene['segments'])))
    for scene,recordings in zip(selected,groups): assemble_scene(scene,recordings,args.force)
    if all((VOICE_DIR/f"{scene['id']}.json").exists() for scene in story['scenes']): assemble_timing(story)

if __name__=='__main__': asyncio.run(main())
