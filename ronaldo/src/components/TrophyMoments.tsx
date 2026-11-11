import React, {useEffect, useMemo} from 'react';
import {CanvasTexture, CatmullRomCurve3, LinearFilter, SRGBColorSpace, Vector2, Vector3} from 'three';
import {sentenceAt} from '../animation/sync';
import {Player3D, type Outfit} from './Player3D';
import {GENERIC_CAST, ReactionActor} from '../scenes/ActionCharacters';
import {LockerRoom} from '../scenes/Environments';
import {Box, SceneWorld} from '../scenes/SceneWorld';
import {getTrophyState, isTrophyWindow, trophyCamera, trophyLiftMotion, trophyOutfit,
  type EarnedTrophy, type TrophyEvent, type TrophyKind, type TrophyState} from '../animation/trophies';

export {getTrophyState, isTrophyWindow, trophyCamera, trophyLiftMotion, trophiesEarnedBy} from '../animation/trophies';
export type {TrophyEvent, TrophyKind, TrophyState} from '../animation/trophies';

const gold = '#dcb865';
const silver = '#c7d5db';
const Metal: React.FC<{color?: string}> = ({color = gold}) =>
  <meshStandardMaterial color={color} metalness={.82} roughness={.23} />;

const CupBody: React.FC<{kind: TrophyKind}> = ({kind}) => {
  const isLeague = kind === 'premier-league';
  const isEuro = kind === 'euro';
  const color = isLeague ? '#d5cbb1' : silver;
  const profile = useMemo(() => (isEuro
    ? [[.10, .25], [.15, .35], [.24, .47], [.31, .69], [.32, .9], [.27, 1.1], [.25, 1.18]]
    : isLeague
      ? [[.12, .28], [.20, .42], [.25, .58], [.26, .84], [.30, 1.02], [.31, 1.13]]
      : [[.09, .25], [.12, .40], [.27, .55], [.36, .75], [.40, 1.03], [.40, 1.18]])
    .map(([radius, y]) => new Vector2(radius, y)), [isEuro, isLeague]);
  const handle = useMemo(() => [-1, 1].map(side => new CatmullRomCurve3([
    new Vector3(side * .30, 1.09, 0), new Vector3(side * .64, 1.29, 0),
    new Vector3(side * .68, .87, 0), new Vector3(side * .31, .59, 0),
  ])), []);
  return <>
    <mesh castShadow><latheGeometry args={[profile, 24]} /><Metal color={color} /></mesh>
    <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[isEuro ? .25 : isLeague ? .31 : .40, .024, 6, 28]} /><Metal color={color} />
    </mesh>
    {handle.map((curve, index) => <mesh key={index} castShadow>
      <tubeGeometry args={[curve, 14, .037, 6, false]} /><Metal color={color} />
    </mesh>)}
    {isLeague && Array.from({length: 7}, (_, index) => {
      const angle = index / 7 * Math.PI * 2;
      return <mesh key={index} position={[Math.cos(angle) * .22, 1.24, Math.sin(angle) * .22]}>
        <coneGeometry args={[.045, .22, 5]} /><Metal />
      </mesh>;
    })}
  </>;
};

/** Deliberately generic silhouettes. No marks, letters, crests or sponsors. */
export const GenericTrophy: React.FC<{kind: TrophyKind}> = ({kind}) => <>
  <mesh position={[0, .08, 0]} castShadow><cylinderGeometry args={[.29, .32, .16, 12]} />
    <meshStandardMaterial color="#172a32" metalness={.45} roughness={.32} />
  </mesh>
  <mesh position={[0, .20, 0]} castShadow><cylinderGeometry args={[.11, .18, .13, 12]} /><Metal /></mesh>
  {kind === 'ballon-dor' ? <>
    <mesh position={[0, .36, 0]} castShadow><icosahedronGeometry args={[.24, 0]} /><Metal color="#b69a61" /></mesh>
    <mesh position={[0, .82, 0]} castShadow><icosahedronGeometry args={[.40, 2]} /><Metal /></mesh>
    {[0, 1, 2].map(index => <mesh key={index} position={[0, .82, 0]} rotation={[index * 1.1, index * .8, index * 1.9]}>
      <torusGeometry args={[.401, .006, 3, 26]} /><Metal color="#a9853c" />
    </mesh>)}
  </> : kind === 'fifa-player' ? <>
    <mesh position={[0, .64, 0]} rotation={[0, 0, -.15]} castShadow>
      <capsuleGeometry args={[.12, .59, 5, 12]} /><Metal color="#b8874e" />
    </mesh>
    <mesh position={[.08, 1.07, 0]} castShadow><sphereGeometry args={[.15, 12, 8]} /><Metal color="#b8874e" /></mesh>
    <mesh position={[-.16, .77, .04]} rotation={[0, 0, -.8]} castShadow>
      <capsuleGeometry args={[.065, .37, 4, 8]} /><Metal color="#b8874e" />
    </mesh>
    <mesh position={[.22, .58, .1]}><sphereGeometry args={[.16, 12, 8]} /><Metal /></mesh>
  </> : kind === 'nations-league' ? <>
    {Array.from({length: 6}, (_, index) => <mesh key={index} position={[0, .76, 0]}
      rotation={[.10, index * Math.PI / 3, .23]} castShadow>
      <boxGeometry args={[.055, 1.02, .40]} /><Metal color={index % 2 ? '#a8bec8' : '#e0e8e9'} />
    </mesh>)}
  </> : <CupBody kind={kind} />}
