import React from 'react';
import {Stadium} from '../components/Stadium';
import {bootPosition, poseAction} from '../animation/football';
import {FootballActor, GENERIC_CAST, ReactionActor} from './ActionCharacters';
import {LockerRoom, PlayerTunnel} from './Environments';
import {Goal, SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

export default function Scene04({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 6) {
    const sample = poseAction('run', seconds * .45);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 1.4
      ? {position: [toe[0] + .7, .3, toe[2] + 1.8] as [number, number, number], target: [toe[0], .18, toe[2]], fov: 39}
      : seconds < 3.8
        ? {position: [.7, 2.5, p[2] + 3] as [number, number, number], target: [0, 2.4, p[2]], fov: 36}
        : {position: [2, 1.5, p[2] + 6.5] as [number, number, number], target: [0, 1.45, p[2]], fov: 41};
    return <SceneWorld progress={progress} mood="united" background="#09121b"
      shot={{...shot, target: shot.target as [number, number, number]}}>
      <PlayerTunnel /><FootballActor sample={sample} outfit="united" ball={false} />
    </SceneWorld>;
  }
  if (seconds < 25) {
    const retry = seconds >= 15;
    const sample = poseAction(retry ? 'training' : 'dribble', seconds - (retry ? 15 : 6));
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    if (seconds >= 13 && seconds < 15) return <SceneWorld progress={progress} mood="united" background="#100b19"
      shot={{position: [.8, 2.48, 2.7], target: [0, 2.4, 0], fov: 35}}>
      <Stadium mood="united" /><Goal /><ReactionActor seconds={seconds - 13} outfit="united" emotion="frustrated" gaze={[.18, -.25]} />
    </SceneWorld>;
    const close = (seconds >= 9 && seconds < 11.4) || (seconds >= 18 && seconds < 20.4);
    const side = seconds >= 21.8;
    const shot = close
      ? {position: [toe[0] + 1.3, .5, toe[2] + 2.3] as [number, number, number], target: [toe[0], .3, toe[2] - .4], fov: 43}
      : side
        ? {position: [p[0] - 5.2, 1.4, p[2] - .3] as [number, number, number], target: [p[0], 1.4, p[2] - .3], fov: 40}
        : {position: [p[0] + 3, 1.65, p[2] + 6.6] as [number, number, number], target: [p[0], 1.2, p[2] - 1.3], fov: 43};
    return <SceneWorld progress={progress} mood="united" background="#100b19"
      shot={{...shot, target: shot.target as [number, number, number]}}>
      <Stadium mood="united" /><Goal /><FootballActor sample={sample} outfit="united" />
      <ReactionActor seconds={seconds} outfit="sporting" position={[2.8, 0, -3.2]} yaw={.5} emotion="focus" gaze={[-.4, -.1]}
        character={GENERIC_CAST.opponent} />
    </SceneWorld>;
  }
  if (seconds < 27.2) return <SceneWorld progress={progress} mood="united" background="#100b19"
    shot={{position: [.6, 2.46, 2.7], target: [0, 2.4, 0], fov: 36}}>
    <Stadium mood="united" /><ReactionActor seconds={seconds - 25} outfit="united" emotion="relieved" gaze={[-.15, .02]} />
  </SceneWorld>;
  const shot = seconds < 29.4
    ? {position: [-1.1, 1.9, 1] as [number, number, number], target: [-2.45, 1.55, -2.2] as [number, number, number], fov: 36}
    : seconds < 32.6
      ? {position: [.5, 2.5, 2.75] as [number, number, number], target: [0, 2.4, 0] as [number, number, number], fov: 35}
      : {position: [3.2, 1.65, 6.4] as [number, number, number], target: [.3, 1.5, -.2] as [number, number, number], fov: 40};
  return <SceneWorld progress={progress} shot={shot} mood="united" background="#07111a">
    <LockerRoom accent="#9e3341" awards />
    <ReactionActor seconds={seconds - 27.2} outfit="united" emotion="proud" emotionFrom="relieved"
      emotionBlend={(seconds - 29.4) / 3.2} gaze={[-.2, -.02]} />
    {seconds > 32.6 && <ReactionActor seconds={seconds - 32.6} outfit="united" position={[1.6, 0, -.45]} yaw={-.5}
      emotion="smile" gaze={[-.35, -.02]} character={GENERIC_CAST.teammateUnited} />}
  </SceneWorld>;
}
