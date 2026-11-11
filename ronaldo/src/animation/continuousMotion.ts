import {ANKLE_HEIGHT, baseMotion, bootPosition, poseAction, solveLeg,
  type ActionSample, type ActorMotion, type Emotion} from './football.ts';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {const p = clamp(n); return p * p * (3 - 2 * p);};

/** Secondary motion is confined to the upper body: planted feet stay planted. */
export function livingPose(source: ActorMotion, seconds: number, amount = 1): ActorMotion {
  const slow = Math.sin(seconds * .83);
  const turn = Math.sin(seconds * .61 + .7);
  const nod = Math.sin(seconds * 1.37 + .2);
  return {...source,
    torso: [source.torso[0] + .013 * slow * amount,
      source.torso[1] + .023 * turn * amount, source.torso[2] + .009 * nod * amount],
    head: [source.head[0] + .025 * nod * amount,
      source.head[1] + .045 * Math.sin(seconds * .71 + .3) * amount,
      source.head[2] + .012 * slow * amount],
    gaze: [source.gaze[0] + .035 * Math.sin(seconds * .71 + .3) * amount,
      source.gaze[1] + .015 * nod * amount],
    breath: source.breath + .014 * Math.sin(seconds * 2.05),
    arms: source.arms.map((arm, index) => ({...arm,
      shoulder: [arm.shoulder[0] + .035 * Math.sin(seconds * .93 + index * .8) * amount,
        arm.shoulder[1], arm.shoulder[2] + .015 * slow * amount],
      elbow: arm.elbow + .025 * Math.sin(seconds * 1.11 + index * .9) * amount,
    })) as ActorMotion['arms'],
  };
}

/** Reactions settle into a living stance instead of holding a farewell keyframe. */
export function reactionMotion(seconds: number, emotion: Emotion, clock = seconds): ActorMotion {
  const motion = baseMotion(emotion);
  const proud = emotion === 'proud' || emotion === 'smile';
  const relaxed = emotion === 'relieved';
  motion.head = [emotion === 'sad' || emotion === 'frustrated' ? .15 : -.025, 0, 0];
  motion.shoulderDrop = emotion === 'frustrated' ? .09 : emotion === 'sad' ? .07 : relaxed ? .035 : 0;
  motion.arms[0].elbow = relaxed ? .3 : .12;
  motion.arms[1].elbow = relaxed ? .35 : .12;
  if (proud) {
    // A small acknowledgement, then a repeatable, quiet fist lift. The sine
    // window has zero velocity at each end and never resets the whole rig.
    const acknowledge = ease(seconds / .65);
    const pulse = .5 - .5 * Math.cos(Math.max(0, seconds) * Math.PI * 2 / 5.6);
    const fist = acknowledge * (.35 + .32 * pulse);
    motion.arms[1] = {shoulder: [-.18 - .20 * fist, -.08, .16 + .30 * fist],
      elbow: .20 + .85 * fist, wrist: -.10 * fist};
    motion.torso[1] = -.055 * fist;
  }
  return livingPose(motion, clock, proud ? 1 : .7);
}

/** Consecutive sentences describing the same action share one animation clock. */
export function actionElapsed(rows: {id: string; keySeconds: number; visual_cue: {action: string; outfit: string}}[],
  id: string, seconds: number): number {
  let index = rows.findIndex(row => row.id === id);
  if (index < 0) return Math.max(0, seconds);
  const current = rows[index];
  while (index > 0 && rows[index - 1].visual_cue.action === current.visual_cue.action &&
    rows[index - 1].visual_cue.outfit === current.visual_cue.outfit) index--;
  return Math.max(0, seconds - rows[index].keySeconds);
}

/** Exact-key strike, foot recovery, then an ongoing celebration. No held end frame. */
export function syncedScore(seconds: number, clock = seconds): ActionSample {
  const t = Math.max(0, seconds);
  const kickPose = (at: number) => {
    const motion = baseMotion(at < 1 ? 'determined' : 'smile');
    motion.yaw = Math.PI;
    motion.legs[1] = solveLeg(ANKLE_HEIGHT + .11 * Math.exp(-at * 4), .38 * Math.exp(-at * 3.2));
    motion.torso = [.04 * Math.exp(-at * 2), -.10 * Math.exp(-at * 2), 0];
    motion.arms[0].shoulder = [-.15, 0, -.35 * Math.exp(-at * 2) - .09];
    return motion;
  };
  const motion = kickPose(t);
  const happy = poseAction('celebrate', Math.max(0, t - .75) + 1.5).motion;
  const celebrate = ease((t - .9) / .7);
  motion.arms = motion.arms.map((arm, i) => ({
    shoulder: arm.shoulder.map((n, axis) => n + (happy.arms[i].shoulder[axis] - n) * celebrate) as [number, number, number],
    elbow: arm.elbow + (happy.arms[i].elbow - arm.elbow) * celebrate,
    wrist: arm.wrist + (happy.arms[i].wrist - arm.wrist) * celebrate,
  })) as ActorMotion['arms'];
  // Turn back towards the stands after following the shot into the net.
  motion.yaw = Math.PI + Math.PI * ease((t - 1.25) / 1.45);
  const toe = bootPosition(kickPose(0), 1);
  const radius = .235;
  const offset = Math.sqrt(Math.max(0, radius * radius - (radius - toe[1]) ** 2));
  const start = [toe[0], radius, toe[2] - offset];
  const p = clamp(t / .9);
  return {motion: livingPose(motion, clock, .85 * celebrate),
    ball: [start[0] + (.7 - start[0]) * p, radius + Math.sin(p * Math.PI) * 1.1,
      start[2] + (-7.86 - start[2]) * p],
    phase: 'score', contact: t < 1 / 30, goal: t >= .9, landed: true};
}
