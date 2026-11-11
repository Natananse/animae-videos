import type {CameraShot} from '../components/CameraRig';
import type {Outfit} from '../components/Player3D';
import {baseMotion, handPosition, type ActorMotion, type Vec3} from './football.ts';
import {livingPose} from './continuousMotion.ts';

export type TrophyKind = 'champions-league' | 'premier-league' | 'ballon-dor' |
  'fifa-player' | 'euro' | 'nations-league';
/** start is the measured key-word boundary in scene-local seconds. */
export type TrophyEvent = {
  id: string; sceneId: string; start: number; kind: TrophyKind; year: number;
  count?: number; years?: number[]; duration?: number; label?: string;
};
export type EarnedTrophy = {
  id: string; eventId: string; kind: TrophyKind; year: number; ordinal: number;
};
export type TrophyState = {
  earned: EarnedTrophy[]; event: TrophyEvent | null; focus: EarnedTrophy | null;
  phase: 'reveal' | 'lift' | 'cabinet'; elapsed: number; lift: number; flash: number;
  seconds: number; cameraPush: number;
};
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => {const n = clamp(value); return n * n * (3 - 2 * n);};
const sceneOrder = (id: string) => Number(id.replace(/\D/g, ''));
export const trophyRevealDuration = (event: TrophyEvent) => clamp(event.duration ?? 1.7, 1, 2);

export function trophiesEarnedBy(events: TrophyEvent[], sceneId: string, seconds: number): EarnedTrophy[] {
  const order = sceneOrder(sceneId);
  return [...events].sort((a, b) => sceneOrder(a.sceneId) - sceneOrder(b.sceneId) || a.start - b.start)
    .filter(event => (event.count ?? 1) > 0)
    .filter(event => sceneOrder(event.sceneId) < order ||
      (event.sceneId === sceneId && seconds + 1e-7 >= event.start))
    .flatMap(event => Array.from({length: Math.max(0, Math.floor(event.count ?? event.years?.length ?? 1))}, (_, index) => ({
      id: `${event.id}-${index + 1}`, eventId: event.id, kind: event.kind,
      year: event.years?.[index] ?? event.year, ordinal: index,
    })));
}

/** Named-prize insert followed by a two-second lift/cabinet payoff. */
export function isTrophyWindow(events: TrophyEvent[], sceneId: string, seconds: number): boolean {
  return events.some(event => event.sceneId === sceneId && seconds + 1e-7 >= event.start &&
    seconds < event.start + trophyRevealDuration(event) + 2);
}

export function getTrophyState(events: TrophyEvent[], sceneId: string, seconds: number): TrophyState {
  const earned = trophiesEarnedBy(events, sceneId, seconds);
  const current = events.filter(event => event.sceneId === sceneId && seconds + 1e-7 >= event.start)
    .sort((a, b) => b.start - a.start)[0] ?? null;
  const elapsed = current ? seconds - current.start : 0;
  const reveal = current ? trophyRevealDuration(current) : 1.7;
  const focused = current ? current.count === 0
    ? earned.filter(item => item.kind === current.kind &&
      (current.years?.includes(item.year) ?? item.year === current.year))
    : earned.filter(item => item.eventId === current.id) : [];
  // A grouped spoken count is represented by that many separate models immediately.
  // Move one model to the foreground/hand; never clone it in the cabinet.
  const focus = focused[focused.length - 1] ?? null;
  // Each reveal contributes a smooth push that decays slowly. Summing the
  // contributions keeps camera velocity continuous when the next prize is named.
  const revealTimes = [...new Set(events.filter(event => event.sceneId === sceneId && event.start <= seconds)
    .map(event => event.start))];
  const cameraPush = revealTimes.reduce((sum, start) => {const age = seconds - start;
      return sum + (1 - Math.exp(-age / .7)) ** 2 * Math.exp(-age / 5);}, 0);
  return {earned, event: current, focus, elapsed, seconds, cameraPush,
    phase: current && elapsed < reveal ? 'reveal' : current && elapsed < reveal + 2 ? 'lift' : 'cabinet',
    lift: current ? smooth((elapsed - reveal) / 1.3) : 0,
    flash: current ? Math.max(0, 1 - elapsed / .17) : 0};
}

export type TrophyCameraShot = CameraShot & {framing: 'trophy-cabinet'};
export function trophyCamera(state: TrophyState): TrophyCameraShot {
  const push = 1 - Math.exp(-state.cameraPush * .7);
  const arc = Math.sin(state.seconds * .18) * .05;
  return {
    // Both the athlete and the named trophy remain visible during the push-in.
    position: [-.05 + arc, 1.88 - .08 * push, 6.65 - .6 * push],
    target: [-.15, 1.55, 0], fov: 35, keepComposition: true, framing: 'trophy-cabinet',
  };
}

/** The trophy base follows the real right palm from Player3D's exact rig hierarchy. */
export function trophyLiftMotion(state: TrophyState): {motion: ActorMotion; hand: Vec3; scale: number} {
  let motion = baseMotion('proud');
  motion.position = [1.2, 0, .15];
  motion.yaw = -.08;
  motion.emotionFrom = 'relieved'; motion.emotionBlend = clamp(state.elapsed / 1.2);
  motion.gaze = [-.12, .08]; motion.head = [-.035, -.04, 0];
  const release = state.phase === 'cabinet' && state.event
    ? 1 - smooth((state.elapsed - trophyRevealDuration(state.event) - 2) / 1.2) : 1;
  const lift = state.phase === 'reveal' ? 0 : state.lift * release;
  motion.arms[1] = {shoulder: [-.12 - lift * 1.88, -.12, .16], elbow: -.18 - lift * .12, wrist: .05};
  motion.arms[0] = {shoulder: [-.1 - lift * .1, 0, -.12 - lift * .45], elbow: .18 + lift * .8, wrist: 0};
  motion = livingPose(motion, state.seconds, .7);
  return {motion, hand: handPosition(motion, 1), scale: .48};
}

export function trophyOutfit(sceneId: string): Outfit {
  return sceneId === 'scene04' ? 'united' : sceneId === 'scene05' ? 'madrid' : 'portugal';
}
