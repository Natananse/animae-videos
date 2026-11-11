import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {sentenceAt, trophyEvents} from '../animation/sync';
import {TrophySequence, type TrophyEvent} from '../components/TrophyMoments';
import {baseMotion, bootPosition, poseAction, type ActionSample} from '../animation/football';
import {Player3D, type Outfit} from '../components/Player3D';
import {Stadium} from '../components/Stadium';
import {FootballActor, GENERIC_CAST, ReactionActor} from './ActionCharacters';
import {LockerRoom, PlayerTunnel, TrainingGround} from './Environments';
import {Goal, SceneWorld} from './SceneWorld';

/** Sentence-specific edits preserve the original action/silence sequences elsewhere. */
export function SyncedScene({sceneId, children}: {sceneId: string; children: React.ReactNode}) {
  const {fps} = useVideoConfig();
  const seconds = useCurrentFrame() / fps;
  const cue = sentenceAt(sceneId, seconds);
  if (!cue) return <>{children}</>;
  const {action, outfit} = cue.visual_cue;
  const kit = outfit as Outfit;
  const elapsed = Math.max(0, seconds - cue.keySeconds);
  const awards = trophyEvents.map(event => ({...event, start: event.startSeconds, duration: 1.5})) as TrophyEvent[];
  const inAwardSequence = (sceneId === 'scene04' && seconds >= 16.15 && outfit === 'united') ||
    (sceneId === 'scene05' && ((seconds >= 3.52 && seconds < 12) || seconds >= 29.15)) ||
    (sceneId === 'scene07' && seconds >= 1.01 && action !== 'score' && seconds < 14.4);
  if (inAwardSequence) return <TrophySequence events={awards} sceneId={sceneId} seconds={seconds}
    durationInFrames={1} outfit={kit} />;
  if (action === 'celebrate' && sceneId === 'scene04') return <SceneWorld progress={0} mood={kit}
    shot={{position: [.8, 2.4, 3.2], target: [0, 2, 0], fov: 38}}>
    <Stadium mood={kit} /><FootballActor sample={poseAction('celebrate', elapsed + 1.5)} outfit={kit} ball={false} />
  </SceneWorld>;
  const reaction = (shirt = false, room = false) => <SceneWorld progress={0} mood={kit} background="#0a1820"
    shot={{position: [.6, 2.45, 3.1], target: [0, 2, 0], fov: 38}}>
    {room || shirt ? <LockerRoom accent={kit === 'united' ? '#aa3a49' : '#43806b'} /> : <Stadium mood={kit} />}
    <ReactionActor seconds={elapsed} outfit={kit} emotion="proud" />
    {shirt && <group position={[-1.4, 0, -.25]}><Player3D outfit={kit} pose="shirt" /></group>}
  </SceneWorld>;
  if (sceneId === 'scene01' && seconds >= 1.9 && seconds < 6.55) return reaction(true, true);
  if (sceneId === 'scene08' && seconds < 2) return reaction(true, true);
  if ((sceneId === 'scene04' && outfit === 'madrid') ||
    (sceneId === 'scene07' && (outfit === 'alnassr' || action === 'shirt'))) return reaction(action === 'shirt', action === 'shirt');
  if (sceneId === 'scene06' && (action === 'shirt' || action === 'reaction')) return reaction(action === 'shirt', true);
  if (action === 'score' && (sceneId === 'scene04' || sceneId === 'scene07')) {
    const t = Math.min(2.5, elapsed);
    const motion = baseMotion(t < 1 ? 'determined' : 'smile');
    motion.legs[1].hip[0] = -.8 * Math.exp(-t * 4);
    motion.legs[1].knee = .2;
    const boot = bootPosition(motion, 1);
    const p = Math.min(1, t / .9);
    const sample: ActionSample = {motion, ball: [boot[0] + (.7 - boot[0]) * p,
      .235 + Math.sin(p * Math.PI) * 1.1, boot[2] + (-7.86 - boot[2]) * p],
      phase: 'score', contact: t < .067, goal: t >= .9, landed: true};
    return <SceneWorld progress={0} mood={kit} background="#0b1820"
      shot={{position: [2, 1.7, 5], target: [0, 1.5, 0], fov: 40}}>
      <Stadium mood={kit} /><Goal netTime={Math.max(0, t - .9)} />
      <FootballActor sample={sample} outfit={kit} />
    </SceneWorld>;
  }
  if (sceneId === 'scene03') {
    const sample = poseAction(action === 'run' ? 'run' : 'training', elapsed);
    const p = sample.motion.position;
    return <SceneWorld progress={0} mood="academy" background="#123333"
      shot={{position: [p[0] + 1.5, 1.8, p[2] + 4.8], target: [p[0], 1.5, p[2]], fov: 40}}>
      <TrainingGround /><FootballActor sample={sample} outfit="sporting" />
      <ReactionActor seconds={elapsed} outfit="sporting" position={[2, 0, p[2] - 1.5]}
        character={GENERIC_CAST.teammatePortugal} emotion="determined" />
    </SceneWorld>;
  }
  if (sceneId === 'scene06') {
    const sample = poseAction(action === 'run' ? 'run' : action === 'training' ? 'training' : 'dribble', elapsed);
    const p = sample.motion.position;
    return <SceneWorld progress={0} warm={kit === 'alnassr'} mood={kit} background={kit === 'alnassr' ? '#8f8c78' : '#14212c'}
      shot={{position: [p[0] + 1.3, 1.8, p[2] + 4.8], target: [p[0], 1.5, p[2]], fov: 40}}>
      {kit === 'juventus' ? <TrainingGround /> : <Stadium mood={kit} warm={kit === 'alnassr'} />}
      <FootballActor sample={sample} outfit={kit} />
    </SceneWorld>;
  }
  return <>{children}</>;
}
