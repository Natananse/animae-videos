import React, {useEffect, useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CanvasTexture, LinearFilter, QuadraticBezierCurve3, SRGBColorSpace, TubeGeometry, Vector2, Vector3} from 'three';
import {ActorMotion, ArmPose, baseMotion, bicycleAction, BOOT_GEOMETRY, facialState, HIP_HEIGHT, poseAction, runningMotion, SHIN, THIGH} from '../animation/football';

export type Outfit = 'portugal' | 'united' | 'madrid' | 'sporting' | 'juventus' | 'alnassr' | 'keeper';
export type Pose = 'idle' | 'run' | 'kick' | 'bicycle' | 'celebrate' | 'hold-light' | 'shirt';
export type CharacterAppearance = {number?: number; hair?: 'swept' | 'crop' | 'curls' | 'short';
  face?: 'ronaldo' | 'round' | 'long' | 'square'; build?: number; height?: number; skin?: string;
  hairColor?: string; gloves?: string};
export type Player3DProps = {outfit: Outfit; pose?: Pose; child?: boolean; progress?: number; silhouette?: boolean;
  motion?: ActorMotion; character?: CharacterAppearance};

const kits: Record<Outfit, {shirt: string; trim: string; shorts: string; socks: string}> = {
  portugal: {shirt: '#ba243c', trim: '#238267', shorts: '#143b35', socks: '#b62138'},
  united: {shirt: '#c72139', trim: '#f4e9d8', shorts: '#151b25', socks: '#e7e4d8'},
  madrid: {shirt: '#f0eee1', trim: '#c4a15c', shorts: '#eeeadd', socks: '#efeadc'},
  sporting: {shirt: '#238269', trim: '#ecebdd', shorts: '#1a3335', socks: '#eeece1'},
  juventus: {shirt: '#e4e4dd', trim: '#151b25', shorts: '#20242b', socks: '#e8e6dc'},
  alnassr: {shirt: '#edc94c', trim: '#2c5da0', shorts: '#234879', socks: '#e7c347'},
  keeper: {shirt: '#66528c', trim: '#9cc9c8', shorts: '#202636', socks: '#655587'},
};

function Capsule({position, scale, color, rotation = [0, 0, 0]}: {
  position: [number, number, number]; scale: [number, number, number]; color: string;
  rotation?: [number, number, number];
}) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow>
    <capsuleGeometry args={[1, 1, 4, 10]} /><meshStandardMaterial color={color} roughness={0.78} />
  </mesh>;
}

function ShirtNumber({color, number}: {color: string; number: number}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.clearRect(0, 0, 256, 256); context.fillStyle = color;
    context.font = '900 172px Arial, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(String(Math.max(0, Math.min(99, Math.round(number)))), 128, 135, 238);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter; result.generateMipmaps = false; return result;
  }, [color, number]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <>
    <mesh position={[0, 1.71, .291]}><planeGeometry args={[.37, .43]} />
      <meshBasicMaterial map={texture} transparent alphaTest={.01} toneMapped={false} /></mesh>
    <mesh position={[0, 1.71, -.246]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.37, .43]} />
      <meshBasicMaterial map={texture} transparent alphaTest={.01} toneMapped={false} /></mesh>
  </>;
}

