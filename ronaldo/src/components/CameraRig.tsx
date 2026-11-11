import React, {useContext, useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Box3, Mesh, PerspectiveCamera, Raycaster, Vector3} from 'three';
import {sentenceAt, yearAt} from '../animation/sync';
import {FrameContext} from './FrameAudit';

export type CameraRigProps = {
  preset?: string; progress?: number; action?: boolean; target?: [number, number, number];
  shot?: CameraShot;
};

export type CameraShot = {position: [number, number, number]; target: [number, number, number]; fov?: number; keepComposition?: boolean};

type CameraBeat = {angle: number; distance: number; height: number; aimY: number; fov: number};
const smooth = (n: number) => n * n * (3 - 2 * n);
const mix = (a: number, b: number, n: number) => a + (b - a) * n;

// Each six-second passage has a distinct composition. Interpolating complete
// camera states gives the same continuous path when seeking or rendering at 15fps.
const orbitBeats: CameraBeat[] = [
  {angle: -.32, distance: 6.8, height: 1.15, aimY: 1.43, fov: 38},
  {angle: .22, distance: 6.65, height: 1.65, aimY: 1.48, fov: 38},
  {angle: .62, distance: 7.2, height: 2.0, aimY: 1.55, fov: 40},
  {angle: -.2, distance: 6.8, height: 1.25, aimY: 1.42, fov: 38},
  {angle: -.62, distance: 7.3, height: 1.05, aimY: 1.45, fov: 39},
  {angle: .1, distance: 6.7, height: 1.7, aimY: 1.5, fov: 38},
  {angle: .5, distance: 7.15, height: 2.05, aimY: 1.52, fov: 40},
  {angle: -.38, distance: 6.8, height: 1.2, aimY: 1.43, fov: 38},
];
const heroBeats: CameraBeat[] = [
  {angle: .08, distance: 6.8, height: 1.45, aimY: 1.48, fov: 38},
  {angle: -.2, distance: 6.65, height: 1.2, aimY: 1.48, fov: 38},
  {angle: .21, distance: 7.0, height: 1.85, aimY: 1.5, fov: 39},
  {angle: -.12, distance: 6.8, height: 1.55, aimY: 1.48, fov: 38},
  {angle: .16, distance: 6.9, height: 1.28, aimY: 1.48, fov: 38},
];
function beatAt(beats: CameraBeat[], seconds: number): CameraBeat {
  const passage = Math.max(0, seconds) / 6;
  const index = Math.floor(passage);
  const start = beats[index % beats.length];
  const end = beats[(index + 1) % beats.length];
  const blend = smooth(passage - index);
  return {angle: mix(start.angle, end.angle, blend), distance: mix(start.distance, end.distance, blend),
    height: mix(start.height, end.height, blend), aimY: mix(start.aimY, end.aimY, blend), fov: mix(start.fov, end.fov, blend)};
}

