import {Euler, Vector3} from 'three';

export type Vec3 = [number, number, number];
export type Emotion = 'neutral' | 'focus' | 'frustrated' | 'determined' | 'relieved' | 'proud' | 'sad' | 'smile';
export type FacialState = {brow: number; lift: number; eye: number; smile: number};
const facialTargets: Record<Emotion, FacialState> = {
  neutral: {brow: -.06, lift: 0, eye: .65, smile: 0},
  focus: {brow: -.22, lift: -.01, eye: .50, smile: 0},
  frustrated: {brow: -.31, lift: -.015, eye: .48, smile: -.6},
  determined: {brow: -.19, lift: -.005, eye: .54, smile: 0},
  relieved: {brow: .03, lift: .012, eye: .60, smile: .35},
  proud: {brow: -.02, lift: .008, eye: .60, smile: .3},
  sad: {brow: .24, lift: .012, eye: .58, smile: -.45},
  smile: {brow: .06, lift: .015, eye: .46, smile: .75},
};
export type LegPose = {hip: Vec3; knee: number; ankle: number};
export type ArmPose = {shoulder: Vec3; elbow: number; wrist: number};
export type ActorMotion = {
  position: Vec3; yaw: number; hipHeight: number; pelvis: Vec3; torso: Vec3;
  head: Vec3; gaze: [number, number]; emotion: Emotion; shoulderDrop: number;
  arms: [ArmPose, ArmPose]; legs: [LegPose, LegPose]; breath: number;
  emotionFrom?: Emotion; emotionBlend?: number;
};
export type ActionSample = {motion: ActorMotion; ball: Vec3; phase: string;
  contact: boolean; goal: boolean; landed: boolean};

export const THIGH = .48;
export const SHIN = .50;
export const HIP_HEIGHT = 1.06;
export const ANKLE_HEIGHT = .10;
export const BOOT_GEOMETRY = {
  upperCenter: [0, -.015, .075] as Vec3, upperRadius: .13, upperScale: [1, .52, 1.55] as Vec3,
  soleCenter: [0, -.086, .075] as Vec3, soleRadii: [.126, .014, .19] as Vec3,
  toe: [0, -.015, .2765] as Vec3, soleBottom: -.10,
};
export const CHILD_SCALE = .68;
export const CHILD_DURATION = 30;
export const CHILD_EXIT_START_RUN = 1.9;
export const CHILD_EXIT_DURATION = 11;
export const BICYCLE_DURATION = 6.4;
export const ACTION_CUES = {
  bicycle: {cross: .2, plant: 1.3, takeoff: 1.82, contact: 2.6, land: 3.5, goal: 4.05, end: 6.4},
  hook: {cross: 0, plant: .38, takeoff: .74, contact: 1.2, land: 1.85, goal: 2.2, end: 3},
  child: {touches: [.32, 1.04, 1.76, 2.48, 3.2, 3.92, 5.8, 18.2, 20.2, 22],
    mistake: 6.4, disappointed: 7.3, retrieve: 9.6, success: 22, smile: 26, end: 30},
  dribble: {touches: [.32, 1.04, 1.76, 2.48, 3.2, 3.92, 4.64, 5.36, 6.08, 6.8, 7.52, 8.24, 8.96, 9.68],
    first: .32, period: .72, end: 10},
} as const;
export type ActionCue = {time: number; kind: 'step' | 'touch' | 'kick' | 'land' | 'net' | 'cheer' | 'breath' | 'cloth'};
export const BICYCLE_CUES: ActionCue[] = [{time: 1.3, kind: 'step'}, {time: 1.82, kind: 'breath'},
  {time: 2.6, kind: 'kick'}, {time: 3.5, kind: 'land'}, {time: 4.05, kind: 'net'}, {time: 4.2, kind: 'cheer'}];
export const HOOK_CUES: ActionCue[] = [{time: .38, kind: 'step'}, {time: 1.2, kind: 'kick'},
  {time: 1.85, kind: 'land'}, {time: 2.2, kind: 'net'}, {time: 2.35, kind: 'cheer'}];