function Jersey({outfit, dark = false, sleeves = true, number = 7, width = 1}: {outfit: Outfit; dark?: boolean; sleeves?: boolean; number?: number; width?: number}) {
  const kit = kits[outfit];
  const shirt = dark ? '#19222a' : kit.shirt;
  const trim = dark ? '#334447' : kit.trim;
  return <group scale={[width, 1, 1]}>
    <Capsule position={[0, 1.7, 0]} scale={[0.37, 0.3, 0.235]} color={shirt} />
    <Capsule position={[0, 1.28, 0]} scale={[.31, .075, .23]} color={shirt} />
    <mesh position={[0, 2.055, 0.025]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.115, 0.035, 5, 16]} /><meshStandardMaterial color={trim} /></mesh>
    <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, .76, 1]}>
      <torusGeometry args={[.29, .012, 4, 16]} /><meshStandardMaterial color={trim} /></mesh>
    {outfit === 'sporting' && [1.5, 1.75, 1.92].map(y => <mesh key={y} position={[0, y, 0.256]}><boxGeometry args={[0.6, 0.075, 0.025]} /><meshStandardMaterial color="#e6ebdf" /></mesh>)}
    {outfit === 'juventus' && [-0.2, 0, 0.2].map(x => <mesh key={x} position={[x, 1.7, 0.257]}><boxGeometry args={[0.085, 0.58, 0.025]} /><meshStandardMaterial color="#202530" /></mesh>)}
    {sleeves && [-1, 1].map(side => <group key={side} position={[side * 0.4, 1.91, 0]} rotation={[0, 0, side * 0.65]}>
      <Capsule position={[0, -0.04, 0]} scale={[0.17, 0.13, 0.175]} color={shirt} />
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.164, 0.164, 0.042, 10]} /><meshStandardMaterial color={trim} /></mesh>
    </group>)}
    <ShirtNumber number={number} color={dark ? '#4d6266' : outfit === 'madrid' || outfit === 'alnassr' ? '#66512b' : '#f3e9d0'} />
  </group>;
}

function HangingShirt({outfit}: {outfit: Outfit}) {
  return <group position={[0, 0.2, 0]}>
    <Jersey outfit={outfit} />
    <group position={[0, 2.25, 0]}>
      <mesh position={[-0.19, -0.05, 0]} rotation={[0, 0, -1.1]}><cylinderGeometry args={[0.014, 0.014, 0.46, 6]} /><meshStandardMaterial color="#c9b891" metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[0.19, -0.05, 0]} rotation={[0, 0, 1.1]}><cylinderGeometry args={[0.014, 0.014, 0.46, 6]} /><meshStandardMaterial color="#c9b891" metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, -0.35]}><torusGeometry args={[0.07, 0.012, 5, 16, Math.PI * 1.6]} /><meshStandardMaterial color="#d5c5a1" metalness={0.7} roughness={0.3} /></mesh>
    </group>
    <mesh position={[0, 4.3, 0]}><cylinderGeometry args={[0.004, 0.004, 3.8, 5]} /><meshStandardMaterial color="#38434b" /></mesh>
  </group>;
}

function legacyMotion(pose: Pose, time: number, progress?: number): ActorMotion {
  if (pose === 'bicycle') return bicycleAction(progress === undefined ? time % 6.4 : progress * 6.4).motion;
  if (pose === 'run') return runningMotion(time, .45);
  if (pose === 'kick') return poseAction('dribble', time).motion;
  if (pose === 'celebrate') return poseAction('celebrate', time).motion;
  const motion = baseMotion(pose === 'hold-light' ? 'proud' : 'neutral');
  if (pose === 'hold-light') motion.arms = [
    {shoulder: [-.8, .2, -.15], elbow: 1, wrist: 0},
    {shoulder: [-.8, -.2, .15], elbow: 1, wrist: 0},
  ];
  return motion;
}

function Arm({side, skin, shirt, trim, pose, shoulderDrop, gloves}: {
  side: number; skin: string; shirt: string; trim: string; pose: ArmPose; shoulderDrop: number; gloves?: string;
}) {
  return <group position={[side * .42, 1.95 - shoulderDrop, 0]} rotation={pose.shoulder}>
    <Capsule position={[0, -.105, 0]} scale={[.17, .07, .17]} color={shirt} />
    <mesh position={[0, -.205, 0]}><cylinderGeometry args={[.146, .146, .04, 9]} /><meshStandardMaterial color={trim} /></mesh>
    <Capsule position={[0, -.31, 0]} scale={[.11, .073, .11]} color={skin} />
    <group position={[0, -.42, 0]} rotation={[pose.elbow, 0, 0]}>
      <mesh><sphereGeometry args={[.105, 9, 7]} /><meshStandardMaterial color={skin} roughness={.85} /></mesh>
      <Capsule position={[0, -.19, 0]} scale={[.09, .127, .09]} color={skin} />
      <group position={[0, -.40, 0]} rotation={[pose.wrist, 0, 0]}>
        <Capsule position={[0, -.065, .015]} scale={[.088, .055, .065]} color={gloves ?? skin} />
      </group>
    </group>
  </group>;
}

