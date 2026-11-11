import assert from 'node:assert/strict';
import {checkDir} from './delivery.mjs';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {actionElapsed, livingPose, reactionMotion, syncedScore} from '../src/animation/continuousMotion.ts';
import {baseMotion, bootBottomY, bootPosition, childStory, CHILD_SCALE, handPosition, poseAction} from '../src/animation/football.ts';
import {getTrophyState, trophyCamera, trophyLiftMotion} from '../src/animation/trophies.ts';

const sync = JSON.parse(await readFile('public/sync.json', 'utf8'));
const events = sync.trophyEvents.map(event => ({...event, start: event.startSeconds, duration: 1.5}));
const length = vector => Math.hypot(...vector);
const distance = (a, b) => length(a.map((n, i) => n - b[i]));
const signature = m => [m.yaw, m.hipHeight, ...m.pelvis, ...m.torso, ...m.head, ...m.gaze,
  ...m.arms.flatMap(arm => [...arm.shoulder, arm.elbow, arm.wrist]),
  ...m.legs.flatMap(leg => [...leg.hip, leg.knee, leg.ankle])];
const summary = [];

// Test a full half-second window rather than adjacent pictures. A quiet pose may
// reach a natural extremum but must never remain an identical held keyframe.
function continuous(name, action, from, to) {
  let minimum = Infinity;
  for (let frame = Math.ceil(from * 30); frame <= (to - .5) * 30; frame++) {
    const samples = Array.from({length: 16}, (_, i) => signature(action((frame + i) / 30)));
    const range = Math.max(...samples[0].map((_, i) => Math.max(...samples.map(s => s[i])) - Math.min(...samples.map(s => s[i]))));
    minimum = Math.min(minimum, range);
    assert(range > .001, `${name} holds its articulated pose at ${(frame / 30).toFixed(3)}s (${range})`);
  }
  summary.push({name, from, to, minimumJointRangePerHalfSecond: minimum, result: 'PASS'});
}
for (const emotion of ['proud', 'smile', 'determined', 'relieved', 'focus', 'sad'])
  continuous(`reaction-${emotion}`, time => reactionMotion(time, emotion), 0, 40);
continuous('score-follow-through', time => syncedScore(time).motion, 0, 12);
continuous('childhood-opening', time => livingPose(childStory(time + 4).motion, time), 0, 2.4);
continuous('childhood-retry', time => livingPose(childStory(time + 4).motion, time), 11.4, 13.4);
continuous('childhood-smile', time => livingPose(childStory(time + 4).motion, time), 22, 25.9);

const strike = syncedScore(0);
assert(Math.abs(distance(bootPosition(strike.motion, 1), strike.ball) - .235) < 1e-9,
  'score ball does not touch the toe surface at the spoken key');
for (let frame = 0; frame < 12 * 120; frame++) {
  const sample = syncedScore(frame / 120);
  for (const leg of [0, 1]) assert(bootBottomY(sample.motion, leg) >= -1e-8, 'score boot clips the floor');
}
const source = baseMotion('proud');
for (let frame = 0; frame < 600; frame++) {
  const moved = livingPose(source, frame / 30);
  for (const leg of [0, 1]) assert(distance(bootPosition(moved, leg), bootPosition(source, leg)) < 1e-12,
    'secondary movement slides a planted foot');
}
for (const sceneId of ['scene04', 'scene05', 'scene07']) {
  const sceneEvents = events.filter(event => event.sceneId === sceneId);
  const start = sceneEvents[0].start;
  const end = Math.max(...sceneEvents.map(event => event.start)) + 5;
  continuous(`${sceneId}-award-actor`, time => trophyLiftMotion(getTrophyState(events, sceneId, time)).motion, start, end);
  let maxStep = 0;
  for (let frame = Math.ceil(start * 120); frame < end * 120; frame++) {
    const seconds = frame / 120;
    const state = getTrophyState(events, sceneId, seconds);
    const held = trophyLiftMotion(state);
    assert(distance(held.hand, handPosition(held.motion, 1)) < 1e-12, 'trophy loses the palm');
    const next = trophyCamera(getTrophyState(events, sceneId, seconds + 1 / 120));
    const step = distance(trophyCamera(state).position, next.position);
    maxStep = Math.max(maxStep, step);
    assert(step < .004, `award camera snaps at ${sceneId} ${seconds}`);
  }
  summary.push({name: `${sceneId}-award-camera`, maximumStepAt120fps: maxStep, result: 'PASS'});
}
// Identical action/outfit sentences cannot restart the running rig or ball.
for (const sceneId of [...new Set(sync.sentences.map(sentence => sentence.sceneId))]) {
  const rows = sync.sentences.filter(sentence => sentence.sceneId === sceneId);
  for (let i = 1; i < rows.length; i++) {
    const current = rows[i], previous = rows[i - 1];
    if (current.visual_cue.action !== previous.visual_cue.action || current.visual_cue.outfit !== previous.visual_cue.outfit) continue;
    if (!['run', 'dribble', 'training'].includes(current.visual_cue.action)) continue;
    const clockBefore = actionElapsed(rows, previous.id, current.keySeconds);
    const clockAfter = actionElapsed(rows, current.id, current.keySeconds);
    assert(Math.abs(clockBefore - clockAfter) < 1e-12, 'sentence boundary resets the action');
    const before = poseAction(current.visual_cue.action, clockBefore), after = poseAction(current.visual_cue.action, clockAfter);
    assert(distance(before.ball, after.ball) < 1e-12, 'sentence boundary pops the ball');
  }
}
summary.push({name: 'exact strike, floor contact, planted feet, palm attachment and sentence clocks', result: 'PASS'});
await mkdir(checkDir, {recursive: true});
await writeFile(`${checkDir}/continuous-motion-rig.json`, JSON.stringify({fps: 30, summary}, null, 2) + '\n');
console.table(summary);
console.log('Continuous motion rig checks passed.');