export const CHILD_CUES: ActionCue[] = [
  ...[.32, 1.04, 1.76, 2.48, 3.2, 3.92, 5.8, 18.2, 20.2, 22].map(time => ({time, kind: 'touch' as const})),
  ...[0, .36, .72, 1.08, 1.44, 1.8, 2.16, 2.52, 2.88, 3.24, 3.6, 3.96,
    9.6, 9.96, 10.32, 10.68, 11.04, 11.4, 11.76, 12.12, 12.48, 12.84, 13.2, 13.56, 13.92, 14.28, 14.64, 15]
    .map(time => ({time, kind: 'step' as const})), {time: 7.6, kind: 'breath' as const}, {time: 25.5, kind: 'breath' as const},
].sort((a, b) => a.time - b.time);
export function dribbleCues(duration: number): ActionCue[] {
  const cues: ActionCue[] = [];
  for (let time = .32; time < duration; time += .72) cues.push({time, kind: 'touch'});
  for (let time = 0; time < duration; time += .36) cues.push({time, kind: 'step'});
  return cues.sort((a, b) => a.time - b.time);
}

const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = (value: number) => {const p = clamp(value); return p * p * (3 - 2 * p);};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const between = (time: number, start: number, end: number) => smooth((time - start) / (end - start));
const vec = (a: Vec3, b: Vec3, p: number): Vec3 => a.map((v, i) => lerp(v, b[i], p)) as Vec3;
export function facialState(motion: Pick<ActorMotion, 'emotion' | 'emotionFrom' | 'emotionBlend'>): FacialState {
  const target = facialTargets[motion.emotion];
  const source = facialTargets[motion.emotionFrom ?? motion.emotion];
  const amount = clamp(motion.emotionBlend ?? 1);
  return {brow: lerp(source.brow, target.brow, amount), lift: lerp(source.lift, target.lift, amount),
    eye: lerp(source.eye, target.eye, amount), smile: lerp(source.smile, target.smile, amount)};
}

/** Two-bone IK: grounded ankle targets stay fixed through a planted stance. */
export function solveLeg(ankleY: number, ankleZ: number, hipHeight = HIP_HEIGHT, pelvisPitch = 0): LegPose {
  const down = hipHeight - ankleY;
  const reach = clamp(Math.hypot(down, ankleZ), .10, THIGH + SHIN - .0005);
  const direction = Math.atan2(-ankleZ, down);
  const hipBend = Math.acos(clamp((THIGH * THIGH + reach * reach - SHIN * SHIN) / (2 * THIGH * reach), -1, 1));
  const knee = Math.PI - Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - reach * reach) / (2 * THIGH * SHIN), -1, 1));
  const hip = direction - hipBend - pelvisPitch;
  return {hip: [hip, 0, 0], knee, ankle: -(hip + knee + pelvisPitch)};
}

export function baseMotion(emotion: Emotion = 'neutral'): ActorMotion {
  return {position: [0, 0, 0], yaw: 0, hipHeight: HIP_HEIGHT, pelvis: [0, 0, 0],
    torso: [0, 0, 0], head: [0, 0, 0], gaze: [0, 0], emotion, shoulderDrop: 0,
    arms: [{shoulder: [0, 0, -.09], elbow: .08, wrist: 0}, {shoulder: [0, 0, .09], elbow: .08, wrist: 0}],
    legs: [solveLeg(ANKLE_HEIGHT, 0), solveLeg(ANKLE_HEIGHT, 0)], breath: 0};
}

function rotate(point: Vector3, rotation: Vec3) {return point.applyEuler(new Euler(...rotation));}

/** Exact toe surface point from the same hierarchy used by Player3D. */
export function footPoint(motion: ActorMotion, leg: 0 | 1, local: Vec3, scale = 1): Vec3 {
  const pose = motion.legs[leg];
  const point = new Vector3(...local);
  rotate(point, [pose.ankle, 0, 0]);
  point.add(new Vector3(0, -SHIN, 0));
  rotate(point, [pose.knee, 0, 0]);
  point.add(new Vector3(0, -THIGH, 0));
  rotate(point, pose.hip);
  point.add(new Vector3(leg === 0 ? -.19 : .19, 0, 0));
  rotate(point, motion.pelvis);
  point.y += motion.hipHeight;
  point.multiplyScalar(scale);
  rotate(point, [0, motion.yaw, 0]);
  point.add(new Vector3(...motion.position));
  return point.toArray() as Vec3;
}

