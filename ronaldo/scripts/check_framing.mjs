import {bundle} from '@remotion/bundler';
import {openBrowser, renderFrames, selectComposition} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import {existsSync, createWriteStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawn} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const args=process.argv.slice(2);
const videoArg=args.find(a=>a.startsWith('--video='));
const capture=args.includes('--capture')||!videoArg;
const checkDir='out/checks';
await fs.mkdir(checkDir,{recursive:true});
const sync=JSON.parse(await fs.readFile('public/sync.json','utf8'));
const timing=JSON.parse(await fs.readFile('public/timing.json','utf8'));
const script=JSON.parse(await fs.readFile('script/script.json','utf8'));
const sceneStarts=Object.fromEntries(timing.scenes.map(s=>[s.id,s.from/timing.fps]));
const sentenceFrame=s=>Math.ceil(s.absoluteKeySeconds*30-1e-7);
const sourceHash=createHash('sha256');
async function hashDirectory(dir){for(const item of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,item.name);if(item.isDirectory())await hashDirectory(file);else{sourceHash.update(file);sourceHash.update(await fs.readFile(file));}}}
await hashDirectory('src');
for(const f of ['public/sync.json','public/timing.json','script/script.json']){sourceHash.update(f);sourceHash.update(await fs.readFile(f));}
const fingerprint=sourceHash.digest('hex');
let evidence;
async function scanFlat(inputArgs,width,height,fps,output){
 const binary=path.join(root,'.render/check-flat-regions');
 execFileSync('c++',['-O3','-std=c++17','scripts/check_flat_regions.cpp','-o',binary]);
 const sink=createWriteStream(output);
 const decoder=spawn('ffmpeg',['-v','error',...inputArgs,'-an','-f','rawvideo','-pix_fmt','rgb24','-'],{stdio:['ignore','pipe','inherit']});
 const checker=spawn(binary,[String(width),String(height),String(fps)],{stdio:['pipe','pipe','inherit']});
 const exit=p=>new Promise((resolve,reject)=>{p.once('error',reject);p.once('exit',c=>c===0?resolve():reject(new Error(`Process exited ${c}`)));});
 await Promise.all([pipeline(decoder.stdout,checker.stdin),pipeline(checker.stdout,sink),exit(decoder),exit(checker)]);
 return (await fs.readFile(output,'utf8')).trim().split('\n').map(JSON.parse);
}

