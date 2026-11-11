import React from 'react';
import {Player3D} from '../components/Player3D';
import {Stadium} from '../components/Stadium';
import {bootPosition, poseAction} from '../animation/football';
import {FootballActor, GENERIC_CAST, ReactionActor} from './ActionCharacters';
import {LockerRoom, PlayerTunnel} from './Environments';
import {Goal, SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

export default function Scene07({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 11.3) {
    const sample = poseAction('dribble', seconds);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 3
      ? {position: [3.8, 1.8, p[2] + 6.5] as [number, number, number], target: [0, 1.3, p[2] - .8], fov: 43}
      : seconds < 5.6
        ? {position: [toe[0] + 1.3, .5, toe[2] + 2.5] as [number, number, number], target: [toe[0], .3, toe[2] - .3], fov: 43}
        : seconds < 8.1
          ? {position: [4.8, 1.5, p[2] - .4] as [number, number, number], target: [0, 1.4, p[2]], fov: 40}
          : {position: [p[0] + 1.6, 2.45, p[2] - 3.2] as [number, number, number], target: [0, 2.4, p[2]], fov: 37};
    return <SceneWorld progress={progress} mood="portugal" background="#0b1820"
      shot={{...shot, target: shot.target as [number, number, number]}}>
      <Stadium mood="portugal" /><Goal /><FootballActor sample={sample} outfit="portugal" />
      <ReactionActor seconds={seconds} outfit="portugal" position={[2.6, 0, -2.8]} yaw={-.4}
        emotion="determined" gaze={[-.3, -.05]} character={GENERIC_CAST.teammatePortugal} />
    </SceneWorld>;
  }
  if (seconds < 15.2) return <SceneWorld progress={progress} mood="portugal" background="#0b1820"
    shot={seconds < 13.2 ? {position: [.65, 2.48, 2.7], target: [0, 2.4, 0], fov: 35}
      : {position: [2.4, 2.48, 2.5], target: [1.8, 2.4, -.4], fov: 36}}>
    <Stadium mood="portugal" />
    <ReactionActor seconds={seconds - 11.3} outfit="portugal" emotion="relieved" emotionFrom="determined"
      emotionBlend={(seconds - 11.3) / 1.2} gaze={[.2, .03]} />
    {seconds >= 13.2 && <ReactionActor seconds={seconds - 13.2} outfit="portugal" position={[1.8, 0, -.4]}
      yaw={-.25} emotion="smile" gaze={[-.3, .03]} character={GENERIC_CAST.teammatePortugal} />}
  </SceneWorld>;
  if (seconds < 23.1) return <SceneWorld progress={progress} mood="portugal" background="#09161c"
    shot={seconds < 17.8 ? {position: [-1.3, 1.9, 1], target: [-2.45, 1.5, -2.2], fov: 37}
      : seconds < 20.5 ? {position: [.6, 2.5, 2.75], target: [0, 2.4, 0], fov: 36}
        : {position: [2.8, 1.7, 6], target: [.3, 1.5, -.2], fov: 41}}>
    <LockerRoom accent="#43806b" awards />
    <ReactionActor seconds={seconds - 15.2} outfit="portugal" emotion="proud" emotionFrom="relieved"
      emotionBlend={(seconds - 15.2) / 2} gaze={[-.2, -.04]} />
    {seconds >= 20.5 && <ReactionActor seconds={seconds - 20.5} outfit="portugal" position={[1.7, 0, -.4]}
      yaw={-.3} emotion="smile" gaze={[-.3, .02]} character={GENERIC_CAST.teammatePortugal} />}
  </SceneWorld>;
  if (seconds < 27.1) {
    const sample = poseAction('run', (seconds - 23.1) * .33);
    const p = sample.motion.position;
    return <SceneWorld progress={progress} mood="farewell" background="#07121b"
      shot={{position: [1.4, 1.5, p[2] + 5.4], target: [0, 1.45, p[2]], fov: 39}}>
      <PlayerTunnel accent="#365e57" /><FootballActor sample={sample} outfit="portugal" ball={false} />
    </SceneWorld>;
  }
  return <SceneWorld progress={progress} mood="farewell" background="#07121b"
    shot={{position: [.55, 2.48, 2.75], target: [0, 2.4, 0], fov: 35}}>
    <LockerRoom accent="#365e57" />
    <ReactionActor seconds={seconds - 27.1} outfit="portugal" emotion="proud" emotionFrom="sad"
      emotionBlend={(seconds - 28.6) / 2.7} gaze={[-.2, -.04]} gazeFrom={[-.3, -.15]} />
    <group position={[-1.6, 0, -.8]}><Player3D outfit="portugal" pose="shirt" /></group>
  </SceneWorld>;
}