export function bootPosition(motion: ActorMotion, leg: 0 | 1, scale = 1): Vec3 {
  return footPoint(motion, leg, BOOT_GEOMETRY.toe, scale);
}

/** Conservative exact ellipsoid bounds for the rendered upper and outsole. */
export function bootBottomY(motion: ActorMotion, leg: 0 | 1, scale = 1): number {
  const origin = footPoint(motion, leg, [0, 0, 0], scale);
  const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(axis =>
    footPoint(motion, leg, axis as Vec3, scale)[1] - origin[1]);
  const upperRadii = BOOT_GEOMETRY.upperScale.map(n => n * BOOT_GEOMETRY.upperRadius) as Vec3;
  const bottom = (center: Vec3, radii: Vec3) => footPoint(motion, leg, center, scale)[1]
    - Math.hypot(...axes.map((component, i) => component * radii[i]));
  return Math.min(bottom(BOOT_GEOMETRY.upperCenter, upperRadii), bottom(BOOT_GEOMETRY.soleCenter, BOOT_GEOMETRY.soleRadii));
}

export function handPosition(motion: ActorMotion, arm: 0 | 1, scale = 1): Vec3 {
  const pose = motion.arms[arm];
  const point = new Vector3(0, -.065, .015);
  rotate(point, [pose.wrist, 0, 0]); point.y -= .40;
  rotate(point, [pose.elbow, 0, 0]); point.y -= .42;
  rotate(point, pose.shoulder);
  point.add(new Vector3(arm === 0 ? -.42 : .42, 1.95 - motion.shoulderDrop - HIP_HEIGHT + motion.breath, 0));
  rotate(point, motion.torso); rotate(point, motion.pelvis);
  point.y += motion.hipHeight;
  point.multiplyScalar(scale); rotate(point, [0, motion.yaw, 0]);
  point.add(new Vector3(...motion.position));
  return point.toArray() as Vec3;
}

/** Run with a world-locked stance foot; swing foot lifts and advances. */
export function runningMotion(time: number, speed = .75, scale = 1, start: Vec3 = [0, 0, 0], yaw = 0): ActorMotion {
  const m = baseMotion('determined');
  const cycle = .72;
  const distance = speed * time;
  m.position = [start[0] + Math.sin(yaw) * distance, 0, start[2] + Math.cos(yaw) * distance];
  m.yaw = yaw;
  m.hipHeight = 1.025 + .018 * Math.cos(time / cycle * Math.PI * 4);
  m.torso = [.12, 0, Math.sin(time / cycle * Math.PI * 2) * .025];
  m.head = [-.10, 0, 0];
  m.gaze = [0, -.15];
  for (const leg of [0, 1] as const) {
    const shifted = time / cycle + leg * .5;
    const step = Math.floor(shifted);
    const phase = shifted - step;
    // Foot plants at the forward stride position, then remains in world space.
    const stride = speed * cycle / scale;
    const footZ = phase < .58
      ? stride * (.29 - phase)
      : lerp(-stride * .29, stride * .29, smooth((phase - .58) / .42));
    const footY = ANKLE_HEIGHT + (phase < .58 ? 0 : Math.sin((phase - .58) / .42 * Math.PI) * .21);
    m.legs[leg] = solveLeg(footY, footZ, m.hipHeight);
    m.arms[leg] = {shoulder: [Math.sin((shifted - step) * Math.PI * 2) * .5, 0, leg === 0 ? -.1 : .1], elbow: .55, wrist: 0};
  }
  return m;
}

