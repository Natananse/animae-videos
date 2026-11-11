import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {BICYCLE_CUES, HOOK_CUES, CHILD_CUES, CHILD_EXIT_START_RUN, dribbleCues, poseAction} from '../src/animation/football.ts';
import {KEEPER_CUES} from '../src/scenes/goalkeeperMotion.ts';

const sync = JSON.parse(readFileSync('public/sync.json', 'utf8'));
const timing = JSON.parse(readFileSync('public/timing.json', 'utf8'));
const sceneStarts = new Map(timing.scenes.map(scene => [scene.id, scene.from / timing.fps]));
const sceneEnds = new Map(timing.scenes.map(scene => [scene.id, (scene.from + scene.durationInFrames) / timing.fps]));
const sentences = new Map(timing.scenes.map(scene => [scene.id, sync.sentences.filter(sentence => sentence.sceneId === scene.id)]));
const totalDuration = timing.totalFrames / timing.fps;
const locate = time => timing.scenes.find(scene => time >= scene.from / timing.fps && time < (scene.from + scene.durationInFrames) / timing.fps);
const sentenceAt = (sceneId, seconds) => {
  const rows = sentences.get(sceneId);
  return rows.filter(sentence => sentence.keySeconds <= seconds + 1e-6).at(-1) ?? rows[0];
};

// Match SyncedScene's precedence: award/reaction replacements suppress the old
// pitch/tunnel contacts, while the two procedural chapters restart on each key.
const routeAt = time => {
  const scene = locate(time);
  if (!scene) return 'outside';
  const seconds = time - sceneStarts.get(scene.id);
  const cue = sentenceAt(scene.id, seconds);
  const {action, outfit} = cue.visual_cue;
  const award = (scene.id === 'scene04' && seconds >= 16.15 && outfit === 'united') ||
    (scene.id === 'scene05' && ((seconds >= 3.52 && seconds < 12) || seconds >= 29.15)) ||
    (scene.id === 'scene07' && seconds >= 1.01 && action !== 'score' && seconds < 14.4);
  if (award) return 'trophy';
  if (action === 'celebrate' && scene.id === 'scene04') return 'reaction';
  if (scene.id === 'scene01' && seconds >= 1.9 && seconds < 6.55) return 'reaction';
  if (scene.id === 'scene08' && seconds < 2) return 'reaction';
  if ((scene.id === 'scene04' && outfit === 'madrid') ||
    (scene.id === 'scene07' && (outfit === 'alnassr' || action === 'shirt'))) return 'reaction';
  if (scene.id === 'scene06' && (action === 'shirt' || action === 'reaction')) return 'reaction';
  if (action === 'score' && (scene.id === 'scene04' || scene.id === 'scene07')) return 'score';
  if (scene.id === 'scene03' || scene.id === 'scene06') return 'procedural';
  return 'baseline';
};

const baseline = [];
const add = (time, kind, gain = .6) => baseline.push({time, kind, gain});
const group = (offset, source, gain = .6) => source.forEach(cue => add(offset + cue.time, cue.kind, gain));
const walk = (offset, duration, speed, gain = .5) => {
  for (let time = 0; time < duration; time += .36 / speed) add(offset + time, 'step', gain);
};
group(0, HOOK_CUES, .82);
add(KEEPER_CUES.hook.push, 'step', .28);
add(KEEPER_CUES.hook.land, 'land', .32);
group(6, CHILD_CUES, .66);
group(36, dribbleCues(11), .48); walk(36 + 14.2, 5.8, .45);
walk(56, 6, .45); group(56 + 6, dribbleCues(7), .53);
group(56 + 15, dribbleCues(10), .53);
group(92, dribbleCues(12), .5);
group(92 + 12, BICYCLE_CUES, .8);
add(104 + KEEPER_CUES.full.push, 'step', .28);
add(104 + KEEPER_CUES.full.land, 'land', .32);
group(92 + 23.3, dribbleCues(9.7), .48);
group(132, dribbleCues(6.7), .48); walk(132 + 6.7, 6.5, .48);
group(132 + 13.2, dribbleCues(6.8), .48);
group(152, dribbleCues(11.3), .48); walk(152 + 23.1, 4, .33, .4);
// The preserved ending's childExit starts at 189s; its running cycle begins 1.9s later.
for (let time = 189 + CHILD_EXIT_START_RUN; time < 199.5; time += .36) add(time, 'step', .5);