function CharacterHead({skin, child, silhouette, motion, time, character}: {
  skin: string; child: boolean; silhouette: boolean; motion: ActorMotion; time: number; character: CharacterAppearance;
}) {
  const face = facialState(motion);
  const kind = child ? 'round' : character.face ?? 'ronaldo';
  const style = character.hair ?? (child ? 'curls' : 'swept');
  const hairColor = character.hairColor ?? (child ? '#30241f' : '#241e20');
  const headProfile = useMemo(() => {
    const wideJaw = kind === 'square';
    const elongate = kind === 'long' ? 1.1 : 1;
    const width = kind === 'long' ? .93 : 1;
    return [[0, -.36], [.10, -.34], [wideJaw ? .225 : .20, -.29], [wideJaw ? .295 : .28, -.16],
      [.30, 0], [.27, .18], [.18, .28], [.065, .33], [0, .35]]
      .map(([radius, height]) => new Vector2(radius * width, height * elongate));
  }, [kind]);
  const hairProfile = useMemo(() => {
    const padding = style === 'crop' ? .010 : .014;
    if (kind === 'round') {
      const top = .34 * (child ? 1.02 : 1.01);
      const profile = Array.from({length: 9}, (_, index) => {
        const height = .14 + (top - .14) * index / 8;
        return new Vector2(.34 * Math.sqrt(Math.max(0, 1 - (height / top) ** 2)) + padding, height + padding);
      });
      profile.push(new Vector2(0, top + padding * 2));
      return profile;
    }
    const profile = headProfile.filter(point => point.y >= .17)
      .map(point => new Vector2(point.x + padding, point.y + padding));
    profile.push(new Vector2(0, headProfile.at(-1)!.y + padding * 2));
    return profile;
  }, [headProfile, kind, child, style]);
  const mouth = useMemo(() => new TubeGeometry(new QuadraticBezierCurve3(
    new Vector3(-.064, 0, 0), new Vector3(0, -.05 * face.smile, .002), new Vector3(.064, 0, 0)),
  10, .0085, 4, false), [face.smile]);
  useEffect(() => () => mouth.dispose(), [mouth]);
  const blinkPhase = (time + .7) % 5.3;
  const blink = blinkPhase > 5.16 ? Math.max(.06, Math.abs(blinkPhase - 5.23) / .07) : 1;
  const front = child ? .296 : kind === 'round' ? .291 : kind === 'long' ? .252 : .267;
  const eyeRadius = child ? .067 : .057;
  const tuftCount = style === 'swept' ? 4 : style === 'curls' ? 6 : style === 'short' ? 2 : 0;
  return <group position={[0, child ? 2.46 : 2.49, 0]} rotation={motion.head} scale={child ? [1.03, 1.03, 1] : 1}>
    <mesh scale={kind === 'round' ? [child ? .98 : .99, child ? 1.02 : 1.01, child ? .94 : .92] : [1, 1, .91]} castShadow>
      {kind === 'round' ? <sphereGeometry args={[.34, 18, 14]} /> : <latheGeometry args={[headProfile, 18]} />}
      <meshStandardMaterial color={skin} roughness={.82} />
    </mesh>
    {child && [-1, 1].map(side => <mesh key={`cheek${side}`} position={[side * .19, -.06, .25]} scale={[.8, .55, .5]}>
      <sphereGeometry args={[.07, 9, 7]} /><meshStandardMaterial color={skin} roughness={.88} />
    </mesh>)}
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * .3, -.005, -.025]} scale={[.58, 1, .7]} castShadow>
        <sphereGeometry args={[child ? .078 : .085, 8, 8]} /><meshStandardMaterial color={skin} roughness={.85} />
      </mesh>
      {!silhouette && <>
        <mesh position={[side * .115, .045, front]} scale={[1, face.eye * blink, .3]}>
          <sphereGeometry args={[eyeRadius, 10, 8]} /><meshStandardMaterial color="#ece9d9" roughness={.45} />
        </mesh>
        {blink > .15 && <mesh position={[side * .115 + motion.gaze[0] * .020, .044 + motion.gaze[1] * .021, front + .019]}>
          <sphereGeometry args={[child ? .027 : .023, 8, 8]} /><meshStandardMaterial color="#302d2b" />
        </mesh>}
        <mesh position={[side * .11, .119 + face.lift, front + .005]} rotation={[0, 0, -side * face.brow]}>
          <boxGeometry args={[child ? .10 : .12, child ? .019 : .025, .022]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      </>}
    </group>)}
    <mesh position={[0, -.014, front + (child ? .02 : .035)]} rotation={child ? [0, 0, 0] : [Math.PI / 2, 0, 0]}
      scale={child ? [.78, .68, 1] : [1, 1, 1]}>
      {child ? <sphereGeometry args={[.04, 10, 8]} /> : <coneGeometry args={[kind === 'long' ? .049 : .043, .09, 7]} />}
      <meshStandardMaterial color={skin} roughness={.85} />
    </mesh>
    {!silhouette && <mesh position={[0, -.145, front + .007]} geometry={mouth}>
      <meshStandardMaterial color="#784b3d" roughness={.9} />
    </mesh>}
    <mesh scale={kind === 'round' ? [child ? .98 : .99, 1, child ? .94 : .92] : [1, 1, .91]} castShadow>
      <latheGeometry args={[hairProfile, 18]} />
      <meshStandardMaterial color={hairColor} roughness={.94} />
    </mesh>
    <mesh position={[0, .035, -.15]} scale={[.93, .84, .60]} castShadow>
      <sphereGeometry args={[.285, 12, 9]} /><meshStandardMaterial color={hairColor} roughness={.94} />
    </mesh>
    {Array.from({length: tuftCount}, (_, index) => <mesh key={index}
      position={style === 'curls' ? [-.20 + index * .08, .285 + Math.sin(index * 1.5) * .025 + (kind === 'long' ? .035 : 0), .04]
        : [-.16 + index * .09, .30 + index * .012 + (kind === 'long' ? .035 : 0), .035 - index * .025]}
      rotation={style === 'curls' ? [0, 0, 0] : [-.48, .18, -.25]}
      scale={style === 'curls' ? [.95, .87, 1] : [.82, .58, 1.72]} castShadow>
      <sphereGeometry args={[style === 'curls' ? .078 : .09, 9, 7]} />
      <meshStandardMaterial color={hairColor} roughness={.9} />
    </mesh>)}
  </group>;
}