function groundTouch(time: number, touch: number, origin: Vec3, scale = 1, force = .7): ActionSample {
  const m = baseMotion('focus');
  m.position = origin;
  const wind = between(time, touch - .55, touch - .12);
  const strike = between(time, touch - .12, touch + .18);
  const recover = between(time, touch + .18, touch + .6);
  const footZ = lerp(-.22 * wind, .43, strike) * (1 - recover);
  const footY = ANKLE_HEIGHT + Math.sin(clamp((time - touch + .55) / 1.15) * Math.PI) * .12;
  m.legs[1] = solveLeg(footY, footZ, m.hipHeight);
  m.torso = [.1 * wind - .07 * strike, -.10 * strike, 0];
  m.head = [.12, -.06, 0];
  m.gaze = [.07, -.25];
  m.arms[0].shoulder = [0, 0, -.2 - .3 * strike];
  m.arms[1].shoulder = [-.1, 0, .12];
  const atContact = baseMotion('focus');
  atContact.position = origin;
  const cWind = between(touch, touch - .55, touch - .12);
  const cStrike = between(touch, touch - .12, touch + .18);
  const contactFootZ = lerp(-.22 * cWind, .43, cStrike);
  const contactFootY = ANKLE_HEIGHT + Math.sin(.55 / 1.15 * Math.PI) * .12;
  atContact.legs[1] = solveLeg(contactFootY, contactFootZ);
  const toe = bootPosition(atContact, 1, scale);
  const radius = .235 * scale;
  const contact: Vec3 = [toe[0], radius, toe[2] + Math.sqrt(Math.max(.001, radius * radius - (radius - toe[1]) ** 2))];
  const after = Math.max(0, time - touch);
  const ball: Vec3 = [contact[0], radius, contact[2] + force * (1 - Math.exp(-after * 1.4))];
  return {motion: m, ball, phase: after <= 0 ? 'prepare' : after < .6 ? 'touch' : 'watch',
    contact: Math.abs(time - touch) < 1 / 60, goal: false, landed: true};
}