const normalizeAudit=a=>{
 const time=a.globalTime??a.globalSeconds??a.absoluteSeconds??((sceneStarts[a.sceneId]??0)+(a.seconds??a.localSeconds??a.frame/a.fps));
 return {...a,globalTime:time,globalFrame:Math.round(time*30)};
};
if(capture){
 const frames=new Set(sync.sentences.map(sentenceFrame));
 for(let f=0;f<script.totalFrames;f+=30)frames.add(f);
 // Test both sides of every spoken visual and every award reveal.
 for(const s of sync.sentences){for(const sec of [s.absoluteKeySeconds-.05,s.absoluteKeySeconds+.10])if(sec>=0)frames.add(Math.ceil(sec*30));}
 for(const e of sync.yearEvents??[])frames.add(Math.ceil(e.absoluteSeconds*30-1e-7));
 for(const e of sync.trophyEvents??[])for(const sec of [e.absoluteSeconds,e.absoluteSeconds+.10,e.absoluteSeconds+1.2])frames.add(Math.min(script.totalFrames-1,Math.ceil(sec*30)));
 const selected=[...frames].filter(f=>f>=0&&f<script.totalFrames).sort((a,b)=>a-b);
 const auditMap=new Map();
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public'),outDir:path.join(root,'.render/check-bundle')});
 const chromiumOptions={gl:process.env.CHROMIUM_GL??'angle',enableMultiProcessOnLinux:true};
 const browser=await openBrowser('chrome',{browserExecutable:process.env.BROWSER_EXECUTABLE??'/usr/bin/google-chrome',chromiumOptions,chromeMode:'chrome-for-testing',logLevel:'warn'});
 try{
  const composition=await selectComposition({serveUrl,id:'RonaldoReview',puppeteerInstance:browser});
  let lastLog=0;
  await renderFrames({composition,serveUrl,puppeteerInstance:browser,inputProps:{},frames:selected,
   outputDir:path.join(root,checkDir,'source'),imageFormat:'jpeg',jpegQuality:90,
   concurrency:Number(process.env.CHECK_CONCURRENCY??1),timeoutInMilliseconds:120000,logLevel:'warn',
   onStart:()=>console.log(`Capturing ${selected.length} sentence, cue-boundary and 1Hz runtime frames`),
   onFrameUpdate:(n,frame)=>{if(Date.now()-lastLog>10000){console.log(`Source audit ${n}/${selected.length}, frame ${frame}`);lastLog=Date.now();}},
   onBrowserLog:log=>{const pos=log.text.indexOf('FRAME_AUDIT ');if(pos<0)return;try{const a=normalizeAudit(JSON.parse(log.text.slice(pos+12)));if(Number.isFinite(a.globalFrame))auditMap.set(a.globalFrame,a);}catch(e){console.warn('Unparseable audit:',e.message);}},
  });
 }finally{await browser.close({silent:true});}
 const records=selected.map(frame=>auditMap.get(frame)??{globalFrame:frame,globalTime:frame/30,missing:true});
 evidence={sourceHash:fingerprint,capturedAt:new Date().toISOString(),sampleCadence:'all sentence keys, both cue boundaries, award reveals and 1Hz runtime',requestedFrames:selected,records};
 const imageFiles=new Map((await fs.readdir(`${checkDir}/source`)).filter(f=>/^element-\d+\.jpe?g$/.test(f)).map(f=>[Number(f.match(/\d+/)[0]),f]));
 const concat=selected.map(frame=>`file '${path.join(root,checkDir,'source',imageFiles.get(frame))}'`).join('\n')+'\n';
 await fs.writeFile(`${checkDir}/source-images.txt`,concat);
 console.log('Scanning all captured source images for connected flat-color regions…');
 const flat=await scanFlat(['-f','concat','-safe','0','-i',`${checkDir}/source-images.txt`],960,540,25,`${checkDir}/source-flat-regions.jsonl`);
 const flagged=flat.filter(r=>!r.passed).map(r=>({...r,globalFrame:selected[r.frame],globalTime:selected[r.frame]/30}));
 evidence.sourceFlatReport={framesChecked:flat.length,maxRegionFraction:Math.max(...flat.map(r=>r.regionFraction)),flagged};
 if(flat.length!==selected.length)throw new Error(`Source pixel frames ${flat.length} do not match capture ${selected.length}`);
 await fs.writeFile(`${checkDir}/source-audit.json`,JSON.stringify(evidence,null,2)+'\n');
}else{
 evidence=JSON.parse(await fs.readFile(`${checkDir}/source-audit.json`,'utf8'));
 if(evidence.sourceHash!==fingerprint)throw new Error('Source audit is stale; rerun --capture before checking the video.');
}
const failures=[];
if(evidence.sourceFlatReport?.flagged.length)failures.push({type:'source-flat-color',frames:evidence.sourceFlatReport.flagged.length,first:evidence.sourceFlatReport.flagged[0]});
let fullRenderAudit=null;
if(videoArg){
 const name=videoArg.slice(8);
 const auditFile=`${checkDir}/${name.includes('preview')?'preview':'final'}-audit.ndjson`;
 if(!existsSync(auditFile))throw new Error(`Missing full render-side audit ${auditFile}; render with the revised scripts/render.mjs first.`);
 const raw=(await fs.readFile(auditFile,'utf8')).trim().split('\n').filter(Boolean).map(line=>normalizeAudit(JSON.parse(line.replace(/^FRAME_AUDIT /,''))));
 fullRenderAudit=[...new Map(raw.map(a=>[a.globalFrame,a])).values()].sort((a,b)=>a.globalFrame-b.globalFrame);
}
const byFrame=new Map(evidence.records.map(r=>[r.globalFrame,r]));
function auditFor(s){return byFrame.get(sentenceFrame(s));}
function renderedAuditAt(seconds){return fullRenderAudit?.find(a=>a.globalTime>=seconds-1e-7);}