export function Player3D({outfit, pose = 'idle', child = false, progress, silhouette = false,
  motion, character = {}}: Player3DProps) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const m = motion ?? legacyMotion(pose, t, progress);
  const skin = silhouette ? '#18212a' : character.skin ?? '#bc845f';
  const kit = kits[outfit];
  const shirt = silhouette ? '#19222a' : kit.shirt;
  const trim = silhouette ? '#334447' : kit.trim;
  const breath = m.breath + Math.sin(t * 2.2) * .004;
  if (pose === 'shirt') return <group userData={{insertSubject: 'shirt', visualCheckRole: 'shirt', outfit}} rotation={[0, Math.sin(t * .22) * .06, Math.sin(t * .4) * .008]}>
    <HangingShirt outfit={outfit} />
  </group>;
  return <group userData={{mainCharacter: !character.face, visualCheckRole: !character.face ? 'lead' : 'support', outfit, child}}
    position={m.position} rotation={[0, m.yaw, 0]}>
    <group scale={child ? .68 : 1}>
      <group position={[0, m.hipHeight, 0]} rotation={m.pelvis}>
        <mesh position={[0, .085, 0]} scale={[.325, .185, .225]} castShadow><sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={silhouette ? '#141c23' : kit.shorts} roughness={.85} /></mesh>
        {m.legs.map((leg, index) => <group key={index} position={[index === 0 ? -.19 : .19, 0, 0]} rotation={leg.hip}>
          <Capsule position={[0, -.14, 0]} scale={[.157, .11, .155]} color={silhouette ? '#141c23' : kit.shorts} />
          <Capsule position={[0, -.35, 0]} scale={[.13, .093, .13]} color={skin} />
          <group position={[0, -THIGH, 0]} rotation={[leg.knee, 0, 0]}>
            <mesh><sphereGeometry args={[.111, 9, 7]} /><meshStandardMaterial color={skin} roughness={.85} /></mesh>
            <Capsule position={[0, -SHIN / 2, 0]} scale={[.105, SHIN / 3, .105]} color={silhouette ? '#17212a' : kit.socks} />
            <mesh position={[0, -.065, 0]}><cylinderGeometry args={[.109, .109, .042, 9]} /><meshStandardMaterial color={trim} /></mesh>
            <group position={[0, -SHIN, 0]} rotation={[leg.ankle, 0, 0]}>
              <mesh position={BOOT_GEOMETRY.upperCenter} scale={BOOT_GEOMETRY.upperScale} castShadow>
                <sphereGeometry args={[BOOT_GEOMETRY.upperRadius, 12, 8]} /><meshStandardMaterial color={child ? '#47382c' : '#1e2935'} roughness={.5} /></mesh>
              <mesh position={BOOT_GEOMETRY.soleCenter} scale={BOOT_GEOMETRY.soleRadii} castShadow><sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color={child ? '#302923' : '#121c29'} roughness={.72} /></mesh>
            </group>
          </group>
        </group>)}
        <group rotation={m.torso}>
          <group scale={[Math.max(.82, Math.min(1.18, character.build ?? 1)), Math.max(.88, Math.min(1.12, character.height ?? 1)), Math.max(.82, Math.min(1.18, character.build ?? 1))]}>
          <group position={[0, -HIP_HEIGHT + breath, 0]}>
            <Jersey outfit={outfit} dark={silhouette} sleeves={false} number={character.number ?? 7} width={child ? .94 : 1} />
            {m.arms.map((arm, index) => <Arm key={index} side={index === 0 ? -1 : 1} skin={skin}
              shirt={shirt} trim={trim} pose={arm} shoulderDrop={m.shoulderDrop} gloves={character.gloves} />)}
            <mesh position={[0, 2.14, 0]} castShadow><cylinderGeometry args={[.12, .14, .24, 10]} />
              <meshStandardMaterial color={skin} roughness={.85} /></mesh>
            <CharacterHead skin={skin} child={child} silhouette={silhouette} motion={m} time={t} character={character} />
            {pose === 'hold-light' && <group position={[0, 1.65, .62]}>
              <mesh><icosahedronGeometry args={[.22, 1]} /><meshStandardMaterial color="#ffdc83" emissive="#ffbc39" emissiveIntensity={3} roughness={.15} metalness={.4} /></mesh>
              <pointLight color="#ffc35b" intensity={4} distance={4} decay={2} />
            </group>}
          </group>
          </group>
        </group>
      </group>
    </group>
  </group>;
}

export default Player3D;
