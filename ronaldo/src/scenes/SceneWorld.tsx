import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {InstancedMesh, Object3D} from 'three';
import {CameraRig, CameraShot} from '../components/CameraRig';
import {Lights} from '../components/Lights';
import {CinematicEffects} from '../components/CinematicEffects';

export type SceneProps = {durationInFrames: number};
export const smooth = (n: number) => {const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t);};
export const useSceneTime = (duration: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, seconds: frame / fps, progress: frame / Math.max(1, duration - 1), fps};
};

export type ShotBeat = CameraShot & {from: number; to: number;
  endPosition?: [number, number, number]; endTarget?: [number, number, number]; endFov?: number};
/** Explicit edit decisions: cuts at beat boundaries, gentle motion within each shot. */
export function shotAt(seconds: number, beats: ShotBeat[]): CameraShot {
  const beat = beats.find((item) => seconds >= item.from && seconds < item.to) ??
    (seconds < beats[0].from ? beats[0] : beats[beats.length - 1]);
  const p = smooth((seconds - beat.from) / Math.max(.01, beat.to - beat.from));
  const blend = (a: [number, number, number], b?: [number, number, number]): [number, number, number] =>
    b ? [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p] : a;
  return {position: blend(beat.position, beat.endPosition), target: blend(beat.target, beat.endTarget),
    fov: (beat.fov ?? 38) + ((beat.endFov ?? beat.fov ?? 38) - (beat.fov ?? 38)) * p};
}

export const SceneWorld: React.FC<{
  children: React.ReactNode; progress: number; warm?: boolean; mood?: string;
  preset?: string; action?: boolean; target?: [number, number, number];
  shot?: CameraShot;
  background?: string; fog?: [number, number]; flashTimes?: number[];
  faceFill?: boolean;
}> = ({children, progress, warm = false, mood = 'stadium', preset = 'hero', action = false,
  target, shot, background = '#030b19', fog = [12, 62], flashTimes = [], faceFill}) => {
  const {width, height, fps} = useVideoConfig();
  const seconds = useCurrentFrame() / fps;
  const flash = flashTimes.reduce((v, time) => Math.max(v, Math.max(0, 1 - Math.abs(seconds - time) / .34)), 0);
  const cameraDistance = shot ? Math.hypot(...shot.position.map((value, index) => value - shot.target[index])) : Infinity;
  const lightFace = faceFill ?? Boolean(shot && shot.target[1] > 1.25 && cameraDistance < 4.2);
  const fillPosition: [number, number, number] = shot
    ? [shot.position[0] + .35, shot.position[1] + .45, shot.position[2]] : [0, 3, 4];
  return <AbsoluteFill style={{backgroundColor: background}}>
    <ThreeCanvas width={width} height={height} dpr={1} shadows
      camera={{position: [0, 2, 8], fov: 38, near: .1, far: 180}}
      gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, ...fog]} />
      <Lights warm={warm} mood={mood} faceFill={lightFace} fillPosition={fillPosition} />
      <CameraRig preset={preset} progress={progress} action={action} target={target} shot={shot} />
      {children}
      <CinematicEffects target={shot?.target ?? target} />
    </ThreeCanvas>
    {flash > 0 && <AbsoluteFill style={{background: '#fff4d2', opacity: flash * .12, mixBlendMode: 'screen'}} />}
  </AbsoluteFill>;
};

export const Box: React.FC<{position: [number, number, number]; size: [number, number, number];
  color: string; emissive?: string; rotation?: [number, number, number]; roughness?: number;
}> = ({position, size, color, emissive, rotation, roughness = .75}) => <mesh position={position}
  rotation={rotation} userData={{cameraObstacle: true}} castShadow receiveShadow>
  <boxGeometry args={size} /><meshStandardMaterial color={color} emissive={emissive ?? '#000000'}
    emissiveIntensity={emissive ? .9 : 0} roughness={roughness} />
</mesh>;

export const Ball: React.FC<{position?: [number, number, number]; rotation?: [number, number, number];
  worn?: boolean; scale?: number}> = ({position = [1.1, .24, 0], rotation = [0, 0, 0], worn = false, scale = 1}) =>
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow><icosahedronGeometry args={[.235, 2]} /><meshStandardMaterial
      color={worn ? '#c4b397' : '#e2e9ec'} roughness={.85} /></mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} rotation={[i * 1.7, i * 2.1, i * .74]}>
      <torusGeometry args={[.234, .006, 3, 24]} /><meshStandardMaterial color={worn ? '#554a3f' : '#19222d'} />
    </mesh>)}
  </group>;

