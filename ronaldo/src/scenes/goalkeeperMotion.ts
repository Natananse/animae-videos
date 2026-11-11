import type {ActorMotion} from '../animation/football.ts';
import {ANKLE_HEIGHT, baseMotion, bicycleAction, HIP_HEIGHT, solveLeg} from '../animation/football.ts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {const p = clamp(value); return p * p * (3 - 2 * p);};

export const KEEPER_CUES = {
  full: {push: 2.836242, land: 3.963},
  hook: {push: 1.35225, land: 2.144566},
} as const;

/** Anonymous keeper, responding to the same trajectory in the hook and full play. */
export function goalkeeperMotion(seconds: number, variant: 'full' | 'hook' = 'full'): ActorMotion {
  const ball = bicycleAction(seconds, variant).ball;
  const contactAt = variant === 'hook' ? 1.2 : 2.6;
  const goalAt = variant === 'hook' ? 2.2 : 4.05;
  const hit = bicycleAction(contactAt, variant).ball;
  const shotProgress = seconds < contactAt ? 0 : clamp((ball[2] - hit[2]) / (-7.865 - hit[2]));
  const lunge = smooth((shotProgress - .12) / .82);
  const inAir = seconds < goalAt && lunge > 0 && lunge < 1;
  const lift = inAir ? Math.sin(lunge * Math.PI) : 0;
  const anticipate = smooth((seconds - Math.max(0, contactAt - .8)) / .7);
  const recovery = smooth((seconds - goalAt) / .85);
  const motion = baseMotion('frustrated');
  const disappointment = smooth((seconds - goalAt - .4) / .6);
  motion.emotionFrom = 'focus';
  motion.emotionBlend = disappointment;
  // The push first lifts the feet, then begins lateral travel; settle at a fixed
  // position before the soles return to the ground.
  motion.position = [-.9 + .72 * smooth((lunge - .055) / .945), lift * .32, -6.35];
  motion.hipHeight = seconds >= goalAt
    ? .76 + (HIP_HEIGHT - .76) * recovery
    : HIP_HEIGHT - .17 * anticipate - .13 * lunge;
  motion.torso = [.1 + .24 * lunge * (1 - recovery), -.08, -.18 * lift];
  motion.head = [.03 + .12 * disappointment, .1 + .18 * shotProgress, -.04 * lift];
  motion.gaze = [.35 - .25 * disappointment, -.12 - .12 * disappointment];
  motion.shoulderDrop = disappointment * .06;
  motion.breath = Math.sin(seconds * 3) * .012;
  motion.legs = [
    solveLeg(ANKLE_HEIGHT + .12 * lift, -.12 - .12 * lift, motion.hipHeight),
    solveLeg(ANKLE_HEIGHT + .16 * lift, .12 + .2 * lift, motion.hipHeight),
  ];
  const reach = smooth((shotProgress - .05) / .85) * (1 - recovery * .65);
  motion.arms = [
    {shoulder: [-.65, .12, -.38], elbow: -.7, wrist: .12},
    {shoulder: [-.3 - .25 * reach, -.08, .15 + 1.18 * reach], elbow: -.35 * (1 - reach), wrist: -.08},
  ];
  return motion;
}