function fullBicycle(time: number): ActionSample {
  const t = clamp(time, 0, BICYCLE_DURATION);
  const m = baseMotion('focus');
  const crouch = between(t, .9, 1.65) * (1 - between(t, 1.65, 1.92));
  const flight = clamp((t - 1.82) / (3.5 - 1.82));
  const airborne = t >= 1.82 && t < 3.5;
  m.hipHeight = HIP_HEIGHT - .23 * crouch;
  m.position = [0, airborne ? Math.sin(flight * Math.PI) * .92 : 0, 0];
  m.head = [-.14, .18 * (1 - between(t, 1.1, 1.7)), 0];
  m.gaze = [.45 * (1 - between(t, .2, 2.2)), .3];
  m.torso = [-.04, 0, 0];
  m.legs = [solveLeg(ANKLE_HEIGHT, -.08, m.hipHeight), solveLeg(ANKLE_HEIGHT, .10, m.hipHeight)];
  if (airborne) {
    const rise = between(t, 1.82, 2.38);
    const strike = between(t, 2.38, 2.92);
    const tuck = between(t, 2.94, 3.5);
    m.pelvis = [-.92 * rise * (1 - tuck), 0, .08 * rise * (1 - tuck)];
    m.torso = [-.48 * rise * (1 - tuck), .11 * rise, -.06 * rise];
    m.head = [.15 * rise, -.10, 0];
    m.gaze = [.08, .3 * (1 - strike)];
    m.legs[1] = {hip: [lerp(-1.1, -3.72, strike) * (1 - tuck), 0,
      .04 + .7 * between(t, 2.64, 2.95)],
      knee: lerp(.55, .06, strike) + 1.3 * tuck, ankle: -.12};
    m.legs[0] = {hip: [lerp(-2.0, .7, strike) * (1 - tuck), 0, -.07],
      knee: .8 + .75 * strike, ankle: .08};
    m.arms = [{shoulder: [-.6, .1, -.95 + .4 * tuck], elbow: .55 + .6 * tuck, wrist: 0},
      {shoulder: [.3, -.1, .8 - .3 * tuck], elbow: .35 + .4 * tuck, wrist: 0}];
    const landing = between(t, 3.1, 3.5);
    m.hipHeight = lerp(HIP_HEIGHT, .68, landing);
    m.pelvis = vec(m.pelvis, [0, 0, 0], landing);
    m.torso = vec(m.torso, [.5, 0, 0], landing);
    for (const leg of [0, 1] as const) {
      const target = solveLeg(ANKLE_HEIGHT, leg === 0 ? -.18 : .2, m.hipHeight);
      m.legs[leg] = {hip: vec(m.legs[leg].hip, target.hip, landing),
        knee: lerp(m.legs[leg].knee, target.knee, landing), ankle: lerp(m.legs[leg].ankle, target.ankle, landing)};
    }
  }
  if (t >= 3.5) {
    const rise = between(t, 3.5, 4.25);
    m.hipHeight = lerp(.68, HIP_HEIGHT, rise);
    m.pelvis = [0, 0, 0];
    m.torso = [.5 * (1 - rise), 0, 0];
    m.head = [.2 * (1 - rise), -.14, 0];
    m.legs = [solveLeg(ANKLE_HEIGHT, -.18 * (1 - rise), m.hipHeight),
      solveLeg(ANKLE_HEIGHT, .2 * (1 - rise), m.hipHeight)];
    m.arms = [{shoulder: [-.55 * (1 - rise), 0, -.35], elbow: .5, wrist: 0},
      {shoulder: [-.4 * (1 - rise), 0, .32], elbow: .35, wrist: 0}];
    m.emotion = t < 4.15 ? 'relieved' : 'smile';
    m.emotionFrom = t < 4.15 ? 'focus' : 'relieved';
    m.emotionBlend = t < 4.15 ? between(t, 3.5, 4.05) : between(t, 4.15, 4.8);
    m.breath = Math.sin((t - 3.5) * 4) * .02;
    if (t > 4.3) {
      const fist = between(t, 4.3, 4.75);
      m.arms[1] = {shoulder: [-.3, 0, 1.0 * fist], elbow: 1.25 * fist, wrist: -.18};
      m.torso = [0, -.12 * fist, 0];
    }
  }
  const strikeMotion = t === ACTION_CUES.bicycle.contact ? m : fullBicyclePoseAtContact();
  const toe = bootPosition(strikeMotion, 1);
  // The center touches the actual toe surface at the shared contact frame.
  const hit: Vec3 = [toe[0], toe[1], toe[2] - .235];
  let ball: Vec3;
  if (t <= 2.6) {
    const p = between(t, .1, 2.6);
    ball = vec([3.6, 3.4, -1.1], hit, p);
    ball[1] += Math.sin(p * Math.PI) * .8;
  } else if (t < 4.05) {
    const p = clamp((t - 2.6) / (4.05 - 2.6));
    ball = vec(hit, [.75, 1.15, -7.865], p);
    ball[1] += Math.sin(p * Math.PI) * .25;
  } else {
    const p = between(t, 4.05, 5.3);
    ball = [.75 + Math.sin(p * Math.PI) * .08, lerp(1.15, .235, p), -7.865 + Math.sin(p * Math.PI * 2) * .11 * (1 - p)];
  }
  return {motion: m, ball, phase: t < .9 ? 'track' : t < 1.82 ? 'plant' : t < 2.6 ? 'jump'
    : t < 3.5 ? 'follow-through' : t < 4.25 ? 'land' : 'reaction',
    contact: Math.abs(t - 2.6) < 1 / 60, goal: t >= 4.05, landed: t >= 3.5};
}

// Contact pose mirrors the hierarchy above without recursive ball sampling.
function fullBicyclePoseAtContact(): ActorMotion {
  const t = 2.6;
  const m = baseMotion('focus');
  const flight = (t - 1.82) / (3.5 - 1.82);
  const rise = between(t, 1.82, 2.38);
  const strike = between(t, 2.38, 2.92);
  m.position = [0, Math.sin(flight * Math.PI) * .92, 0];
  m.pelvis = [-.92 * rise, 0, .08 * rise];
  m.torso = [-.48 * rise, .11 * rise, -.06 * rise];
  m.legs[1] = {hip: [lerp(-1.1, -3.72, strike), 0, .04], knee: lerp(.55, .06, strike), ankle: -.12};
  return m;
}