function character(a){return a?.characterBox??a?.character??{};}
function reasons(a,allowInsert=false){
 if(!a||a.missing)return ['missing render-side audit'];
 const b=character(a);const issues=[];
 const validInsert=allowInsert&&a.insert&&/shirt|ball|trophy|map|graphic/i.test(a.subject??'');
 if(!(b.visible&&b.area>=.08)&&!validInsert)issues.push(`character bbox ${(100*(b.area??0)).toFixed(1)}% (<8% or off screen)`);
 if(!(a.cameraHeight>=.3&&a.cameraHeight<=2.5))issues.push(`camera height ${a.cameraHeight}`);
 return issues;
}
function supportingProps(a,s){
 const actors=a?.supportingActors??[],props=s.visual_cue.props??[],issues=[];
 if(props.some(p=>/^teammates?$/.test(p))&&!actors.some(p=>p.outfit===s.visual_cue.outfit))issues.push('missing visible teammate');
 if(props.includes('opponent')&&!actors.some(p=>p.outfit!==s.visual_cue.outfit))issues.push('missing visible opponent');
 if(props.some(p=>p.includes('supporters'))&&!actors.length)issues.push('missing visible supporters');
 if(props.includes('applauding-supporters')&&!actors.some(p=>p.action==='clap'))issues.push('missing clapping supporter');
 return issues;
}
const canonicalTrophyId=id=>{
 const match=(sync.trophyEvents??[]).find(e=>e.count>0&&(id===e.id||id.startsWith(e.id+'-')));
 return match?.id??id;
};
const rows=[];
for(const s of sync.sentences){
 const a=auditFor(s), issues=[...reasons(a),...supportingProps(a,s)];
 const expected=s.visual_cue;
 const actualOutfit=a?.outfit??a?.outfits?.[0];
 if(actualOutfit!==expected.outfit)issues.push(`outfit ${actualOutfit}, expected ${expected.outfit}`);
 // Strong action verbs are checked against the actor's rendered motion tag,
 // independent of the sentence cue used to select a scene.
 const actionFamilies={score:['score','shoot','touch','watch'],lift:['lift'],celebrate:['celebrate','success','smile']};
 const mustMatch=expected.action==='score'||expected.action==='lift'||/\bcelebrates?\b/i.test(s.text);
 if(mustMatch&&!(actionFamilies[expected.action]??[expected.action]).includes(a?.action))issues.push(`motion ${a?.action}, expected ${expected.action}`);
 const cueId=a?.cueId??a?.sentenceId;
 if(cueId!==s.id)issues.push(`active cue ${cueId}, expected ${s.id}`);
 if(!Number.isFinite(a?.cueStartedAtSeconds))issues.push('missing rendered cue onset');
 else if(Math.abs(a.cueStartedAtSeconds-s.absoluteKeySeconds)>.3)issues.push('visual onset differs by >0.3s');
 const trophies=(sync.trophyEvents??[]).filter(e=>e.absoluteSeconds<=sentenceFrame(s)/30+1e-5);
 const actualIds=(a?.trophyIds??[]).map(canonicalTrophyId);
 const expectedIds=[...new Set(trophies.filter(e=>e.count>0).map(e=>e.id))];
 if(expected.props?.some?.(p=>/troph|champions-league|premier-league|ballon-dor|fifa-player|euro|nations-league|cup/i.test(p))||/Champions League|Ballon d['’]Or|Premier League|Euro|Nations League|title|trophy|cup/i.test(s.text)||s.trophies?.length){
  // Sentence-key checks are supplemented with exact per-award reveal checks below.
  for(const id of expectedIds)if(!actualIds.includes(id))issues.push(`missing cumulative trophy ${id}`);
  if(actualIds.length!==expectedIds.length)issues.push(`cabinet count ${actualIds.length}, expected ${expectedIds.length}`);
 }
 const result=issues.length?'FAIL: '+issues.join('; '):'PASS';
 rows.push({id:s.id,sentence:s.text,timestamp:s.absoluteKeySeconds,expectedVisual:`${expected.action}; ${expected.outfit}; ${(expected.props??[]).join(', ')}; ${expected.camera}`,result,audit:a});
 if(fullRenderAudit){
  const v=renderedAuditAt(s.absoluteKeySeconds),vIssues=[...reasons(v),...supportingProps(v,s)];
  if(!v||v.globalTime-s.absoluteKeySeconds>.3)vIssues.push('no rendered frame within0.3s of keyword');
  if(v?.cueId!==s.id)vIssues.push(`rendered cue ${v?.cueId}, expected ${s.id}`);
  if(v?.outfit!==expected.outfit)vIssues.push(`rendered outfit ${v?.outfit}, expected ${expected.outfit}`);
  if(mustMatch&&!(actionFamilies[expected.action]??[expected.action]).includes(v?.action))vIssues.push(`rendered motion ${v?.action}, expected ${expected.action}`);
  if(expected.props?.includes('applauding-supporters')){
   const firstClap=fullRenderAudit.find(r=>r.sceneId===s.sceneId&&r.supportingActors?.some(p=>p.action==='clap'&&p.outfit!==expected.outfit));
   if(!firstClap||Math.abs(firstClap.globalTime-s.absoluteKeySeconds)>.3)vIssues.push('supporter clap onset differs by >0.3s');
  }
  rows.at(-1).renderedFrame=v?.globalTime;
  rows.at(-1).renderedCueDelay=v?v.globalTime-s.absoluteKeySeconds:null;
  if(vIssues.length){rows.at(-1).result='FAIL: '+[...issues,...vIssues].join('; ');issues.push(...vIssues);}
 }
 if(issues.length)failures.push({type:'sentence',id:s.id,issues});
}
const trophyRows=[];
for(const event of sync.trophyEvents??[]){
 const f=Math.ceil(event.absoluteSeconds*30-1e-7),a=byFrame.get(f);
 const expected=[...new Set((sync.trophyEvents??[]).filter(e=>e.count>0&&e.absoluteSeconds<=f/30+1e-5).map(e=>e.id))];
 const actual=(a?.trophyIds??[]).map(canonicalTrophyId);
 const issues=[];
 for(const id of expected)if(!actual.includes(id))issues.push(`missing ${id}`);
 if(actual.length!==expected.length)issues.push(`count ${actual.length}, expected ${expected.length}`);
 const revealedId=event.count>0?event.id:(sync.trophyEvents??[]).find(e=>e.count>0&&e.kind===event.kind&&e.year===event.year)?.id;
 if(!actual.includes(revealedId))issues.push('named award not on screen at spoken key');
 if(fullRenderAudit){
  const v=renderedAuditAt(event.absoluteSeconds),vIds=(v?.trophyIds??[]).map(canonicalTrophyId);
  const vExpected=[...new Set((sync.trophyEvents??[]).filter(e=>e.count>0&&e.absoluteSeconds<=(v?.globalTime??event.absoluteSeconds)+1e-5).map(e=>e.id))];
  for(const id of vExpected)if(!vIds.includes(id))issues.push(`rendered missing ${id}`);
  if(vIds.length!==vExpected.length)issues.push(`rendered count ${vIds.length}, expected ${vExpected.length}`);
 }
 const row={...event,expectedIds:expected,actualIds:actual,result:issues.length?'FAIL: '+issues.join('; '):'PASS'};
 trophyRows.push(row);if(issues.length)failures.push({type:'trophy',id:event.id,issues});
}
const yearRows=[];
for(const event of sync.yearEvents??[]){
 const f=Math.ceil(event.absoluteSeconds*30-1e-7),a=byFrame.get(f);
 const actualYear=Number(a?.yearCard??a?.yearLabel??0);
 const issues=actualYear===event.year?[]:[`year card ${actualYear||'missing'}, expected ${event.year}`];
 if(fullRenderAudit){const v=renderedAuditAt(event.absoluteSeconds);if(Number(v?.yearCard)!==event.year)issues.push(`rendered year card ${v?.yearCard}, expected ${event.year}`);}

 yearRows.push({...event,actualYear,result:issues.length?'FAIL: '+issues.join('; '):'PASS'});
 if(issues.length)failures.push({type:'year-card',sentenceId:event.sentenceId,year:event.year,issues});
}
const runtime=fullRenderAudit??evidence.records.filter(a=>a.globalFrame%30===0);
const visible=runtime.filter(a=>character(a).visible&&character(a).area>=.08).length;
const runtimeFraction=visible/runtime.length;
if(runtimeFraction<.9)failures.push({type:'runtime',visibleFraction:runtimeFraction});
for(const a of [...evidence.records,...(fullRenderAudit??[])]){const issues=reasons(a,true);if(issues.length)failures.push({type:'framing',frame:a.globalFrame,issues});}
let flatReport=null,video=null;
if(fullRenderAudit){
 let insertStart=null,previous=null;
 for(const a of [...fullRenderAudit,{insert:false,globalTime:script.totalDuration}]){
  if(a.insert&&insertStart===null)insertStart=a.globalTime;
  if(!a.insert&&insertStart!==null){const duration=a.globalTime-insertStart;
   if(duration>2+1/30)failures.push({type:'insert-duration',start:insertStart,duration});insertStart=null;}
  previous=a;
 }
 const insertFraction=fullRenderAudit.filter(a=>a.insert).length/fullRenderAudit.length;
 if(insertFraction>.1)failures.push({type:'insert-runtime',fraction:insertFraction});
}

if(videoArg){
 video=videoArg.slice(8);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
 const stream=meta.streams.find(s=>s.codec_type==='video');
 const [fn,fd]=stream.r_frame_rate.split('/').map(Number),fps=fn/fd;
 if(fullRenderAudit.length!==Number(stream.nb_frames))failures.push({type:'audit-coverage',expectedFrames:Number(stream.nb_frames),actualFrames:fullRenderAudit.length});
 const frameStage=video.includes('preview')?'preview':'final';
 await fs.mkdir(`${checkDir}/${frameStage}`,{recursive:true});
 for(const s of sync.sentences){
  execFileSync('ffmpeg',['-v','error','-y','-ss',String(s.absoluteKeySeconds),'-i',video,'-frames:v','1',`${checkDir}/${s.id}-${s.absoluteKeySeconds.toFixed(3)}.png`]);
  await fs.copyFile(`${checkDir}/${s.id}-${s.absoluteKeySeconds.toFixed(3)}.png`,`${checkDir}/${frameStage}/${s.id}-${s.absoluteKeySeconds.toFixed(3)}.png`);
 }
 const flat=await scanFlat(['-i',video],stream.width,stream.height,fps,`${checkDir}/flat-regions.jsonl`);
 const flagged=flat.filter(r=>!r.passed);
 flatReport={video,width:stream.width,height:stream.height,fps,framesChecked:flat.length,method:'Native-resolution RGB24, fixed 16/256 channel bins, four-neighbor connected components; cinematic letterbox excluded; no downscaling',threshold:.30,maxRegionFraction:Math.max(...flat.map(r=>r.regionFraction)),flagged};
 if(flagged.length)failures.push({type:'flat-color',frames:flagged.length,first:flagged[0]});
}
const trophyPattern=/Champions League|Ballon d['’]Or|Premier League|Euro|Nations League|title|trophy|cup/i;
const trophySentences=rows.filter(r=>trophyPattern.test(r.sentence));
const clean=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
const md=['# Voice-to-visual sync checks','',`Source audit: ${evidence.capturedAt}. Character visibility at least 8%: ${visible}/${runtime.length} ${fullRenderAudit?'rendered frames':'runtime samples'} (${(runtimeFraction*100).toFixed(1)}%).`,
 video?`Frames extracted with ffmpeg from ${video} at each exact key-word timestamp.`:'Source-only capture; run with --video=... after the 540p preview render.',
 '', '| Sentence | Timestamp | Expected visual | Check result |','| --- | ---: | --- | --- |',
 ...rows.map(r=>`| ${clean(r.sentence)} | ${r.timestamp.toFixed(3)}s | ${clean(r.expectedVisual)} | ${clean(r.result)} |`),
 '', '## Trophy-keyword sentences','',...trophySentences.map(r=>`- ${r.timestamp.toFixed(3)}s — ${r.sentence} **${r.result}**`),
 '', '## Award reveals and cumulative cabinet','', '| Award ID | Timestamp | Expected count | Actual count | Result |','| --- | ---: | ---: | ---: | --- |',
 ...trophyRows.map(r=>`| ${r.id} | ${r.absoluteSeconds.toFixed(3)}s | ${r.expectedIds.length} | ${r.actualIds.length} | ${clean(r.result)} |`),
 '', '## Spoken year cards','', '| Sentence | Timestamp | Year | Result |','| --- | ---: | ---: | --- |',
 ...yearRows.map(r=>`| ${r.sentenceId} | ${r.absoluteSeconds.toFixed(3)}s | ${r.year} | ${clean(r.result)} |`),
 '',flatReport?`Connected flat-region audit: ${flatReport.framesChecked} frames, maximum ${(flatReport.maxRegionFraction*100).toFixed(2)}%, ${flatReport.flagged.length} failures. ${flatReport.method}.`:`Source pixel audit: ${evidence.sourceFlatReport?.framesChecked??0} captured frames, maximum ${((evidence.sourceFlatReport?.maxRegionFraction??0)*100).toFixed(2)}%, ${evidence.sourceFlatReport?.flagged.length??0} failures. Full pixel audit pending preview.`,
 '',`Failures: ${failures.length}.`, ''];
const stage=video?video.includes('preview')?'preview':'final':'source';
await fs.writeFile(`${checkDir}/sync-table.md`,md.join('\n'));
await fs.writeFile(`${checkDir}/sync-table-${stage}.md`,md.join('\n'));
await fs.writeFile(`${checkDir}/results.json`,JSON.stringify({sourceHash:fingerprint,video,rows,trophyRows,yearRows,trophySentences:trophySentences.map(r=>r.id),runtime:{visible,samples:runtime.length,fraction:runtimeFraction,fullRenderFrames:Boolean(fullRenderAudit)},sourceFlatReport:evidence.sourceFlatReport,flatReport,failures},null,2)+'\n');
await fs.copyFile(`${checkDir}/results.json`,`${checkDir}/results-${stage}.json`);
if(video)await fs.copyFile(`${checkDir}/flat-regions.jsonl`,`${checkDir}/flat-regions-${stage}.jsonl`);
console.table(rows.map(({sentence,timestamp,expectedVisual,result})=>({sentence,timestamp:timestamp.toFixed(3),expectedVisual,result})));
console.log(`Character runtime ${(runtimeFraction*100).toFixed(1)}%; ${failures.length} failures. Evidence: ${checkDir}/sync-table.md`);
if(failures.length)process.exitCode=1;
