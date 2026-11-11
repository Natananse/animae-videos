import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {sentenceAt, syncSentences, trophyEvents} from '../animation/sync';
import {TrophySequence, type TrophyEvent} from '../components/TrophyMoments';
import {poseAction} from '../animation/football';
import {actionElapsed, syncedScore} from '../animation/continuousMotion';
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
  const actionTime = actionElapsed(syncSentences.filter(row => row.sceneId === sceneId), cue.id, seconds);
  const awards = trophyEvents.map(event => ({...event, start: event.startSeconds, duration: 1.5})) as TrophyEvent[];
  const inAwardSequence = (sceneId === 'scene04' && seconds >= 16.15 && outfit === 'united') ||
    (sceneId === 'scene05' && ((seconds >= 3.52 && seconds < 12) || seconds >= 29.15)) ||
    (sceneId === 'scene07' && seconds >= 1.01 && action !== 'score' && seconds < 14.4);
  if (inAwardSequence) return <TrophySequence events={awards} sceneId={sceneId} seconds={seconds}
    durationInFrames={1} outfit={kit} />;
  if (action === 'celebrate' && sceneId === 'scene04') return <SceneWorld progress={0} mood={kit}
    shot={{position: [.8, 2.4, 3.2], target: [0, 2, 0], fov: 38}}>
    <Stadium mood={kit} /><FootballActor sample={poseAction('celebrate', actionTime + 1.5)} outfit={kit} ball={false} />
  </SceneWorld>;
  const hasTeammates = cue.visual_cue.props.includes('teammates');
  const hasSupporters = cue.visual_cue.props.some(prop => prop.includes('supporters'));
  const applauseStart = syncSentences.find(row => row.sceneId === sceneId &&
    row.visual_cue.props.includes('applauding-supporters'))?.keySeconds ?? cue.keySeconds;
  const applauseTime = Math.max(0, seconds - applauseStart);
  const reaction = (shirt = false, room = false) => <SceneWorld progress={0} mood={kit} background="#0a1820"
    shot={{position: [.6, 2.45, 3.1], target: [0, 2, 0], fov: 38}}>
    {room || shirt ? <LockerRoom accent={kit === 'united' ? '#aa3a49' : '#43806b'} /> : <Stadium mood={kit} />}
    <ReactionActor seconds={actionTime} outfit={kit} emotion="proud" />
    {cue.visual_cue.props.includes('teammates') && <>
      <ReactionActor seconds={elapsed} outfit={kit} position={[-1.5, 0, -.9]} yaw={.3}
        emotion="smile" character={GENERIC_CAST.teammateUnited} />
      <ReactionActor seconds={elapsed} outfit={kit} position={[1.7, 0, -1.5]} yaw={-.3}
        emotion="smile" character={GENERIC_CAST.teammatePortugal} />
    </>}
    {hasSupporters && <>
      <ReactionActor seconds={applauseTime} outfit={sceneId === 'scene07' ? 'portugal' : 'juventus'} position={[hasTeammates ? -2.8 : -1.5, 0, hasTeammates ? -2.3 : -.9]} yaw={.3}
        emotion="smile" gesture="clap" character={GENERIC_CAST.supporter} />
      <ReactionActor seconds={applauseTime + .25} outfit={sceneId === 'scene07' ? 'portugal' : 'juventus'} position={[hasTeammates ? 2.8 : 1.8, 0, hasTeammates ? -2.5 : -1.5]} yaw={-.3}
        emotion="smile" gesture="clap" character={GENERIC_CAST.opponent} />
    </>}
    {shirt && <group position={[-1.4, 0, -.25]}><Player3D outfit={kit} pose="shirt" /></group>}
  </SceneWorld>;
  if (sceneId === 'scene01' && seconds >= 1.9 && seconds < 6.55) return reaction(true, true);
  if (sceneId === 'scene08' && seconds < 2) return reaction(true, true);
  if (sceneId === 'scene05' && seconds >= 18.4 && seconds < 29.15) return reaction();
  if ((sceneId === 'scene04' && outfit === 'madrid') ||
    (sceneId === 'scene07' && (outfit === 'alnassr' || action === 'shirt'))) return reaction(action === 'shirt', action === 'shirt');
  if (sceneId === 'scene06' && (action === 'shirt' || action === 'reaction')) return reaction(action === 'shirt', true);
  if (action === 'score' && (sceneId === 'scene04' || sceneId === 'scene07')) {
    const sample = syncedScore(elapsed, seconds);
    return <SceneWorld progress={0} mood={kit} background="#0b1820"
      shot={{position: [2, 1.7, 5], target: [0, 1.5, 0], fov: 40}}>
      <Stadium mood={kit} /><Goal netTime={Math.max(0, elapsed - .9)} />
      <FootballActor sample={sample} outfit={kit} />
    </SceneWorld>;
  }
  if (sceneId === 'scene03') {
    const sample = poseAction(action === 'run' ? 'run' : 'training', actionTime);
    const p = sample.motion.position;
    return <SceneWorld progress={0} mood="academy" background="#123333"
      shot={{position: [p[0] + 1.5, 1.8, p[2] + 4.8], target: [p[0], 1.5, p[2]], fov: 40}}>
      <TrainingGround /><FootballActor sample={sample} outfit="sporting" />
      <ReactionActor seconds={elapsed} outfit="sporting" position={[2, 0, p[2] - 1.5]}
        character={GENERIC_CAST.teammatePortugal} emotion="determined" />
      {cue.visual_cue.props.includes('opponent') && <ReactionActor seconds={elapsed} outfit="united"
        position={[-2.2, 0, p[2] - 2]} character={GENERIC_CAST.opponent} emotion="focus" />}
    </SceneWorld>;
  }
  if (sceneId === 'scene06' || (sceneId === 'scene04' && action === 'run')) {
    const sample = poseAction(action === 'run' ? 'run' : action === 'training' ? 'training' : 'dribble', actionTime);
    const p = sample.motion.position;
    return <SceneWorld progress={0} warm={kit === 'alnassr'} mood={kit} background={kit === 'alnassr' ? '#8f8c78' : '#14212c'}
      shot={{position: [p[0] + 1.3, 1.8, p[2] + 4.8], target: [p[0], 1.5, p[2]], fov: 40}}>
      {kit === 'juventus' ? <TrainingGround /> : <Stadium mood={kit} warm={kit === 'alnassr'} />}
      <FootballActor sample={sample} outfit={kit} />
    </SceneWorld>;
  }
  return <>{children}</>;
}