/** Evaluated from the Remotion frame, so seeks and concurrent renders match. */
export function CameraRig({preset = 'hero', progress = 0, action = false, target, shot}: CameraRigProps) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {camera, scene, invalidate} = useThree();
  const auditContext = useContext(FrameContext);
  const seconds = frame / fps;
  const p = Math.min(1, Math.max(0, progress));
  const ease = p * p * (3 - 2 * p);
  const drift = Math.sin(seconds * Math.PI / 6);
  const hero = beatAt(heroBeats, seconds);
  let position: [number, number, number] = [Math.sin(hero.angle) * hero.distance, hero.height,
    Math.cos(hero.angle) * hero.distance];
  let aim: [number, number, number] = target ?? [0, hero.aimY, 0];
  let fov = hero.fov;
  if (/dolly|push|shirt/.test(preset)) {
    const passage = beatAt(heroBeats, seconds);
    const sway = /shirt/.test(preset) ? .55 : 1;
    position = [0.45 + passage.angle * 2 * sway - ease * .25,
      1.65 + (passage.height - 1.45) * .42, 7.4 - ease * 2.2 + (passage.distance - 6.8) * .7];
    aim = target ?? [0, /shirt/.test(preset) ? 1.9 : 1.46, 0];
    fov = 38 + (passage.fov - 38) * .45;
  } else if (/orbit/.test(preset)) {
    const beat = beatAt(orbitBeats, seconds);
    position = [Math.sin(beat.angle) * beat.distance, beat.height, Math.cos(beat.angle) * beat.distance];
    aim = target ?? [0, beat.aimY, 0];
    fov = beat.fov;
  } else if (/wide|pull|legacy/.test(preset)) {
    position = [0.1 + drift * 0.2, 2.1 + ease * 3.5, 6.5 + ease * 12];
    aim = target ?? [0, 1.4, 0];
    fov = 42;
  } else if (/bicycle|action/.test(preset)) {
    const beat = beatAt(orbitBeats, seconds);
    const distance = beat.distance + .45;
    const angle = beat.angle * .75;
    position = [Math.sin(angle) * distance, beat.height + .4, Math.cos(angle) * distance];
    aim = target ?? [-.25, 2.05 + (beat.aimY - 1.43), 0];
    fov = 43 + (beat.fov - 38) * .5;
  } else if (/street|child|madeira/.test(preset)) {
    position = [2.4 - ease * 1.2 + hero.angle * 2, 1.1 + (hero.height - 1.45) * .35,
      6.5 - ease * 1.3 + (hero.distance - 6.8) * .5];
    aim = target ?? [0, 1, 0];
    fov = 40;
  }
  if (shot) {
    position = shot.position;
    aim = shot.target;
    fov = shot.fov ?? 38;
  }
  const shake = action ? Math.sin(seconds * 32) * Math.sin(Math.PI * p) * 0.012 : 0;
  useLayoutEffect(() => {
    // Follow the actual posed mesh, including a moving child's world position.
    scene.updateMatrixWorld(true);
    const subjects: import('three').Object3D[] = [];
    const inserts: import('three').Object3D[] = [];
    const obstacles: import('three').Object3D[] = [];
    const trophyObjects: import('three').Object3D[] = [];
    scene.traverse((object) => {
      if (object.userData.mainCharacter) subjects.push(object);
      if (object.userData.insertSubject) inserts.push(object);
      if (object.userData.cameraObstacle && object instanceof Mesh) obstacles.push(object);
      if (object.userData.trophyId) trophyObjects.push(object);
    });
    const subject = subjects[0] ?? inserts[0];
    const bounds = subject ? new Box3().setFromObject(subject) : null;
    let look = new Vector3(...aim);
    let eye = new Vector3(position[0] + shake, Math.max(.3, Math.min(2.5, position[1])), position[2]);
    if (bounds && !bounds.isEmpty() && !shot?.keepComposition) {
      const center = bounds.getCenter(new Vector3());
      const size = bounds.getSize(new Vector3());
      const child = Boolean(subject?.userData.child);
      const close = eye.distanceTo(new Vector3(...aim)) < 3.9;
      const direction = new Vector3(eye.x - aim[0], 0, eye.z - aim[2]).normalize();
      if (direction.lengthSq() < .1) direction.set(.15, 0, 1);
      const distance = close ? (child ? 2.45 : 3.25) : (child ? 3.6 : 5.0);
      const focusY = close ? bounds.max.y - size.y * .26 : center.y + size.y * .10;
      look.set(center.x, focusY, center.z);
      eye.set(center.x + direction.x * distance, Math.max(.65, Math.min(2.5, close ? focusY : focusY + .18)), center.z + direction.z * distance);
      const right = new Vector3(direction.z, 0, -direction.x);
      look.addScaledVector(right, distance * Math.tan(fov * Math.PI / 360) * .30);
      const ray = new Raycaster(look, eye.clone().sub(look).normalize(), .15, look.distanceTo(eye));
      const first = ray.intersectObjects(obstacles, false)[0];
      if (first && first.distance < look.distanceTo(eye) + .12) {
        eye.copy(look).addScaledVector(ray.ray.direction, Math.max(.7, first.distance - .35));
        eye.y = Math.max(.3, Math.min(2.5, eye.y));
      }
    }
    camera.position.copy(eye);
    camera.lookAt(look);
    if (camera instanceof PerspectiveCamera) {
      camera.fov = fov;
      camera.near = 0.1;
      camera.far = 120;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);
    const project = (box: Box3 | null) => {
      if (!box || box.isEmpty()) return {x: 0, y: 0, width: 0, height: 0, area: 0, visible: false};
      const points = [0, 1].flatMap(x => [0, 1].flatMap(y => [0, 1].map(z =>
        new Vector3(x ? box.max.x : box.min.x, y ? box.max.y : box.min.y, z ? box.max.z : box.min.z).project(camera))));
      const x = Math.max(0, (Math.min(...points.map(p => p.x)) + 1) / 2);
      const right = Math.min(1, (Math.max(...points.map(p => p.x)) + 1) / 2);
      const top = (1 - 16 / 9 / 2.39) / 2;
      const y = Math.max(top, (1 - Math.max(...points.map(p => p.y))) / 2);
      const bottom = Math.min(1 - top, (1 - Math.min(...points.map(p => p.y))) / 2);
      const width = Math.max(0, right - x), height = Math.max(0, bottom - y);
      return {x, y, width, height, area: width * height,
        visible: points.some(p => p.z > -1 && p.z < 1) && width * height >= .08};
    };
    const characterBox = project(subjects[0] ? new Box3().setFromObject(subjects[0]) : null);
    const cue = sentenceAt(auditContext.sceneId, seconds);
    const year = yearAt(auditContext.sceneId, seconds);
    console.log('FRAME_AUDIT ' + JSON.stringify({cueId: cue?.id, cueStartedAtSeconds: auditContext.fromSeconds + (cue?.keySeconds ?? 0),
      yearCard: year?.year ?? null, yearCardStartedAtSeconds: year ? auditContext.fromSeconds + year.startSeconds : null,
      action: subject?.userData.visualAction ?? 'reaction', sceneId: auditContext.sceneId,
      localSeconds: seconds, globalTime: auditContext.fromSeconds + seconds, frame, fps,
      characterBox, cameraHeight: eye.y, outfit: subject?.userData.outfit ?? null,
      trophyIds: trophyObjects.filter(object => project(new Box3().setFromObject(object)).area > .00005).map(object => object.userData.trophyId), insert: !subjects.length && inserts.length > 0,
      subject: subjects.length ? 'character' : inserts[0]?.userData.insertSubject ?? 'missing'}));
    invalidate();
  }, [camera, scene, frame, position[0], position[1], position[2], aim[0], aim[1], aim[2], shake, fov, invalidate]);
  return null;
}

export default CameraRig;