// Retain the clean-pass policy at generation as well as in the mixer. There are
// no noise beds, net bursts, cloth, breath, cheer or applause in this cue file.
const allowed = new Set(['step', 'touch', 'kick', 'land']);
const cues = baseline.filter(cue => allowed.has(cue.kind) && routeAt(cue.time) === 'baseline');
const retainedBaseline = cues.length;
const scoreContacts = [];
const proceduralContacts = [];
for (const scene of timing.scenes) {
  const rows = sentences.get(scene.id);
  const start = sceneStarts.get(scene.id);
  for (const [index, sentence] of rows.entries()) {
    const from = start + sentence.keySeconds;
    const until = index + 1 < rows.length ? start + rows[index + 1].keySeconds : sceneEnds.get(scene.id);
    const route = routeAt(from);
    if (route === 'score') {
      cues.push({time: from, kind: 'kick', gain: .64});
      scoreContacts.push({sentenceId: sentence.id, time: from});
      // Goal arrival is visual at +.9s; the existing clean policy excludes net noise.
    } else if (route === 'procedural') {
      const action = sentence.visual_cue.action;
      const contacts = action === 'run'
        ? Array.from({length: Math.ceil((until - from) / .36)}, (_, index) => ({time: index * .36, kind: 'step'}))
        : dribbleCues(until - from);
      for (const contact of contacts) {
        const time = from + contact.time;
        if (time >= until - 1e-7 || routeAt(time) !== 'procedural') continue;
        cues.push({time, kind: contact.kind, gain: .48});
        proceduralContacts.push({sentenceId: sentence.id, time, kind: contact.kind, action: action === 'run' ? 'run' : action === 'training' ? 'training' : 'dribble', elapsed: contact.time});
      }
    }
  }
}

// These are behavioural invariants for the generated soundtrack: no contacts
// during a static replacement, and exactly one kick at each rendered score key.
assert(cues.every(cue => cue.time >= 0 && cue.time < totalDuration && allowed.has(cue.kind)));
assert(cues.every(cue => ['baseline', 'procedural', 'score'].includes(routeAt(cue.time))), 'Contact sound over trophy or reaction replacement');
for (const contact of scoreContacts) {
  assert.equal(cues.filter(cue => cue.kind === 'kick' && Math.abs(cue.time - contact.time) < 1e-6).length, 1, `${contact.sentenceId}: score contact missing or duplicated`);
}
for (const contact of proceduralContacts.filter(contact => contact.kind === 'touch')) {
  // Evaluate just after the exact cycle seam to avoid floating-point floor
  // selecting the preceding .72s cycle; one microsecond is below an audio sample.
  assert(poseAction(contact.action, contact.elapsed + 1e-6).contact, `${contact.sentenceId}: touch sound has no rendered ball/boot contact`);
}
const ordered = cues.sort((a, b) => a.time - b.time);
for (let index = 1; index < ordered.length; index++) assert(ordered[index].time >= ordered[index - 1].time);
const routingHash = createHash('sha256').update(readFileSync('src/scenes/SyncedScene.tsx')).digest('hex');
mkdirSync('.cache', {recursive: true});
writeFileSync('.cache/sound_cues.json', JSON.stringify(ordered, null, 2) + '\n');
writeFileSync('.cache/sound_cue_audit.json', JSON.stringify({
  source: 'Measured sentence keys and shared football contact cycles; SyncedScene replacement routing',
  syncedSceneSha256: routingHash, totalCues: ordered.length, retainedBaseline,
  removedBaseline: baseline.length - retainedBaseline, scoreContacts, proceduralContactCount: proceduralContacts.length,
  noContactsDuringTrophyOrReaction: true, retainedKinds: [...allowed],
}, null, 2) + '\n');
console.log(`Prepared ${ordered.length} contact-synchronized clean Foley cues: ${retainedBaseline} preserved, ${proceduralContacts.length} sentence-timed contacts, ${scoreContacts.length} score kicks; ${baseline.length - retainedBaseline} superseded cues removed.`);
