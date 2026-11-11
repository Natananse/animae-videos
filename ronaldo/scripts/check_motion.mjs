import assert from 'node:assert/strict';
import {goalkeeperMotion, KEEPER_CUES} from '../src/scenes/goalkeeperMotion.ts';
import {bicycleAction, bootBottomY, bootPosition, BOOT_GEOMETRY, childExit, childStory, CHILD_SCALE,
  CHILD_EXIT_START_RUN, dribbleAction, facialState, handPosition, poseAction, runningMotion, trainingAction, ACTION_CUES} from '../src/animation/football.ts';

const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
const near = (actual, expected, tolerance, label) => assert(Math.abs(actual - expected) <= tolerance,
  `${label}: ${actual}, expected ${expected} ± ${tolerance}`);

// A stance foot must remain in world space while the body travels over it.
for (const scale of [1, CHILD_SCALE]) for (const yaw of [0, Math.PI]) {
  for (const [leg, times] of [[0, [.08, .14, .20, .30]], [1, [.44, .50, .56, .64]]]) {
    const positions = times.map(time => bootPosition(runningMotion(time, .35, scale, [0, 0, 0], yaw), leg, scale));
    for (const position of positions) {
      near(distance(position, positions[0]), 0, 1e-9, 'planted foot drift');
      near(position[1], .085 * scale, 1e-9, 'toe height above grounded sole');
    }
    for (const time of times) near(bootBottomY(runningMotion(time, .35, scale, [0, 0, 0], yaw), leg, scale),
      0, 1e-9, 'actual rounded outsole ground contact');
  }
}
near(BOOT_GEOMETRY.soleCenter[1] - BOOT_GEOMETRY.soleRadii[1], -.1, 1e-12, 'rounded sole bottom');
near(BOOT_GEOMETRY.upperCenter[2] + BOOT_GEOMETRY.upperRadius * BOOT_GEOMETRY.upperScale[2],
  BOOT_GEOMETRY.toe[2], 1e-12, 'toe collision point is rendered upper surface');
assert(BOOT_GEOMETRY.soleRadii[0] < BOOT_GEOMETRY.upperRadius * BOOT_GEOMETRY.upperScale[0], 'sole protrudes laterally');
assert(BOOT_GEOMETRY.soleRadii[2] < BOOT_GEOMETRY.upperRadius * BOOT_GEOMETRY.upperScale[2], 'sole protrudes beyond boot footprint');
assert(BOOT_GEOMETRY.soleRadii[1] * 2 < .034, 'sole is not thinner than the old platform');

for (const [variant, time] of [['full', 2.6], ['hook', 1.2]]) {
  const contact = bicycleAction(time, variant);
  near(time * 30, Math.round(time * 30), 1e-9, 'contact is an exact final frame');
  near(time * 15, Math.round(time * 15), 1e-9, 'contact is an exact preview frame');
  near(distance(bootPosition(contact.motion, 1), contact.ball), .235, 1e-9, 'strike surface contact');
  assert(bicycleAction(time + .12, variant).ball[2] < contact.ball[2], 'shot travels consistently towards negative Z');
}
for (const time of ACTION_CUES.child.touches) {
  const sample = childStory(time);
  near(distance(bootPosition(sample.motion, 1, CHILD_SCALE), sample.ball), .235 * CHILD_SCALE, 1e-9, 'child touch');
}
for (const action of [dribbleAction, trainingAction]) for (let time = .32; time < 12; time += .72) {
  const sample = action(time);
  near(distance(bootPosition(sample.motion, 1), sample.ball), .235, 1e-8, 'ground dribble touch');
}

// Guard against prop resets between action phases and against ground penetration.
for (const [action, duration, radius] of [[childStory, 30, .235 * CHILD_SCALE], [dribbleAction, 20, .235],
  [trainingAction, 20, .235], [t => bicycleAction(t), 6.4, .235]]) {
  let previous = action(0);
  for (let frame = 1; frame <= duration * 240; frame++) {
    const current = action(frame / 240);
    assert(current.ball[1] >= radius - 1e-6, 'ball below ground');
    assert(distance(current.ball, previous.ball) < .09, 'ball teleports between phases');
    previous = current;
  }
}
for (const time of [3.5, 4.3, 6.4]) near(bicycleAction(time).motion.position[1], 0, 1e-9, 'landed root');
near(bicycleAction(4.05).ball[2] - .235, -8.1, 1e-9, 'ball reaches physical back net');
for (const time of [2, 3, 5, 8]) {
  const sample = childExit(time);
  const hands = [handPosition(sample.motion, 0, CHILD_SCALE), handPosition(sample.motion, 1, CHILD_SCALE)];
  assert(hands.every(hand => distance(hand, sample.ball) < .235 * CHILD_SCALE + .07), 'carried ball detached from hands');
}
// Every grounded action keeps its real boot surfaces above the floor.
for (const [action, duration, scale] of [[t => childStory(t).motion, 30, CHILD_SCALE],
  [t => bicycleAction(t).motion, 6.4, 1], [t => childExit(t).motion, 11, CHILD_SCALE]]) {
  for (let frame = 0; frame <= duration * 120; frame++) for (const leg of [0, 1]) {
    assert(bootBottomY(action(frame / 120), leg, scale) >= -1e-8, 'rendered boot surface below ground');
  }
}
// Expression transitions remain continuous even when an action changes emotion labels.
for (const [action, duration] of [[t => childStory(t).motion, 30], [t => bicycleAction(t).motion, 6.4],
  [t => poseAction('farewell', t).motion, 6], [t => poseAction('celebrate', t).motion, 4]]) {
  let previous = facialState(action(0));
  for (let frame = 1; frame <= duration * 240; frame++) {
    const current = facialState(action(frame / 240));
    assert(Object.keys(current).every(key => Math.abs(current[key] - previous[key]) < .012), 'abrupt facial expression switch');
    previous = current;
  }
}
near(CHILD_EXIT_START_RUN, 1.9, 1e-12, 'ending run starts on shared Foley cue');
assert(childExit(10).motion.position[2] < childExit(8).motion.position[2] - .5, 'ending child freezes before leaving');
for (const variant of ['full', 'hook']) {
  const duration = variant === 'full' ? 6.4 : 3;
  let previous;
  for (let frame = 0; frame <= duration * 240; frame++) {
    const motion = goalkeeperMotion(frame / 240, variant);
    for (const leg of [0, 1]) {
      const bottom = bootBottomY(motion, leg);
      assert(bottom >= -1e-8, 'keeper boot penetrates the ground');
      if (previous) {
        assert(Math.abs(bottom - bootBottomY(previous, leg)) < .02, 'keeper boot pops during push or landing');
        assert(Math.abs(motion.legs[leg].knee - previous.legs[leg].knee) < .06, 'keeper knee jumps');
      }
    }
    previous = motion;
  }
  for (const times of [[.1, .2], [KEEPER_CUES[variant].land + .1, KEEPER_CUES[variant].land + .4]]) {
    for (const leg of [0, 1]) near(distance(...times.map(time => bootPosition(goalkeeperMotion(time, variant), leg))),
      0, 1e-8, 'keeper planted foot slides');
  }
}
console.log('Motion checks passed: rounded boot bounds, grounded stances, frame-aligned strikes, contacts, continuity, landing, net, carry, smooth emotion, continuous ending and grounded keeper attempts.');