export function bicycleAction(seconds: number, variant: 'full' | 'hook' = 'full'): ActionSample {
  if (variant === 'full') {
    const center = ACTION_CUES.bicycle.contact;
    const halfWindow = .38;
    const u = (seconds - center) / halfWindow;
    const mapped = Math.abs(u) < 1 ? center + halfWindow * (.3 * u + 1.4 * u ** 3 - .7 * u ** 5) : seconds;
    const sample = fullBicycle(mapped);
    sample.contact = Math.abs(seconds - center) < 1 / 60;
    return sample;
  }
  // Condensed opening retains preparation, exact contact, then a fast exit.
  const t = clamp(seconds, 0, 3);
  const knots = [[0, .4], [.38, 1.3], [.74, 1.82], [1.08, 2.35], [1.2, 2.6],
    [1.48, 2.92], [2.2, 4.05], [2.35, 4.25], [3, 5.2]];
  let mapped = knots.at(-1)![1];
  for (let i = 0; i < knots.length - 1; i++) {
    if (t <= knots[i + 1][0]) {
      mapped = lerp(knots[i][1], knots[i + 1][1], (t - knots[i][0]) / (knots[i + 1][0] - knots[i][0])); break;
    }
  }
  const sample = fullBicycle(mapped);
  sample.contact = Math.abs(t - 1.2) < 1 / 60;
  return sample;
}