</>;

const AwardYear: React.FC<{year: number}> = ({year}) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 80;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#14212a'; context.fillRect(0, 0, 256, 80);
    context.fillStyle = '#ffe7b4'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = '600 57px Arial, sans-serif'; context.fillText(String(year), 128, 43);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter; result.generateMipmaps = false; return result;
  }, [year]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, -.17, .5]}>
    <planeGeometry args={[.75, .235]} /><meshBasicMaterial map={texture} transparent toneMapped={false} />
  </mesh>;
};

const Award: React.FC<{item: EarnedTrophy; position: [number, number, number]; scale: number; year?: boolean}> =
({item, position, scale, year = true}) => <group position={position} scale={scale}
  userData={{visualCheckRole: 'trophy', trophyKind: item.kind, trophyYear: item.year, trophyId: item.id,
    trophyEventId: item.eventId}}>
  <GenericTrophy kind={item.kind} />{year && <AwardYear year={item.year} />}
</group>;

/** Cumulative earned trophies: one physical model per earned award, including the held one. */
export const TrophyMoments: React.FC<{state: TrophyState; outfit: Outfit}> = ({state, outfit}) => {
  const {motion, hand, scale} = trophyLiftMotion(state);
  const holding = state.phase === 'lift';
  const moveToFront = state.phase !== 'cabinet' && state.focus;
  const cabinet = state.earned.filter(item => !moveToFront || item.id !== state.focus!.id);
  const columns = 4;
  const rows = Math.max(1, Math.ceil(cabinet.length / columns));
  return <>
    <LockerRoom awardStage accent={outfit === 'united' ? '#aa3a49' : outfit === 'madrid' ? '#b3ab84' : '#43806b'} />
    <Box position={[-2.18, 1.35, -1.18]} size={[2.05, 2.7, .16]} color="#172b35" />
    {Array.from({length: rows}, (_, row) => <Box key={row} position={[-2.18, .40 + row * .57, -.79]}
      size={[2.05, .045, .78]} color="#776450" />)}
    {cabinet.map((item, index) => <Award key={item.id} item={item} scale={.34}
      position={[-2.915 + index % columns * .49, .44 + Math.floor(index / columns) * .57, -.55]} />)}
    <Player3D outfit={outfit} motion={motion} visualAction={state.phase === 'lift' ? 'lift' : 'celebrate'} />
    {state.phase === 'lift' && <>
      <ReactionActor seconds={state.elapsed} outfit={outfit} position={[-.35, 0, -.9]} yaw={.3}
        emotion="smile" gesture="clap" character={GENERIC_CAST.teammateUnited} />
      <ReactionActor seconds={state.elapsed + .2} outfit={outfit} position={[2.6, 0, -1.5]} yaw={-.3}
        emotion="smile" gesture="clap" character={GENERIC_CAST.teammatePortugal} />
    </>}
    {state.focus && moveToFront && (holding
      ? <Award item={state.focus} position={[hand[0], hand[1] - .07 * scale, hand[2]]} scale={scale} />
      : <>
        <Box position={[-.62, .46, .56]} size={[.94, .92, .77]} color="#1a2c36" />
        <Award item={state.focus} position={[-.62, .94, .56]} scale={.91} />
      </>)}
    <pointLight position={[-.5, 2.8, 2.4]} color="#ffdd9a" intensity={8 + state.flash * 14} distance={7} decay={2} />
    <pointLight position={[1.0, 2.9, 3.7]} color="#ffe6cb" intensity={4} distance={6} decay={2} />
  </>;
};

/** Drop in at a measured prize window; duration remains the existing scene duration. */
export const TrophySequence: React.FC<{events: TrophyEvent[]; sceneId: string; seconds: number;
  durationInFrames: number; outfit?: Outfit}> = ({events, sceneId, seconds, durationInFrames, outfit}) => {
  const state = getTrophyState(events, sceneId, seconds);
  const cue = sentenceAt(sceneId, seconds);
  if (cue?.visual_cue.action === 'lift') {
    const elapsed = Math.max(0, seconds - cue.keySeconds);
    state.phase = 'lift'; state.elapsed = elapsed;
    state.lift = Math.min(1, elapsed / .85);
    if (sceneId === 'scene07') {
      const cups = state.earned.filter(item => item.kind === 'euro' || item.kind === 'nations-league');
      state.focus = cups[Math.min(cups.length - 1, Math.floor(elapsed / 1.1))] ?? state.focus;
      state.lift = Math.min(1, (elapsed % 1.1) / .55);
    }
  }
  const kit = outfit ?? trophyOutfit(sceneId);
  return <SceneWorld progress={0} shot={trophyCamera(state)} mood="achievement" background="#08131b"
    flashTimes={events.filter(event => event.sceneId === sceneId).map(event => event.start)} faceFill>
    <TrophyMoments state={state} outfit={kit} />
  </SceneWorld>;
};