export const Trophy: React.FC<{position?: [number, number, number]; scale?: number; glow?: boolean}> =
  ({position = [0, 0, 0], scale = 1, glow = true}) => <group position={position} scale={scale}>
    <mesh castShadow position={[0, .08, 0]}><boxGeometry args={[.7, .16, .55]} />
      <meshStandardMaterial color="#18222b" metalness={.5} roughness={.25} /></mesh>
    <mesh position={[0, .48, 0]} castShadow><cylinderGeometry args={[.11, .2, .7, 12]} />
      <meshStandardMaterial color="#e5b75c" metalness={.8} roughness={.22} /></mesh>
    <mesh position={[0, 1.08, 0]} castShadow><sphereGeometry args={[.38, 20, 12]} />
      <meshStandardMaterial color="#e5b75c" metalness={.75} roughness={.2}
        emissive="#d87c14" emissiveIntensity={glow ? .18 : 0} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * .34, .91, 0]} rotation={[0, 0, side * .5]}>
      <torusGeometry args={[.24, .045, 6, 16, Math.PI * 1.5]} />
      <meshStandardMaterial color="#e5b75c" metalness={.8} roughness={.2} />
    </mesh>)}
  </group>;

export const Goal: React.FC<{position?: [number, number, number]; scale?: number; netTime?: number}> =
  ({position = [0, 0, -7], scale = 1, netTime = 0}) => {
  const ripple = netTime > 0 ? Math.sin(netTime * 22) * Math.exp(-netTime * 3) * .14 : 0;
  return <group position={position} scale={scale}>
    <Box position={[-3, 1.4, 0]} size={[.09, 2.8, .09]} color="#c8d4dc" />
    <Box position={[3, 1.4, 0]} size={[.09, 2.8, .09]} color="#c8d4dc" />
    <Box position={[0, 2.8, 0]} size={[6.1, .09, .09]} color="#c8d4dc" />
    {Array.from({length: 17}, (_, i) => <Box key={`v${i}`} position={[-3 + i * .375, 1.4, -1.1 - ripple * Math.sin(i / 16 * Math.PI)]}
      size={[.014, 2.8, .014]} color="#73818b" />)}
    {Array.from({length: 8}, (_, i) => <Box key={`h${i}`} position={[0, i * .4, -1.1 - ripple * Math.sin(i / 7 * Math.PI)]}
      size={[6, .014, .014]} color="#73818b" />)}
  </group>;
};

export const Dust: React.FC<{gold?: boolean; count?: number; spread?: number}> = ({gold = false, count = 70, spread = 20}) => {
  const frame = useCurrentFrame();
  const points = useMemo(() => new Float32Array(Array.from({length: count * 3}, (_, i) => {
    const n = Math.sin((i + 1) * 78.233) * 43758.5453;
    const r = n - Math.floor(n);
    return i % 3 === 1 ? r * 8 + .2 : (r - .5) * spread;
  })), [count, spread]);
  return <points rotation={[0, frame * .00013, 0]}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
    <pointsMaterial color={gold ? '#ffc981' : '#84b6e8'} size={.035} transparent opacity={.5} depthWrite={false} />
  </points>;
};

export const Confetti: React.FC<{progress: number; amount?: number; color?: string}> = ({progress, amount = 90, color = '#e9bd5b'}) => {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < amount; i++) {
      const seed = i * 1.618;
      dummy.position.set(Math.sin(seed * 13) * 9, ((i * .719 - progress * 5) % 1 + 1) % 1 * 10,
        Math.cos(seed * 7) * 6 - 2);
      dummy.rotation.set(seed + progress * 14, seed * 2 + progress * 7, seed * 3);
      dummy.scale.set(.045, .13, .01);
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [amount, dummy, progress]);
  return <instancedMesh ref={ref} args={[undefined, undefined, amount]} frustumCulled={false}>
    <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={color} metalness={.65} roughness={.3} />
  </instancedMesh>;
};