/** Illustrative childhood mini-story; not a documented private event. */
export function childStory(seconds: number): ActionSample {
  const t = clamp(seconds, 0, CHILD_DURATION);
  const scale = CHILD_SCALE;
  const stoppedBall = groundTouch(18.2, 18.2, [1.35, 0, 3.8], scale, 0).ball;
  let sample: ActionSample;
  if (t < 4) {
    const motion = runningMotion(t, .42, scale, [0, 0, -.68]);
    const touches = [.32, 1.04, 1.76, 2.48, 3.2, 3.92];
    const at = (time: number): Vec3 => {
      const toe = bootPosition(runningMotion(time, .42, scale, [0, 0, -.68]), 1, scale);
      const radius = .235 * scale;
      return [toe[0], radius, toe[2] + Math.sqrt(Math.max(.001, radius * radius - (radius - toe[1]) ** 2))];
    };
    const points = [[0, [.1292, .1598, -.33] as Vec3], ...touches.map(time => [time, at(time)] as [number, Vec3]),
      [4, groundTouch(4, 5.8, [0, 0, 1], scale, .35).ball] as [number, Vec3]] as [number, Vec3][];
    let ball = points.at(-1)![1];
    for (let i = 0; i < points.length - 1; i++) {
      if (t <= points[i + 1][0]) {
        const p = clamp((t - points[i][0]) / (points[i + 1][0] - points[i][0]));
        ball = vec(points[i][1], points[i + 1][1], p + .12 * Math.sin(p * Math.PI)); break;
      }
    }
    sample = {motion, ball, phase: 'chase', contact: touches.some(time => Math.abs(t - time) < 1 / 60), goal: false, landed: true};
  } else if (t < 6.4) {
    sample = groundTouch(t, 5.8, [0, 0, 1.0], scale, .35);
    sample.motion.emotionFrom = 'determined'; sample.motion.emotionBlend = between(t, 4, 4.6);
    sample.phase = 'attempt';
  } else if (t < 9.6) {
    sample = groundTouch(6.4, 5.8, [0, 0, 1.0], scale, .35);
    const p = between(t, 6.4, 9.6);
    sample.ball = vec(sample.ball, stoppedBall, p);
    sample.motion = baseMotion(t < 7.3 ? 'focus' : 'frustrated');
    sample.motion.emotionFrom = 'focus';
    sample.motion.emotionBlend = between(t, 7.3, 8.1);
    sample.motion.position = [0, 0, 1];
    sample.motion.head = [.24 * between(t, 7.1, 7.8), .25 * p, .03];
    sample.motion.gaze = [.4, -.3];
    sample.motion.shoulderDrop = .11 * between(t, 7.3, 8);
    sample.motion.torso = [lerp(-.07, .08, between(t, 6.4, 7.2)), 0, 0];
    sample.phase = 'mistake'; sample.contact = false;
  } else if (t < 15.2) {
    const elapsed = t - 9.6;
    const distance = Math.hypot(1.35, 2.8);
    const yaw = Math.atan2(1.35, 2.8);
    const motion = runningMotion(elapsed, distance / 5.6, scale, [0, 0, 1], yaw);
    motion.emotion = 'determined';
    const decide = between(t, 9.6, 10.2);
    motion.head = [lerp(.24, .12, decide), lerp(.25, 0, decide), 0];
    motion.gaze = [lerp(.4, 0, decide), lerp(-.3, -.15, decide)];
    motion.emotionFrom = 'frustrated'; motion.emotionBlend = between(t, 9.6, 10.35);
    sample = {motion, ball: stoppedBall, phase: 'retrieve', contact: false, goal: false, landed: true};
  } else if (t < 21) {
    const elapsed = t - 15.2;
    sample = groundTouch(t, t < 19 ? 18.2 : 20.2, [1.35, 0, 3.8], scale, 0);
    sample.motion.emotion = 'determined';
    sample.motion.head = [.12, 0, 0];
    sample.phase = elapsed < .8 ? 'set-ball' : 'retry';
  } else if (t < 25) {
    sample = groundTouch(t, 22, [1.35, 0, 3.8], scale, 1.45);
    sample.phase = t < 22 ? 'focus' : 'success';
    sample.motion.emotion = t < 23 ? 'focus' : 'relieved';
    sample.motion.emotionFrom = t < 23 ? 'determined' : 'focus';
    sample.motion.emotionBlend = t < 23 ? between(t, 21, 21.6) : between(t, 23, 23.8);
    sample.goal = t >= 23;
  } else {
    const motion = baseMotion(t < 26 ? 'relieved' : 'smile');
    motion.emotionFrom = 'relieved'; motion.emotionBlend = between(t, 26, 27.1);
    motion.position = [1.35, 0, 3.8];
    const soften = between(t, 25, 26.2);
    motion.head = [lerp(.12, -.05, soften), -.15 * soften, -.025 * soften];
    motion.gaze = [-.13, -.06];
    motion.breath = Math.sin((t - 25) * 3) * .018;
    motion.arms[1] = {shoulder: [-.1, 0, .12], elbow: .55 * between(t, 26, 27), wrist: 0};
    sample = {motion, ball: groundTouch(t, 22, [1.35, 0, 3.8], scale, 1.45).ball,
      phase: 'smile', contact: false, goal: true, landed: true};
  }
  return sample;
}

/** A final, imagined departure: the child collects the ball, then carries it away. */
export function childExit(seconds: number): ActionSample {
  const t = Math.max(0, seconds);
  const collect = between(t, .15, 1.25);
  const rise = between(t, 1.25, 1.9);
  const runTime = Math.max(0, t - CHILD_EXIT_START_RUN);
  const motion = t < CHILD_EXIT_START_RUN ? baseMotion('smile') : runningMotion(runTime, .65, CHILD_SCALE, [0, 0, 0], Math.PI);
  motion.yaw = Math.PI;
  motion.emotion = 'smile';
  motion.emotionFrom = 'relieved'; motion.emotionBlend = between(t, 0, 1.2);
  if (t < 1.9) {
    motion.hipHeight = HIP_HEIGHT - .58 * collect * (1 - rise);
    motion.torso = [.5 * collect * (1 - rise), 0, 0];
    motion.head = [.15 * (1 - rise), 0, 0];
    motion.legs = [solveLeg(ANKLE_HEIGHT, 0, motion.hipHeight), solveLeg(ANKLE_HEIGHT, 0, motion.hipHeight)];
  }
  // The collected ball follows the hands, rather than floating independently.
  const carry = between(t, 1.25, 1.9);
  motion.arms = [{shoulder: [-1.2 * carry, 0, lerp(.25, .30, carry)], elbow: .6 * carry, wrist: 0},
    {shoulder: [-1.2 * carry, 0, -lerp(.25, .30, carry)], elbow: .6 * carry, wrist: 0}];
  const left = handPosition(motion, 0, CHILD_SCALE);
  const right = handPosition(motion, 1, CHILD_SCALE);
  const held: Vec3 = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2 - .10, (left[2] + right[2]) / 2];
  const ball = vec([0, .1598, -.55], held, between(t, 1.1, 1.45));
  return {motion, ball, phase: t < 1.9 ? 'collect' : 'run-into-light', contact: false, goal: false, landed: true};
}

function controlledDribble(seconds: number, training: boolean): ActionSample {
  const t = Math.max(0, seconds);
  const speed = training ? .18 : .35;
  const start: Vec3 = [0, 0, 1];
  const motion = runningMotion(t, speed, 1, start, Math.PI);
  motion.emotion = training ? 'focus' : 'determined';
  const spacing = .72;
  const first = .32;
  const previous = Math.max(first, first + Math.floor(Math.max(0, t - first) / spacing) * spacing);
  const next = previous + spacing;
  const at = (time: number): Vec3 => {
    const m = runningMotion(time, speed, 1, start, Math.PI);
    const toe = bootPosition(m, 1);
    const offset = Math.sqrt(Math.max(.001, .235 ** 2 - (.235 - toe[1]) ** 2));
    return [toe[0], .235, toe[2] - offset];
  };
  const p = clamp((t - previous) / spacing);
  const impulse = p + .15 * Math.sin(p * Math.PI);
  let ball = vec(at(previous), at(next), impulse);
  if (t < first) ball = vec([-.19, .235, .4], at(first), smooth(t / first));
  return {motion, ball, phase: training ? 'controlled-repetition' : 'advancing-dribble',
    contact: Math.abs(t - previous) < 1 / 60, goal: false, landed: true};
}

export const trainingAction = (seconds: number) => controlledDribble(seconds, true);
export const dribbleAction = (seconds: number) => controlledDribble(seconds, false);

export function poseAction(action: 'run' | 'dribble' | 'training' | 'celebrate' | 'farewell', seconds: number): ActionSample {
  const t = Math.max(0, seconds);
  if (action === 'run') {
    const motion = runningMotion(t, .65, 1, [0, 0, -1.4]);
    return {motion, ball: [motion.position[0] + .2, .235, motion.position[2] + .75],
      phase: 'run', contact: false, goal: false, landed: true};
  }
  if (action === 'dribble' || action === 'training') {
    return controlledDribble(t, action === 'training');
  }
  const m = baseMotion(action === 'farewell' ? 'sad' : t < 1.5 ? 'relieved' : 'proud');
  m.breath = Math.sin(t * 2.3) * .018;
  if (action === 'farewell') {
    m.head = [.16 + .025 * Math.sin(t * .8), -.12, -.025];
    m.gaze = [-.16, -.2]; m.shoulderDrop = .055;
    const hand = between(t, .3, 1.4);
    m.arms[1] = {shoulder: [-.7 * hand, -.32 * hand, .18], elbow: 1.3 * hand, wrist: .12};
    m.arms[0].elbow = .25;
    m.emotion = t > 3.2 ? 'proud' : 'sad';
    m.emotionFrom = 'sad'; m.emotionBlend = .65 * between(t, 3.2, 4.6);
  } else {
    const fist = between(t, 1.5, 2.2);
    m.head = [lerp(.12, -.04, fist), -.15, 0];
    m.arms[1] = {shoulder: [-.25, 0, .85 * fist], elbow: 1.3 * fist, wrist: -.12};
    m.arms[0].elbow = .15;
    m.torso[1] = -.1 * fist;
    m.emotionFrom = 'relieved'; m.emotionBlend = between(t, 1.5, 2.5);
  }
  return {motion: m, ball: [.8, .235, 1], phase: action, contact: false, goal: action === 'celebrate', landed: true};
}
